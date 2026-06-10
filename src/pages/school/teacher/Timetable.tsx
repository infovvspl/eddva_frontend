import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, Plus, BookOpen, MapPin, Video, Info } from 'lucide-react';
import Button from '@/components/school/Button';
import Badge from '@/components/school/Badge';
import InputField from '@/components/school/InputField';
import SelectField from '@/components/school/SelectField';
import Modal from '@/components/school/Modal';
import api from '@/lib/api/school-client';
import { useAuth } from '@/context/SchoolAuthContext';

import './Timetable.css';

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

const Timetable: React.FC = () => {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [timetableData, setTimetableData] = useState<any[]>([]);
  const [academicClasses, setAcademicClasses] = useState<any[]>([]);
  const [academicSubjects, setAcademicSubjects] = useState<any[]>([]);
  const [academicSections, setAcademicSections] = useState<any[]>([]);
  
  const [form, setForm] = useState({
    id: '',
    classId: '',
    sectionId: '',
    subjectId: '',
    dayOfWeek: 'MONDAY',
    periodNumber: '1',
    startTime: '09:00',
    endTime: '09:45',
    type: 'offline',
    room: '',
    meetingLink: '',
    remarks: '',
  });

  useEffect(() => {
    fetchAcademicData();
    fetchTimetable();
  }, []);

  const fetchAcademicData = async () => {
    try {
      // In a real scenario, this would be an endpoint filtering by teacher assignments.
      // Currently using general lists. The backend service validates assignment.
      const [classRes, subjectRes, sectionRes] = await Promise.all([
        api.get('/academic/classes'),
        api.get('/academic/subjects'),
        api.get('/academic/sections'),
      ]);
      setAcademicClasses(classRes.data?.data || []);
      setAcademicSubjects(subjectRes.data?.data || []);
      setAcademicSections(sectionRes.data?.data || []);
    } catch (error) {
      console.error('Failed to fetch academic data', error);
    }
  };

  const fetchTimetable = async () => {
    try {
      const res = await api.get('/timetables');
      // Filter the list on client side to show only this teacher's classes, just in case
      // the endpoint returns all for the institute. Wait, if it's the general endpoint, 
      // teacher will see all. Let's filter here for safety.
      const allTimetables = res.data?.data || [];
      const myTimetables = allTimetables.filter((t: any) => t.teacherId === user?.id);
      setTimetableData(myTimetables);
    } catch (error) {
      console.error('Failed to fetch timetable', error);
    }
  };

  const toEndTime = (startTime: string, durationMinutes: number) => {
    const [h, m] = String(startTime || '00:00').split(':').map(Number);
    const startTotal = (h * 60) + m;
    const endTotal = startTotal + durationMinutes;
    const endHour = Math.floor((endTotal % (24 * 60)) / 60);
    const endMinute = endTotal % 60;
    return `${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}`;
  };

  const handlePeriodChange = (val: string) => {
    // Auto-calculate start and end time based on period assumption
    const p = parseInt(val, 10);
    const baseHour = 8;
    const startHour = baseHour + p - 1;
    const startTime = `${String(startHour).padStart(2, '0')}:00`;
    setForm(prev => ({ 
      ...prev, 
      periodNumber: val, 
      startTime, 
      endTime: toEndTime(startTime, 45) 
    }));
  };

  const handleSubmit = async () => {
    if (!form.sectionId || !form.subjectId || !form.dayOfWeek || !form.startTime) {
      alert('Please fill out Section, Subject, Day, and Start Time');
      return;
    }
    
    const payload = {
      sectionId: form.sectionId,
      subjectId: form.subjectId,
      teacherId: user?.id,
      dayOfWeek: form.dayOfWeek,
      periodNumber: parseInt(form.periodNumber, 10),
      startTime: form.startTime,
      endTime: form.endTime,
      type: form.type,
      room: form.room,
      meetingLink: form.meetingLink,
      remarks: form.remarks,
    };

    try {
      if (form.id) {
        await api.put(`/timetables/${form.id}`, payload);
        alert('Timetable entry updated successfully!');
      } else {
        await api.post('/timetables', payload);
        alert('Timetable entry created successfully!');
      }
      setShowModal(false);
      fetchTimetable();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Failed to save timetable entry');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this class slot?')) return;
    try {
      await api.delete(`/timetables/${id}`);
      alert('Class slot cancelled successfully');
      fetchTimetable();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Failed to delete');
    }
  };

  const openEdit = (slot: any) => {
    setForm({
      id: slot.id,
      classId: slot.section?.class?.id || '',
      sectionId: slot.sectionId || '',
      subjectId: slot.subjectId || '',
      dayOfWeek: slot.dayOfWeek,
      periodNumber: String(slot.periodNumber || 1),
      startTime: slot.startTime,
      endTime: slot.endTime,
      type: slot.type || 'offline',
      room: slot.room || '',
      meetingLink: slot.meetingLink || '',
      remarks: slot.remarks || '',
    });
    setShowModal(true);
  };

  const openNew = () => {
    setForm({
      id: '', classId: '', sectionId: '', subjectId: '', dayOfWeek: 'MONDAY', periodNumber: '1', startTime: '09:00', endTime: '09:45', type: 'offline', room: '', meetingLink: '', remarks: ''
    });
    setShowModal(true);
  };

  const filteredSections = academicSections.filter((s: any) => s.class_id === form.classId);

  return (
    <div className="teacher-timetable">
      <div className="teacher-timetable__header">
        <h3>My Timetable Schedule</h3>
        <Button icon={<Plus size={16} />} onClick={openNew}>
          Add Class Slot
        </Button>
      </div>

      <div className="teacher-timetable__grid">
        <table className="teacher-timetable__table">
          <thead>
            <tr>
              <th>Period</th>
              {DAYS.map(day => (
                <th key={day}>{day.charAt(0) + day.slice(1).toLowerCase()}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERIODS.map(period => (
              <tr key={period}>
                <td className="teacher-timetable__period-cell">
                  Period {period}
                </td>
                {DAYS.map(day => {
                  const slot = timetableData.find(t => t.dayOfWeek === day && t.periodNumber === period);
                  if (slot) {
                    return (
                      <td key={`${day}-${period}`}>
                        <div 
                          className={`teacher-timetable__slot teacher-timetable__slot--${slot.type}`}
                          onClick={() => openEdit(slot)}
                        >
                          <span className="teacher-timetable__slot-subject">{slot.subject?.name || 'Subject'}</span>
                          <span className="teacher-timetable__slot-class">
                            <Users size={12} /> {slot.section?.className} - {slot.section?.name}
                          </span>
                          <span className="teacher-timetable__slot-time">
                            <Clock size={12} /> {slot.startTime} - {slot.endTime}
                          </span>
                          
                          <div className="teacher-timetable__slot-footer">
                            <Badge variant={slot.type === 'live' ? 'error' : (slot.type === 'lab' ? 'success' : 'info')}>
                              {slot.type.toUpperCase()}
                            </Badge>
                            {slot.room && <span style={{fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.25rem'}}><MapPin size={10} /> {slot.room}</span>}
                          </div>
                        </div>
                      </td>
                    );
                  }
                  return (
                    <td key={`${day}-${period}`}>
                      <div 
                        className="teacher-timetable__empty-slot" 
                        onClick={() => {
                          setForm(prev => ({ ...prev, id: '', dayOfWeek: day, periodNumber: String(period) }));
                          handlePeriodChange(String(period));
                          setShowModal(true);
                        }}
                      >
                        <Plus size={16} color="#cbd5e1" />
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={form.id ? "Edit Timetable Entry" : "Create Timetable Entry"}>
        <div className="teacher-timetable__modal-form">
          <div className="teacher-timetable__modal-row">
            <SelectField
              label="Class"
              value={form.classId}
              onChange={(e) => setForm((prev) => ({ ...prev, classId: e.target.value, sectionId: '' }))}
              options={academicClasses.map((c: any) => ({ value: c.id, label: c.name }))}
            />
            <SelectField
              label="Section"
              value={form.sectionId}
              onChange={(e) => setForm((prev) => ({ ...prev, sectionId: e.target.value }))}
              options={filteredSections.map((s: any) => ({ value: s.id, label: s.name }))}
              disabled={!form.classId}
            />
          </div>
          <SelectField
            label="Subject"
            value={form.subjectId}
            onChange={(e) => setForm((prev) => ({ ...prev, subjectId: e.target.value }))}
            options={academicSubjects.map((s: any) => ({ value: s.id, label: s.name }))}
          />
          
          <div className="teacher-timetable__modal-row">
            <SelectField
              label="Day of Week"
              value={form.dayOfWeek}
              onChange={(e) => setForm((prev) => ({ ...prev, dayOfWeek: e.target.value }))}
              options={DAYS.map(d => ({ value: d, label: d }))}
            />
            <SelectField
              label="Period Number"
              value={form.periodNumber}
              onChange={(e) => handlePeriodChange(e.target.value)}
              options={PERIODS.map(p => ({ value: String(p), label: `Period ${p}` }))}
            />
          </div>

          <div className="teacher-timetable__modal-row">
            <InputField
              label="Start Time"
              type="time"
              value={form.startTime}
              onChange={(e) => setForm((prev) => ({ ...prev, startTime: e.target.value }))}
            />
            <InputField
              label="End Time"
              type="time"
              value={form.endTime}
              onChange={(e) => setForm((prev) => ({ ...prev, endTime: e.target.value }))}
            />
          </div>

          <SelectField
            label="Class Type"
            value={form.type}
            onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value }))}
            options={[
              { value: 'offline', label: 'Offline / Regular' },
              { value: 'live', label: 'Live Virtual' },
              { value: 'lab', label: 'Lab Session' },
              { value: 'extra', label: 'Extra Class' },
            ]}
          />

          <div className="teacher-timetable__modal-row">
            <InputField
              label="Room Number"
              placeholder="e.g., Room 101"
              value={form.room}
              onChange={(e) => setForm((prev) => ({ ...prev, room: e.target.value }))}
            />
            <InputField
              label="Meeting Link (Live/Extra)"
              placeholder="https://zoom.us/..."
              value={form.meetingLink}
              onChange={(e) => setForm((prev) => ({ ...prev, meetingLink: e.target.value }))}
              disabled={form.type === 'offline' || form.type === 'lab'}
            />
          </div>

          <InputField
            label="Remarks (Optional)"
            placeholder="Any special notes for this class"
            value={form.remarks}
            onChange={(e) => setForm((prev) => ({ ...prev, remarks: e.target.value }))}
          />

          <div className="teacher-timetable__modal-actions">
            {form.id && (
              <Button variant="outline" onClick={() => handleDelete(form.id)} className="mr-auto" style={{borderColor: '#ef4444', color: '#ef4444'}}>
                Delete Entry
              </Button>
            )}
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>{form.id ? 'Update Schedule' : 'Create Schedule'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Timetable;
