import React, { useState, useEffect } from 'react';
import { Video, Users, Clock, Plus, Radio } from 'lucide-react';
import Button from '@/components/school/Button';
import Badge from '@/components/school/Badge';
import Tabs from '@/components/school/Tabs';
import Modal from '@/components/school/Modal';
import InputField from '@/components/school/InputField';
import SelectField from '@/components/school/SelectField';
import DataTable from '@/components/school/DataTable';
import api from '@/lib/api/school-client';
import { putFileToS3 } from '@/lib/api/upload';
import useLiveRefresh from '@/hooks/useLiveRefresh';
import { useAuth } from '@/context/SchoolAuthContext';

import './ClassManagement.css';

const ClassManagement: React.FC = () => {
  const { user } = useAuth();
  // navigate removed because calendar tab was removed
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [liveClassData, setLiveClassData] = useState([]);
  const [recordedClassData, setRecordedClassData] = useState([]);
  const [showRecordingModal, setShowRecordingModal] = useState(false);
  const [uploadingRecording, setUploadingRecording] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);
  const [recordingFile, setRecordingFile] = useState<File | null>(null);
  const [recordingForm, setRecordingForm] = useState({
    title: '',
    classId: '',
    subjectId: '',
    recordedDate: '',
    duration: '',
  });
  const [academicClasses, setAcademicClasses] = useState<any[]>([]);
  const [academicSubjects, setAcademicSubjects] = useState<any[]>([]);
  const [scheduleForm, setScheduleForm] = useState({
    title: '',
    classId: '',
    subjectId: '',
    date: '',
    time: '',
    duration: '45',
    zoomLink: '',
    googleMeetLink: '',
    liveStatus: 'scheduled',
    recurringSchedule: 'none',
  });

  const liveColumns = [
    { key: 'title', title: 'Class Title' },
    { key: 'class', title: 'Class', render: (v: string) => <Badge variant="purple">{v}</Badge> },
    { key: 'date', title: 'Date' },
    { key: 'time', title: 'Time', render: (v: string) => <span className="class__time"><Clock size={14} /> {v}</span> },
    { key: 'duration', title: 'Duration' },
    {
      key: 'status', title: 'Status', render: (v: string) => (
        <Badge variant={v === 'live' ? 'error' : 'info'}>{v === 'live' ? 'Live Now' : 'Scheduled'}</Badge>
      )
    },
    { key: 'attendees', title: 'Attendees', render: (v: number) => v > 0 ? <span className="class__attendees"><Users size={14} /> {v}</span> : '-' },
  ];

  useEffect(() => {
    fetchSchedules();
    fetchRecordedClasses();
    fetchAcademicData();
  }, []);

  const fetchAcademicData = async () => {
    try {
      const [classRes, subjectRes] = await Promise.all([
        api.get('/academic/classes'),
        api.get('/academic/subjects'),
      ]);
      const classes = classRes.data?.data ?? classRes.data ?? [];
      const subjects = subjectRes.data?.data ?? subjectRes.data ?? [];
      setAcademicClasses(Array.isArray(classes) ? classes : []);
      setAcademicSubjects(Array.isArray(subjects) ? subjects : []);
    } catch (error) {
      console.error('Failed to fetch academic master data', error);
    }
  };

  const fetchSchedules = async () => {
    try {
      const response = await api.get('/classes/schedules'); console.log(response.data);
      const formattedData = response.data.data.map((item: any) => ({
        id: item.id,
        title: item.subject_name || item.title,
        class: item.class_name,
        date: item.day_of_week,
        time: `${new Date(`1970-01-01T${item.start_time}`).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        })} - ${new Date(`1970-01-01T${item.end_time}`).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        })}`,
        duration: '-',
        status: item.live_status || 'scheduled',
        attendees: 0,
        zoomLink: item.zoom_link,
        googleMeetLink: item.google_meet_link,
      }));

      setLiveClassData(formattedData);
    } catch (error) {
      console.error('Failed to fetch schedules', error);
    }
  };

  const fetchRecordedClasses = async () => {
    try {
      const response = await api.get('/classes/recordings');

      const formattedData = response.data.data.map((item: any) => ({
        id: item.id,
        title: item.title,
        date: item.recorded_date ? new Date(item.recorded_date).toLocaleDateString('en-GB') : '-',
        duration: item.duration || '-',
        video_link: item.video_url,
        views: item.views || 0,
      }));

      setRecordedClassData(formattedData);
    } catch (error) {
      console.error('Failed to fetch recordings', error);
    }
  };

  const handleUploadRecording = async () => {
    if (!recordingForm.title.trim()) { alert('Please enter a recording title'); return; }
    if (!recordingFile) { alert('Please choose a video file to upload'); return; }
    setUploadingRecording(true);
    setUploadPct(0);
    try {
      const contentType = recordingFile.type || 'video/mp4';
      // 1) presigned URL  2) direct browser → S3 upload  3) save metadata
      const presign = await api.post('/classes/recordings/upload-url', {
        fileName: recordingFile.name,
        contentType,
        fileSize: recordingFile.size,
      });
      const { uploadUrl, fileUrl, key } = presign.data?.data ?? presign.data;
      await putFileToS3(uploadUrl, recordingFile, contentType, (e: any) => {
        if (e?.total) setUploadPct(Math.round((e.loaded / e.total) * 100));
      });
      await api.post('/classes/recordings', {
        title: recordingForm.title.trim(),
        classId: recordingForm.classId || undefined,
        subjectId: recordingForm.subjectId || undefined,
        recordedDate: recordingForm.recordedDate || undefined,
        duration: recordingForm.duration || undefined,
        videoUrl: fileUrl,
        videoKey: key,
      });
      alert('Recording uploaded successfully');
      setShowRecordingModal(false);
      setRecordingForm({ title: '', classId: '', subjectId: '', recordedDate: '', duration: '' });
      setRecordingFile(null);
      fetchRecordedClasses();
    } catch (error) {
      console.error('Failed to upload recording', error);
      alert(error instanceof Error ? error.message : 'Failed to upload recording');
    } finally {
      setUploadingRecording(false);
    }
  };

  useLiveRefresh(() => {
    fetchSchedules();
    fetchRecordedClasses();
  }, [], 30000);

  const recordedColumns = [
    { key: 'title', title: 'Recording Title' },
    { key: 'date', title: 'Date' },
    { key: 'duration', title: 'Duration' },
    {
      key: 'video_link',
      title: 'Video Link',
      render: (v: string) => (
        <a href={v} target="_blank" rel="noreferrer">
          Watch Recording
        </a>
      ),
    },
  ];

  const liveContent = (
    <div className="class__section">
      <div className="class__section-header">
        <h3>Live Classes</h3>
        <Button icon={<Plus size={16} />} onClick={() => setShowScheduleModal(true)}>Schedule Class</Button>
      </div>
      <DataTable columns={liveColumns} data={liveClassData} />    </div>
  );

  const toEndTime = (startTime: string, durationMinutes: number) => {
    const [h, m] = String(startTime || '00:00').split(':').map(Number);
    const startTotal = (h * 60) + m;
    const endTotal = startTotal + (Number.isFinite(durationMinutes) ? durationMinutes : 45);
    const endHour = Math.floor((endTotal % (24 * 60)) / 60);
    const endMinute = endTotal % 60;
    return `${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}`;
  };

  const recordedContent = (
    <div className="class__section">
      <div className="class__section-header">
        <h3>Recorded Classes</h3>
        <Button icon={<Plus size={16} />} onClick={() => setShowRecordingModal(true)}>Upload Recording</Button>
      </div>
      <DataTable columns={recordedColumns} data={recordedClassData} />    </div>
  );

  return (
    <div className="class">
      <Tabs
        tabs={[
          { id: 'live', label: 'Live Classes', icon: <Radio size={16} />, content: liveContent },
          { id: 'recorded', label: 'Recorded', icon: <Video size={16} />, content: recordedContent },
        ]}
      />

      <Modal isOpen={showScheduleModal} onClose={() => setShowScheduleModal(false)} title="Schedule New Class">
        <div className="class__modal-form">
          <InputField
            label="Class Title"
            placeholder="Enter class title"
            value={scheduleForm.title}
            onChange={(e) => setScheduleForm((prev) => ({ ...prev, title: e.target.value }))}
          />
          <SelectField
            label="Subject"
            value={scheduleForm.subjectId}
            onChange={(e) => setScheduleForm((prev) => ({ ...prev, subjectId: e.target.value }))}
            options={academicSubjects.map((s: any) => ({ value: s.id, label: s.name }))}
          />
          <SelectField
            label="Class"
            value={scheduleForm.classId}
            onChange={(e) => setScheduleForm((prev) => ({ ...prev, classId: e.target.value }))}
            options={academicClasses.map((c: any) => ({ value: c.id, label: c.name }))}
          />
          <div className="class__modal-row">
            <InputField
              label="Date"
              type="date"
              value={scheduleForm.date}
              onChange={(e) => setScheduleForm((prev) => ({ ...prev, date: e.target.value }))}
            />
            <InputField
              label="Time"
              type="time"
              value={scheduleForm.time}
              onChange={(e) => setScheduleForm((prev) => ({ ...prev, time: e.target.value }))}
            />
          </div>
          <InputField
            label="Duration"
            placeholder="e.g., 45"
            value={scheduleForm.duration}
            onChange={(e) => setScheduleForm((prev) => ({ ...prev, duration: e.target.value }))}
          />
          <InputField
            label="Zoom Link"
            placeholder="https://zoom.us/j/..."
            value={scheduleForm.zoomLink}
            onChange={(e) => setScheduleForm((prev) => ({ ...prev, zoomLink: e.target.value }))}
          />
          <InputField
            label="Google Meet Link"
            placeholder="https://meet.google.com/..."
            value={scheduleForm.googleMeetLink}
            onChange={(e) => setScheduleForm((prev) => ({ ...prev, googleMeetLink: e.target.value }))}
          />
          <SelectField
            label="Live Status"
            value={scheduleForm.liveStatus}
            onChange={(e) => setScheduleForm((prev) => ({ ...prev, liveStatus: e.target.value }))}
            options={[
              { value: 'scheduled', label: 'Scheduled' },
              { value: 'ongoing', label: 'Ongoing' },
              { value: 'completed', label: 'Completed' },
            ]}
          />
          <SelectField
            label="Recurring Schedule"
            value={scheduleForm.recurringSchedule}
            onChange={(e) => setScheduleForm((prev) => ({ ...prev, recurringSchedule: e.target.value }))}
            options={[
              { value: 'none', label: 'One-time' },
              { value: 'daily', label: 'Daily' },
              { value: 'weekly', label: 'Weekly' },
              { value: 'monthly', label: 'Monthly' },
            ]}
          />
          <div className="class__modal-actions">
            <Button variant="outline" onClick={() => setShowScheduleModal(false)}>Cancel</Button>
            <Button
              onClick={async () => {
                try {
                  if (!scheduleForm.classId || !scheduleForm.subjectId || !scheduleForm.date || !scheduleForm.time) {
                    console.log('Form validation failed:', scheduleForm);
                    alert('Please fill in class, subject, date and time fields');
                    return;
                  }

                  const dayOfWeek = new Date(scheduleForm.date).toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
                  const durationMin = parseInt(scheduleForm.duration, 10) || 45;
                  const payload = {
                    class_id: scheduleForm.classId,
                    subject_id: scheduleForm.subjectId,
                    teacher_id: user?.id,
                    day_of_week: dayOfWeek,
                    start_time: scheduleForm.time,
                    end_time: toEndTime(scheduleForm.time, durationMin),
                    type: 'live',
                    zoom_link: scheduleForm.zoomLink,
                    google_meet_link: scheduleForm.googleMeetLink,
                    live_status: scheduleForm.liveStatus,
                    recurring_schedule: scheduleForm.recurringSchedule === 'none' ? null : { pattern: scheduleForm.recurringSchedule },
                  };

                  console.log('Scheduling with payload:', payload);
                  await api.post('/classes/schedules', payload);

                  alert('Class scheduled successfully');
                  fetchSchedules();

                  setShowScheduleModal(false);
                  setScheduleForm({ title: '', classId: '', subjectId: '', date: '', time: '', duration: '45', zoomLink: '', googleMeetLink: '', liveStatus: 'scheduled', recurringSchedule: 'none' });
                } catch (error) {
                  console.error('Failed to create schedule', error);
                  const errorMessage = error instanceof Error
                    ? error.message
                    : 'Failed to schedule class';
                  alert(errorMessage);
                }
              }}
            >
              Schedule Class
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showRecordingModal} onClose={() => !uploadingRecording && setShowRecordingModal(false)} title="Upload Recorded Class">
        <div className="class__modal-form">
          <InputField
            label="Recording Title"
            placeholder="e.g., Thermodynamics — Lecture 3"
            value={recordingForm.title}
            onChange={(e) => setRecordingForm((prev) => ({ ...prev, title: e.target.value }))}
          />
          <SelectField
            label="Class"
            value={recordingForm.classId}
            onChange={(e) => setRecordingForm((prev) => ({ ...prev, classId: e.target.value }))}
            options={academicClasses.map((c: any) => ({ value: c.id, label: c.name }))}
          />
          <SelectField
            label="Subject"
            value={recordingForm.subjectId}
            onChange={(e) => setRecordingForm((prev) => ({ ...prev, subjectId: e.target.value }))}
            options={academicSubjects.map((s: any) => ({ value: s.id, label: s.name }))}
          />
          <div className="class__modal-row">
            <InputField
              label="Recorded Date"
              type="date"
              value={recordingForm.recordedDate}
              onChange={(e) => setRecordingForm((prev) => ({ ...prev, recordedDate: e.target.value }))}
            />
            <InputField
              label="Duration"
              placeholder="e.g., 45 min"
              value={recordingForm.duration}
              onChange={(e) => setRecordingForm((prev) => ({ ...prev, duration: e.target.value }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-600">Video file</label>
            <input
              type="file"
              accept="video/*,audio/*"
              onChange={(e) => setRecordingFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
            />
            {recordingFile && (
              <p className="mt-1 text-xs text-slate-400">{recordingFile.name} · {(recordingFile.size / 1024 / 1024).toFixed(1)} MB</p>
            )}
            <p className="mt-1 text-xs text-slate-400">Max 2 GB · MP4, WebM, MOV, etc.</p>
          </div>
          {uploadingRecording && (
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${uploadPct}%` }} />
            </div>
          )}
          <div className="class__modal-actions">
            <Button variant="outline" disabled={uploadingRecording} onClick={() => setShowRecordingModal(false)}>Cancel</Button>
            <Button disabled={uploadingRecording} onClick={handleUploadRecording}>
              {uploadingRecording ? `Uploading… ${uploadPct}%` : 'Upload Recording'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ClassManagement;
