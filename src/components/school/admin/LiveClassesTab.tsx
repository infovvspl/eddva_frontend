import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Clock, Search, Video, CheckCircle, Users, Activity, PlayCircle, Eye, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DataTable from '@/components/school/DataTable';
import {
  BaseLiveClass,
  useRunningLiveClasses,
  useUpcomingLiveClasses,
  useCompletedLiveClasses,
  useRecordedClasses,
  RecordedClass
} from '@/lib/school/hooks/useLiveClasses';
import VideoModal from './VideoModal';

export default function LiveClassesTab() {
  const [activeSubTab, setActiveSubTab] = useState<'running' | 'upcoming' | 'completed' | 'recordings'>('running');
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [playingVideo, setPlayingVideo] = useState<{ url: string; title: string } | null>(null);
  const limit = 20;

  const { data: runningData, isLoading: isRunningLoading } = useRunningLiveClasses(activeSubTab === 'running' ? page : 1, limit, activeSubTab === 'running');
  const { data: upcomingData, isLoading: isUpcomingLoading } = useUpcomingLiveClasses(activeSubTab === 'upcoming' ? page : 1, limit, activeSubTab === 'upcoming');
  const { data: completedData, isLoading: isCompletedLoading } = useCompletedLiveClasses(activeSubTab === 'completed' ? page : 1, limit, activeSubTab === 'completed');
  const { data: recordedData, isLoading: isRecordedLoading } = useRecordedClasses({
    page: activeSubTab === 'recordings' ? page : 1,
    limit,
    search: searchQuery, // Using backend search
    ...(startDate && { startDate }),
    ...(endDate && { endDate }),
  }, activeSubTab === 'recordings');

  const navigate = useNavigate();

  const handleSubTabChange = (tab: 'running' | 'upcoming' | 'completed' | 'recordings') => {
    setActiveSubTab(tab);
    setPage(1);
  };

  const getFilteredData = (data: BaseLiveClass[]) => {
    if (!data) return [];
    if (!searchQuery) return data;
    const lowerQuery = searchQuery.toLowerCase();
    return data.filter(item => 
      item.className.toLowerCase().includes(lowerQuery) || 
      item.teacherName.toLowerCase().includes(lowerQuery) ||
      item.subjectName.toLowerCase().includes(lowerQuery)
    );
  };

  const currentData = activeSubTab === 'running' 
    ? runningData 
    : activeSubTab === 'upcoming' 
      ? upcomingData 
      : activeSubTab === 'completed'
        ? completedData
        : recordedData;
      
  const isLoading = activeSubTab === 'running' 
    ? isRunningLoading 
    : activeSubTab === 'upcoming' 
      ? isUpcomingLoading 
      : activeSubTab === 'completed'
        ? isCompletedLoading
        : isRecordedLoading;

  const items = currentData?.items || [];
  // Only locally filter running/upcoming/completed since recordings are filtered via API
  const filteredItems = activeSubTab === 'recordings' ? items : getFilteredData(items);
  const total = currentData?.total || 0;
  const totalPages = Math.ceil(total / limit);

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    return (
      <div className="flex justify-between items-center mt-4">
        <span className="text-sm text-slate-500">
          Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total} entries
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1 text-sm border rounded-lg bg-white disabled:opacity-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
          >
            Previous
          </button>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1 text-sm border rounded-lg bg-white disabled:opacity-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
          >
            Next
          </button>
        </div>
      </div>
    );
  };

  const runningColumns = [
    {
      key: 'status',
      title: 'Status',
      render: () => (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
          LIVE
        </span>
      ),
    },
    { key: 'className', title: 'Class' },
    { key: 'subjectName', title: 'Subject' },
    { key: 'teacherName', title: 'Teacher' },
    {
      key: 'studentCount',
      title: 'Students',
      render: (val: number) => (
        <span className="inline-flex items-center gap-1 font-semibold">
          <Users className="w-4 h-4 text-slate-400" />
          {val}
        </span>
      )
    },
    {
      key: 'startedAt',
      title: 'Started',
      render: (val: string) => new Date(val).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    },
    {
      key: 'actions',
      title: 'Action',
      render: (_: unknown, row: { lectureId: string }) => (
        <button
          onClick={() => navigate(`/live/${row.lectureId}`)}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/20 transition-colors"
        >
          <PlayCircle className="w-4 h-4" />
          Join Live Class
        </button>
      )
    }
  ];

  const upcomingColumns = [
    { key: 'className', title: 'Class' },
    { key: 'subjectName', title: 'Subject' },
    { key: 'teacherName', title: 'Teacher' },
    {
      key: 'scheduledAt',
      title: 'Scheduled Time',
      render: (val: string) => (
        <span className="inline-flex items-center gap-1.5">
          <Calendar className="w-4 h-4 text-slate-400" />
          {new Date(val).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
        </span>
      )
    },
    {
      key: 'actions',
      title: 'Action',
      render: (_: unknown, row: { lectureId: string }) => (
        <button
          onClick={() => navigate(`/live/${row.lectureId}`)}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
        >
          <PlayCircle className="w-4 h-4" />
          Enter Room
        </button>
      )
    }
  ];

  const completedColumns = [
    { key: 'className', title: 'Class' },
    { key: 'subjectName', title: 'Subject' },
    { key: 'teacherName', title: 'Teacher' },
    {
      key: 'duration',
      title: 'Duration',
      render: (val: number) => `${val} mins`
    },
    {
      key: 'endedAt',
      title: 'Ended At',
      render: (val: string) => (
        <span className="inline-flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-slate-400" />
          {new Date(val).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
        </span>
      )
    }
  ];

  const recordedColumns = [
    { key: 'title', title: 'Title' },
    { key: 'teacherName', title: 'Teacher' },
    { key: 'className', title: 'Class' },
    { key: 'sectionName', title: 'Section', render: (val: string) => val || '-' },
    { key: 'subjectName', title: 'Subject' },
    { key: 'duration', title: 'Duration', render: (val: number) => `${val} mins` },
    {
      key: 'recordedAt',
      title: 'Recorded Date',
      render: (val: string) => (
        <span className="inline-flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-slate-400" />
          {new Date(val).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
        </span>
      )
    },
    {
      key: 'actions',
      title: 'Action',
      render: (_: unknown, row: RecordedClass) => (
        <button
          onClick={() => setPlayingVideo({ url: row.recordingUrl, title: row.title })}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/20 transition-colors"
        >
          <PlayCircle className="w-4 h-4" />
          Watch Recording
        </button>
      )
    }
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Video className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Total Live Classes</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                {(runningData?.total || 0) + (upcomingData?.total || 0) + (completedData?.total || 0)}
              </h3>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Running Now</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                {runningData?.total || 0}
              </h3>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Upcoming</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                {upcomingData?.total || 0}
              </h3>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Completed</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                {completedData?.total || 0}
              </h3>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Controls Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 gap-4">
          <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-fit">
            <button
              onClick={() => handleSubTabChange('running')}
              className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${
                activeSubTab === 'running'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              Running
            </button>
            <button
              onClick={() => handleSubTabChange('upcoming')}
              className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${
                activeSubTab === 'upcoming'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              Upcoming
            </button>
            <button
              onClick={() => handleSubTabChange('completed')}
              className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${
                activeSubTab === 'completed'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              Completed
            </button>
            <button
              onClick={() => handleSubTabChange('recordings')}
              className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${
                activeSubTab === 'recordings'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              Recorded Classes
            </button>
          </div>

            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search class, teacher, subject..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-64 pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white transition-all"
              />
            </div>
            
            {activeSubTab === 'recordings' && (
              <div className="flex gap-2 items-center w-full sm:w-auto">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full sm:w-auto px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                />
                <span className="text-slate-400 text-sm">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full sm:w-auto px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                />
              </div>
            )}
          </div>

        {/* Data Table Area */}
        <div className="p-5 overflow-x-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500 dark:text-slate-400">
              <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mb-4" />
              <p className="font-semibold">Loading live classes...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 mb-4 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                <Video className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                {activeSubTab === 'running' && 'No live classes are currently running.'}
                {activeSubTab === 'upcoming' && 'No upcoming live classes scheduled.'}
                {activeSubTab === 'completed' && 'No completed live classes available.'}
                {activeSubTab === 'recordings' && 'No recorded classes found.'}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {searchQuery ? 'Try adjusting your search query.' : 'Check back later for updates.'}
              </p>
            </div>
          ) : (
            <>
              <DataTable
                columns={
                  activeSubTab === 'running'
                    ? runningColumns
                    : activeSubTab === 'upcoming'
                      ? upcomingColumns
                      : activeSubTab === 'completed'
                        ? completedColumns
                        : recordedColumns
                }
                data={filteredItems}
              />
              {renderPagination()}
            </>
          )}
        </div>
      </div>

      {playingVideo && (
        <VideoModal 
          url={playingVideo.url} 
          title={playingVideo.title} 
          onClose={() => setPlayingVideo(null)} 
        />
      )}
    </div>
  );
}
