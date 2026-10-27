import { CustomSelect } from "@/components/ui/CustomSelect";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Clock, Plus, Edit2, Trash2, MapPin, Users, Settings, AlertCircle, Search, ChevronDown, Coffee, Video, FlaskConical, CalendarPlus, CalendarDays } from 'lucide-react';
import api from '@/lib/api/school-client';
import { getResponseList } from '@/lib/school/apiData';
import Modal from '@/components/school/admin/Modal';
import TimetableForm from '@/components/school/admin/forms/TimetableForm';
import { useConfirm } from '@/context/ConfirmContext';
import { handleApiError } from '@/lib/school/errorHandler';
import { useAuth } from '@/context/SchoolAuthContext';
import { PeriodSettings } from '@/pages/school/admin/AdminSettings';


const days = ['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY'];
const dayNames = ['SUNDAY','MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY'];
const dayShortNames = {
  MONDAY: 'Mon',
  TUESDAY: 'Tue',
  WEDNESDAY: 'Wed',
  THURSDAY: 'Thu',
  FRIDAY: 'Fri',
  SATURDAY: 'Sat',
  SUNDAY: 'Sun'
};

// Single accent palette shared by every class card (weekly grid, daily slots, live status).
const SLOT_PALETTE = { bar: 'bg-blue-600', soft: 'border-blue-200 bg-blue-50/70 dark:border-blue-900/40 dark:bg-blue-950/20', glow: 'bg-blue-500/15', badge: 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/50', avatar: 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300', icon: 'text-blue-700 dark:text-blue-400', ring: 'hover:border-blue-300 dark:hover:border-blue-700' };
const BREAK_PALETTE = { bar: 'bg-slate-400', soft: 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/40', glow: 'bg-slate-400/15', badge: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700', avatar: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300', icon: 'text-slate-500 dark:text-slate-400', ring: 'hover:border-slate-300 dark:hover:border-slate-600' };
// Per-subject palettes, used only by the Daily Slots cards (Scheduled Timetable Slots).
const SLOT_PALETTES = [
  { bar: 'bg-blue-500', soft: 'border-blue-200 bg-blue-50/70 dark:border-blue-900/40 dark:bg-blue-950/20', glow: 'bg-blue-500/15', badge: 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/50', avatar: 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300', icon: 'text-blue-600 dark:text-blue-400', ring: 'hover:border-blue-300 dark:hover:border-blue-700' },
  { bar: 'bg-emerald-500', soft: 'border-emerald-200 bg-emerald-50/70 dark:border-emerald-900/40 dark:bg-emerald-950/20', glow: 'bg-emerald-500/15', badge: 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/50', avatar: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300', icon: 'text-emerald-600 dark:text-emerald-400', ring: 'hover:border-emerald-300 dark:hover:border-emerald-700' },
  { bar: 'bg-violet-500', soft: 'border-violet-200 bg-violet-50/70 dark:border-violet-900/40 dark:bg-violet-950/20', glow: 'bg-violet-500/15', badge: 'bg-violet-50 text-violet-700 border-violet-100 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-900/50', avatar: 'bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300', icon: 'text-violet-600 dark:text-violet-400', ring: 'hover:border-violet-300 dark:hover:border-violet-700' },
  { bar: 'bg-rose-500', soft: 'border-rose-200 bg-rose-50/70 dark:border-rose-900/40 dark:bg-rose-950/20', glow: 'bg-rose-500/15', badge: 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/50', avatar: 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300', icon: 'text-rose-600 dark:text-rose-400', ring: 'hover:border-rose-300 dark:hover:border-rose-700' },
  { bar: 'bg-amber-500', soft: 'border-amber-200 bg-amber-50/70 dark:border-amber-900/40 dark:bg-amber-950/20', glow: 'bg-amber-500/15', badge: 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50', avatar: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300', icon: 'text-amber-600 dark:text-amber-400', ring: 'hover:border-amber-300 dark:hover:border-amber-700' },
  { bar: 'bg-cyan-500', soft: 'border-cyan-200 bg-cyan-50/70 dark:border-cyan-900/40 dark:bg-cyan-950/20', glow: 'bg-cyan-500/15', badge: 'bg-cyan-50 text-cyan-700 border-cyan-100 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-900/50', avatar: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300', icon: 'text-cyan-600 dark:text-cyan-400', ring: 'hover:border-cyan-300 dark:hover:border-cyan-700' },
  { bar: 'bg-pink-500', soft: 'border-pink-200 bg-pink-50/70 dark:border-pink-900/40 dark:bg-pink-950/20', glow: 'bg-pink-500/15', badge: 'bg-pink-50 text-pink-700 border-pink-100 dark:bg-pink-950/40 dark:text-pink-300 dark:border-pink-900/50', avatar: 'bg-pink-100 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300', icon: 'text-pink-600 dark:text-pink-400', ring: 'hover:border-pink-300 dark:hover:border-pink-700' },
  { bar: 'bg-indigo-500', soft: 'border-indigo-200 bg-indigo-50/70 dark:border-indigo-900/40 dark:bg-indigo-950/20', glow: 'bg-indigo-500/15', badge: 'bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-900/50', avatar: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300', icon: 'text-indigo-600 dark:text-indigo-400', ring: 'hover:border-indigo-300 dark:hover:border-indigo-700' },
  { bar: 'bg-teal-500', soft: 'border-teal-200 bg-teal-50/70 dark:border-teal-900/40 dark:bg-teal-950/20', glow: 'bg-teal-500/15', badge: 'bg-teal-50 text-teal-700 border-teal-100 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-900/50', avatar: 'bg-teal-100 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300', icon: 'text-teal-600 dark:text-teal-400', ring: 'hover:border-teal-300 dark:hover:border-teal-700' },
  { bar: 'bg-orange-500', soft: 'border-orange-200 bg-orange-50/70 dark:border-orange-900/40 dark:bg-orange-950/20', glow: 'bg-orange-500/15', badge: 'bg-orange-50 text-orange-700 border-orange-100 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-900/50', avatar: 'bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300', icon: 'text-orange-600 dark:text-orange-400', ring: 'hover:border-orange-300 dark:hover:border-orange-700' },
  { bar: 'bg-lime-600', soft: 'border-lime-200 bg-lime-50/70 dark:border-lime-900/40 dark:bg-lime-950/20', glow: 'bg-lime-500/15', badge: 'bg-lime-50 text-lime-700 border-lime-100 dark:bg-lime-950/40 dark:text-lime-300 dark:border-lime-900/50', avatar: 'bg-lime-100 text-lime-700 dark:bg-lime-950/60 dark:text-lime-300', icon: 'text-lime-600 dark:text-lime-400', ring: 'hover:border-lime-300 dark:hover:border-lime-700' },
  { bar: 'bg-fuchsia-500', soft: 'border-fuchsia-200 bg-fuchsia-50/70 dark:border-fuchsia-900/40 dark:bg-fuchsia-950/20', glow: 'bg-fuchsia-500/15', badge: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-100 dark:bg-fuchsia-950/40 dark:text-fuchsia-300 dark:border-fuchsia-900/50', avatar: 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-950/60 dark:text-fuchsia-300', icon: 'text-fuchsia-600 dark:text-fuchsia-400', ring: 'hover:border-fuchsia-300 dark:hover:border-fuchsia-700' },
  { bar: 'bg-sky-500', soft: 'border-sky-200 bg-sky-50/70 dark:border-sky-900/40 dark:bg-sky-950/20', glow: 'bg-sky-500/15', badge: 'bg-sky-50 text-sky-700 border-sky-100 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-900/50', avatar: 'bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300', icon: 'text-sky-600 dark:text-sky-400', ring: 'hover:border-sky-300 dark:hover:border-sky-700' },
  { bar: 'bg-red-500', soft: 'border-red-200 bg-red-50/70 dark:border-red-900/40 dark:bg-red-950/20', glow: 'bg-red-500/15', badge: 'bg-red-50 text-red-700 border-red-100 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900/50', avatar: 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300', icon: 'text-red-600 dark:text-red-400', ring: 'hover:border-red-300 dark:hover:border-red-700' },
  { bar: 'bg-yellow-600', soft: 'border-yellow-200 bg-yellow-50/70 dark:border-yellow-900/40 dark:bg-yellow-950/20', glow: 'bg-yellow-500/15', badge: 'bg-yellow-50 text-yellow-700 border-yellow-100 dark:bg-yellow-950/40 dark:text-yellow-300 dark:border-yellow-900/50', avatar: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/60 dark:text-yellow-300', icon: 'text-yellow-600 dark:text-yellow-400', ring: 'hover:border-yellow-300 dark:hover:border-yellow-700' },
  { bar: 'bg-purple-500', soft: 'border-purple-200 bg-purple-50/70 dark:border-purple-900/40 dark:bg-purple-950/20', glow: 'bg-purple-500/15', badge: 'bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-900/50', avatar: 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300', icon: 'text-purple-600 dark:text-purple-400', ring: 'hover:border-purple-300 dark:hover:border-purple-700' },
];
// colorMap: subject name -> unique index (see subjectColorMap in the page), so every
// subject gets its own color until the palette runs out.
const getSubjectPalette = (slot, colorMap) => {
  if (slot.type === 'break') return BREAK_PALETTE;
  const name = String(slot.subject?.name || '');
  const mapped = colorMap?.get(name);
  if (mapped !== undefined) return SLOT_PALETTES[mapped % SLOT_PALETTES.length];
  const seed = name || String(slot.subjectId || slot.id || '');
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return SLOT_PALETTES[hash % SLOT_PALETTES.length];
};
const getSlotPalette = (slot) => (slot.type === 'break' ? BREAK_PALETTE : SLOT_PALETTE);
const SLOT_TYPE_STYLES = {
  offline: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
  live: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
  lab: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300',
  extra: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  break: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
};

// Natural order for names: Class 2 before Class 10, Section A before Section B.
// Teacher "My Week" cards: dashboard-style gradient tones.
const TEACHER_TONES = {
  offline: { card: 'from-[#F0F7FF] to-[#DCEBFF] border-[#CFE3FB]', tile: 'from-blue-500 to-blue-600 shadow-blue-500/30', text: 'text-blue-700', bar: 'bg-blue-500' },
  live: { card: 'from-[#FEF2F2] to-[#FFE0E0] border-[#FBCFCF]', tile: 'from-rose-500 to-red-600 shadow-rose-500/30', text: 'text-rose-700', bar: 'bg-rose-500' },
  lab: { card: 'from-[#F5F3FF] to-[#E7E0FF] border-[#DDD3FB]', tile: 'from-violet-500 to-purple-600 shadow-violet-500/30', text: 'text-violet-700', bar: 'bg-violet-500' },
  extra: { card: 'from-[#FFF7ED] to-[#FFEAD2] border-[#FFDDB8]', tile: 'from-orange-400 to-orange-600 shadow-orange-500/30', text: 'text-orange-700', bar: 'bg-orange-500' },
  // Subject palette: cards are coloured per subject so a day does not read as all blue.
  subjects: [
    { card: 'from-[#FFF7ED] to-[#FFEAD2] border-[#FFDDB8]', tile: 'from-orange-400 to-orange-600 shadow-orange-500/30', text: 'text-orange-700', bar: 'bg-orange-500' },
    { card: 'from-[#F5F3FF] to-[#E7E0FF] border-[#DDD3FB]', tile: 'from-violet-500 to-purple-600 shadow-violet-500/30', text: 'text-violet-700', bar: 'bg-violet-500' },
    { card: 'from-[#FDF2F8] to-[#FCE0EF] border-[#F9CFE5]', tile: 'from-pink-500 to-rose-600 shadow-pink-500/30', text: 'text-pink-700', bar: 'bg-pink-500' },
    { card: 'from-[#F0FDFA] to-[#D5F7F0] border-[#B5EBE0]', tile: 'from-teal-500 to-cyan-600 shadow-teal-500/30', text: 'text-teal-700', bar: 'bg-teal-500' },
    { card: 'from-[#FEFCE8] to-[#FEF3C7] border-[#FDE9A6]', tile: 'from-amber-400 to-yellow-600 shadow-amber-500/30', text: 'text-amber-700', bar: 'bg-amber-500' },
    { card: 'from-[#F0F7FF] to-[#DCEBFF] border-[#CFE3FB]', tile: 'from-blue-500 to-blue-600 shadow-blue-500/30', text: 'text-blue-700', bar: 'bg-blue-500' },    { card: 'from-[#FDF4FF] to-[#F6E0FD] border-[#EDCDF8]', tile: 'from-fuchsia-500 to-purple-600 shadow-fuchsia-500/30', text: 'text-fuchsia-700', bar: 'bg-fuchsia-500' },
    { card: 'from-[#F0F9FF] to-[#D9F0FF] border-[#BDE4FA]', tile: 'from-sky-400 to-cyan-600 shadow-sky-500/30', text: 'text-sky-700', bar: 'bg-sky-500' },
  ],
  now: { card: 'from-[#ECFDF5] to-[#D1FAE5] border-[#A7F3D0]', tile: 'from-emerald-500 to-teal-600 shadow-emerald-500/30', text: 'text-emerald-700', bar: 'bg-emerald-500' },
};
const byNameNatural = (a, b) => {
  const norm = (v) => String(v ?? '').replace(/[-_]/g, ' ').replace(/\s+/g, ' ').trim();
  return norm(a?.name).localeCompare(norm(b?.name), undefined, { numeric: true, sensitivity: 'base' });
};

// Solid chip colour per weekday for the Weekly Class Timetable's top row.
const DAY_CHIP_COLORS = {
  MONDAY: 'bg-amber-800 shadow-amber-800/30',
  TUESDAY: 'bg-emerald-600 shadow-emerald-600/30',
  WEDNESDAY: 'bg-orange-600 shadow-orange-600/30',
  THURSDAY: 'bg-amber-500 shadow-amber-500/30',
  FRIDAY: 'bg-rose-600 shadow-rose-600/30',
  SATURDAY: 'bg-pink-500 shadow-pink-500/30',
  SUNDAY: 'bg-slate-600 shadow-slate-600/30',
};

const isBreakPeriod = (period) =>
  period?.periodType === 'Break' || String(period?.periodName || '').toLowerCase().includes('break');

// Read-only cell of the Weekly Class Timetable grid: plain coloured text, no card or pill.
// Subject, teacher, room and class type each get their own text colour.
const SLOT_TYPE_TEXT = {
  offline: 'text-blue-600 dark:text-blue-400',
  live: 'text-rose-600 dark:text-rose-400',
  lab: 'text-purple-600 dark:text-purple-400',
  extra: 'text-amber-600 dark:text-amber-400',
  break: 'text-slate-500 dark:text-slate-400',
};
function WeeklyGridSlotCard({ slot, subjectName, teacherName, photoUrl, onEdit, onDelete }) {
  // Show the teacher's photo when there is one (and it loads); otherwise their initials.
  const [failedUrl, setFailedUrl] = useState(null);
  const showPhoto = Boolean(photoUrl) && failedUrl !== photoUrl;
  const isBreak = slot.type === 'break';
  const palette = getSlotPalette(slot);
  const type = slot.type || 'offline';
  const title = isBreak ? (slot.remarks || 'Break') : subjectName;

  return (
    <div className="flex h-[80px] flex-col justify-center gap-1 overflow-hidden px-0.5 py-1">
      <div className="flex items-start justify-between gap-1.5">
        <p
          title={title}
          className={`flex min-w-0 flex-1 items-center gap-1.5 text-sm font-black ${isBreak ? 'text-amber-600 dark:text-amber-400' : 'text-indigo-700 dark:text-indigo-300'}`}
        >
          {isBreak && <Coffee className="size-3.5 shrink-0" />}
          <span className="min-w-0 truncate">{title}</span>
        </p>
        <div className="flex shrink-0 gap-0.5 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
          <button onClick={onEdit} title="Edit Slot" className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-blue-600 dark:hover:bg-slate-800">
            <Edit2 className="size-3" />
          </button>
          <button onClick={onDelete} title="Delete Slot" className="rounded-md p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40">
            <Trash2 className="size-3" />
          </button>
        </div>
      </div>

      <p className="truncate text-[11px] font-bold">
        <span className="text-emerald-600 dark:text-emerald-400">{slot.room ? `Room ${slot.room}` : 'No room'}</span>
        <span className="mx-1.5 text-slate-300 dark:text-slate-600">•</span>
        <span className={`capitalize ${SLOT_TYPE_TEXT[type] || SLOT_TYPE_TEXT.offline}`}>{type}</span>
      </p>
      <div className="flex items-center gap-2">
        <span className={`flex size-6 shrink-0 items-center justify-center overflow-hidden rounded-full text-[10px] font-black ${palette.avatar}`}>
          {isBreak ? (
            <Coffee className="size-3" />
          ) : showPhoto ? (
            <img
              src={photoUrl}
              alt={teacherName}
              className="size-full object-cover"
              loading="lazy"
              onError={() => setFailedUrl(photoUrl)}
            />
          ) : (
            teacherName.split(' ').map((p) => p[0]).join('').toUpperCase().slice(0, 2)
          )}
        </span>
        <span className="truncate text-xs font-bold text-slate-800 dark:text-slate-200">
          {isBreak ? 'No teacher' : teacherName}
        </span>
      </div>

    </div>
  );
}

// Round teacher avatar: the photo when there is one (and it loads), otherwise the initials.
function PhotoAvatar({ src, name, initials, className }) {
  const [failedSrc, setFailedSrc] = useState(null);
  const showPhoto = Boolean(src) && failedSrc !== src;
  return (
    <span className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full ${className}`}>
      {showPhoto ? (
        <img src={src} alt={name} className="size-full object-cover" loading="lazy" onError={() => setFailedSrc(src)} />
      ) : (
        initials
      )}
    </span>
  );
}

export default function Timetable() {
  const { user } = useAuth();

  const isTeacher = user?.role === 'TEACHER';
  const [timetables, setTimetables] = useState([]);
  const [allTeachers, setAllTeachers] = useState([]);
  const [teacherProfile, setTeacherProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTimetable, setSelectedTimetable] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPeriodsModal, setShowPeriodsModal] = useState(false);
  // Admin view switcher: 'timetable' = scheduling (weekly grid + daily slot
  // list), 'roster' = who's-teaching-what-when (live status + period map).
  const [activeView, setActiveView] = useState('timetable');
  const [filterTeacher, setFilterTeacher] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterPeriod, setFilterPeriod] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  // Class/Section filters local to the "Scheduled Timetable Slots" list — kept
  // separate from filterClass above (shared by the Period-wise Teacher Map)
  // so filtering one doesn't affect the other.
  const [slotsFilterClass, setSlotsFilterClass] = useState('');
  const [slotsFilterSection, setSlotsFilterSection] = useState('');
  const [activeDay, setActiveDay] = useState(() => {
    const todayIndex = new Date().getDay();
    return todayIndex === 0 ? 'MONDAY' : dayNames[todayIndex];
  });
  const [hasInitializedDefaultDay, setHasInitializedDefaultDay] = useState(false);
  const [now, setNow] = useState(() => new Date());

  const [sections, setSections] = useState([]);
  const [allSubjects, setAllSubjects] = useState([]);
  const [allPeriods, setAllPeriods] = useState([]);
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [allClasses, setAllClasses] = useState([]);
  const [weeklyClassId, setWeeklyClassId] = useState('');

  const weeklySections = useMemo(() => {
    if (!weeklyClassId) return [];
    const cls = allClasses.find(c => String(c.id) === String(weeklyClassId));
    return cls?.sections || [];
  }, [weeklyClassId, allClasses]);
  const [isBulkEditMode, setIsBulkEditMode] = useState(false);
  const [gridDraft, setGridDraft] = useState({});
  const [bulkErrors, setBulkErrors] = useState([]);
  const [isCopyClassModalOpen, setIsCopyClassModalOpen] = useState(false);
  const [targetClassSectionId, setTargetClassSectionId] = useState('');
  const [selectedLiveTeacherId, setSelectedLiveTeacherId] = useState('');
  const [isTeacherDropdownOpen, setIsTeacherDropdownOpen] = useState(false);
  const [teacherSearchQuery, setTeacherSearchQuery] = useState('');
  const teacherDropdownRef = useRef(null);


  useEffect(() => {
    const handleClickOutside = (event) => {
      if (teacherDropdownRef.current && !teacherDropdownRef.current.contains(event.target)) {
        setIsTeacherDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const [liveTeacherSearch, setLiveTeacherSearch] = useState('');

  // Pagination for the two long lists below: Live Teacher Status ("All Classes")
  // and the day's Scheduled Timetable Slots.
  const TIMETABLE_PAGE_SIZE = 8;
  const [liveTeacherPage, setLiveTeacherPage] = useState(1);
  const [scheduledSlotsPage, setScheduledSlotsPage] = useState(1);

  const confirm = useConfirm();

  useEffect(() => { fetchTimetables(); }, []);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60000);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => { setFilterPeriod(''); }, [activeDay]);
  useEffect(() => { setLiveTeacherPage(1); }, [selectedLiveTeacherId]);
  useEffect(() => { setScheduledSlotsPage(1); }, [activeDay, slotsFilterClass, slotsFilterSection]);
  useEffect(() => { setSlotsFilterSection(''); }, [slotsFilterClass]);

  useEffect(() => {
    if (!loading && !hasInitializedDefaultDay) {
      const todayIndex = new Date().getDay();
      const todayName = todayIndex === 0 ? 'MONDAY' : dayNames[todayIndex];
      
      if (timetables.length > 0) {
        const todayClasses = timetables.filter(t => t.dayOfWeek === todayName);
        if (todayClasses.length > 0) {
          setActiveDay(todayName);
        } else {
          const startIndex = days.indexOf(todayName);
          let foundDay = null;
          for (let i = 0; i < days.length; i++) {
            const checkIndex = (startIndex + i) % days.length;
            const checkDay = days[checkIndex];
            if (timetables.some(t => t.dayOfWeek === checkDay)) {
              foundDay = checkDay;
              break;
            }
          }
          if (foundDay) {
            setActiveDay(foundDay);
          } else {
            setActiveDay(todayName);
          }
        }
      } else {
        setActiveDay(todayName);
      }
      setHasInitializedDefaultDay(true);
    }
  }, [loading, timetables, hasInitializedDefaultDay]);

  const fetchTimetables = async () => {
    try {
      // Only the timetable itself is required. The teacher profile and the
      // class/subject/period lists only enrich it, so one of them failing (it
      // did: a 403 on the profile) must not leave every day showing "No
      // classes" — own slots still match on slot.teacher.user.id.
      if (isTeacher) {
        try {
          const pRes = await api.get(`/teachers/${user.id}`);
          setTeacherProfile(pRes.data?.data?.teacherProfile);
        } catch (profileErr) {
          console.error('Timetable: teacher profile unavailable', profileErr);
        }
      }

      const [res, secRes, subjRes, periodRes] = await Promise.allSettled([
        // This fetches the whole institute's weekly timetable in one call and filters
        // client-side per class/section — the backend's default limit (100) silently cut
        // the response off partway through Monday once every section had a full schedule,
        // so later classes/sections and every day after Monday just showed "Free".
        api.get('/timetable', { params: { limit: 5000 } }),
        api.get('/academic/classes'),
        api.get('/academic/subjects?limit=1000'),
        api.get('/academic/periods')
      ]);
      if (res.status === 'rejected') throw res.reason;
      const listOf = (settled, label) => {
        if (settled.status === 'fulfilled') return getResponseList(settled.value);
        console.error(`Timetable: ${label} unavailable`, settled.reason);
        return [];
      };

      setTimetables(getResponseList(res.value));

      const allSections = [];
      const classesList = [...listOf(secRes, 'classes')]
        .sort(byNameNatural)
        .map((cls) => ({ ...cls, sections: [...(cls.sections || [])].sort(byNameNatural) }));
      setAllClasses(classesList);
      classesList.forEach(cls => {
        (cls.sections || []).forEach(section => {
          allSections.push({ ...section, className: cls.name, classId: cls.id });
        });
      });
      setSections(allSections);
      setAllSubjects(listOf(subjRes, 'subjects'));
      setAllPeriods(listOf(periodRes, 'periods'));

      if (!isTeacher) {
        const teachersRes = await api.get('/teachers?limit=1000');
        setAllTeachers(getResponseList(teachersRes));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const startBulkEdit = () => {
    const draft = {};
    timetables.forEach(slot => {
      if (String(slot.sectionId || slot.section?.id) === String(selectedSectionId)) {
        const key = `${slot.dayOfWeek}_${slot.periodId}`;
        draft[key] = {
          id: slot.id,
          subjectId: slot.subjectId || slot.subject?.id || '',
          teacherId: slot.teacherId || slot.teacher?.id || '',
          room: slot.room || '',
          type: slot.type || 'offline',
          meetingLink: slot.meetingLink || '',
          remarks: slot.remarks || '',
          periodId: slot.periodId,
          dayOfWeek: slot.dayOfWeek,
        };
      }
    });
    setGridDraft(draft);
    setBulkErrors([]);
    setIsBulkEditMode(true);
  };

  const getSlotForGrid = (day, periodId) => {
    if (isBulkEditMode) {
      return gridDraft[`${day}_${periodId}`];
    }
    return timetables.find(t => 
      String(t.sectionId || t.section?.id) === String(selectedSectionId) &&
      t.dayOfWeek === day &&
      String(t.periodId) === String(periodId)
    );
  };

  const handleCellChange = (day, periodId, field, value) => {
    const key = `${day}_${periodId}`;
    setGridDraft(prev => {
      const current = prev[key] || { dayOfWeek: day, periodId, type: 'offline' };
      const updated = { ...current, [field]: value };
      
      if (field === 'type' && value === 'break') {
        updated.subjectId = '';
        updated.teacherId = '';
        if (!updated.remarks) {
          updated.remarks = 'Break';
        }
      } else if (field === 'subjectId' && !value) {
        // If subject is cleared, clear teacher too
        updated.teacherId = '';
        updated.room = '';
        if (updated.type !== 'break') {
          updated.type = 'offline';
        }
      }

      return {
        ...prev,
        [key]: updated
      };
    });
  };

  const handleCopyDay = (fromDay, toDay) => {
    if (fromDay === toDay) return;
    setGridDraft(prev => {
      const updated = { ...prev };
      sortedPeriods.forEach(period => {
        const sourceKey = `${fromDay}_${period.id}`;
        const targetKey = `${toDay}_${period.id}`;
        const sourceSlot = prev[sourceKey];
        if (sourceSlot && ((sourceSlot.subjectId && sourceSlot.teacherId) || sourceSlot.type === 'break')) {
          updated[targetKey] = {
            ...sourceSlot,
            id: prev[targetKey]?.id || null,
            dayOfWeek: toDay,
            periodId: period.id
          };
        } else {
          updated[targetKey] = {
            dayOfWeek: toDay,
            periodId: period.id,
            subjectId: '',
            teacherId: '',
            room: '',
            type: 'offline',
            remarks: '',
            id: prev[targetKey]?.id || null
          };
        }
      });
      return updated;
    });
  };

  const handleBulkSave = async () => {
    setIsSubmitting(true);
    setBulkErrors([]);
    try {
      const slotsToSubmit = [];
      Object.keys(gridDraft).forEach(key => {
        const slot = gridDraft[key];
        const isBreak = slot?.type === 'break';
        if (slot && ((slot.subjectId && slot.teacherId) || isBreak)) {
          slotsToSubmit.push({
            id: slot.id || undefined,
            periodId: slot.periodId,
            dayOfWeek: slot.dayOfWeek,
            subjectId: isBreak ? null : slot.subjectId,
            teacherId: isBreak ? null : slot.teacherId,
            room: slot.room || null,
            type: slot.type || 'offline',
            meetingLink: isBreak ? null : (slot.meetingLink || null),
            remarks: slot.remarks || null
          });
        }
      });

      const res = await api.put('/timetable/bulk/update', {
        sectionId: selectedSectionId,
        slots: slotsToSubmit
      });

      if (res.data?.success) {
        setIsBulkEditMode(false);
        const updatedRes = await api.get('/timetable', { params: { limit: 5000 } });
        setTimetables(getResponseList(updatedRes));
      } else if (res.data?.errors) {
        setBulkErrors(res.data.errors);
      } else {
        setBulkErrors([res.data?.message || 'An unknown error occurred while saving.']);
      }
    } catch (err) {
      console.error(err);
      if (err.response?.data?.errors) {
        setBulkErrors(err.response.data.errors);
      } else if (err.response?.data?.message) {
        setBulkErrors([err.response.data.message]);
      } else {
        setBulkErrors(['Failed to save bulk updates. Please verify schedules and try again.']);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyClass = async () => {
    if (!targetClassSectionId) return;
    setIsSubmitting(true);
    setBulkErrors([]);
    try {
      const currentSlots = timetables.filter(t => 
        String(t.sectionId || t.section?.id) === String(selectedSectionId)
      );

      const slotsToSubmit = currentSlots.map(slot => ({
        periodId: slot.periodId,
        dayOfWeek: slot.dayOfWeek,
        subjectId: slot.subjectId || slot.subject?.id,
        teacherId: slot.teacherId || slot.teacher?.id,
        room: slot.room || null,
        type: slot.type || 'offline',
        meetingLink: slot.meetingLink || null,
        remarks: slot.remarks || null
      }));

      const res = await api.put('/timetable/bulk/update', {
        sectionId: targetClassSectionId,
        slots: slotsToSubmit
      });

      if (res.data?.success) {
        setIsCopyClassModalOpen(false);
        setTargetClassSectionId('');
        const updatedRes = await api.get('/timetable', { params: { limit: 5000 } });
        setTimetables(getResponseList(updatedRes));
      } else if (res.data?.errors) {
        setBulkErrors(res.data.errors);
      } else {
        setBulkErrors([res.data?.message || 'An unknown error occurred while copying timetable.']);
      }
    } catch (err) {
      console.error(err);
      if (err.response?.data?.errors) {
        setBulkErrors(err.response.data.errors);
      } else if (err.response?.data?.message) {
        setBulkErrors([err.response.data.message]);
      } else {
        setBulkErrors(['Failed to copy timetable to selected class.']);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDragStart = (e, day, periodId) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ day, periodId }));
  };

  const handleDrop = (e, targetDay, targetPeriodId) => {
    e.preventDefault();
    try {
      const source = JSON.parse(e.dataTransfer.getData('text/plain'));
      if (!source || !source.day || !source.periodId) return;
      
      const sourceKey = `${source.day}_${source.periodId}`;
      const targetKey = `${targetDay}_${targetPeriodId}`;
      
      if (sourceKey === targetKey) return;

      setGridDraft(prev => {
        const sourceSlot = prev[sourceKey] || { dayOfWeek: source.day, periodId: source.periodId };
        const targetSlot = prev[targetKey] || { dayOfWeek: targetDay, periodId: targetPeriodId };

        const newSourceSlot = {
          ...targetSlot,
          id: sourceSlot.id || null,
          dayOfWeek: source.day,
          periodId: source.periodId
        };

        const newTargetSlot = {
          ...sourceSlot,
          id: targetSlot.id || null,
          dayOfWeek: targetDay,
          periodId: targetPeriodId
        };

        return {
          ...prev,
          [sourceKey]: newSourceSlot,
          [targetKey]: newTargetSlot
        };
      });
    } catch (err) {
      console.error('Failed to parse drag-drop payload:', err);
    }
  };

  const sortedPeriods = useMemo(() => {
    return [...allPeriods].sort((a, b) => {
      const aSeq = Number(a.sequenceNo || a.sequence_no || 0);
      const bSeq = Number(b.sequenceNo || b.sequence_no || 0);
      if (aSeq !== bSeq) return aSeq - bSeq;
      return String(a.startTime || '').localeCompare(String(b.startTime || ''));
    });
  }, [allPeriods]);

  // One stable, unique color per subject (alphabetical order) for the Daily Slots cards.
  const subjectColorMap = useMemo(() => {
    const names = new Set();
    allSubjects.forEach((sub) => sub.name && names.add(sub.name));
    timetables.forEach((t) => t.subject?.name && names.add(t.subject.name));
    return new Map(Array.from(names).sort((a, b) => a.localeCompare(b)).map((name, idx) => [name, idx]));
  }, [allSubjects, timetables]);

  const getSubjectsForSection = (sectionId) => {
    const sec = sections.find(s => String(s.id) === String(sectionId));
    const classId = sec?.classId;
    return allSubjects.filter(sub => {
      const subSectionId = sub.section_id || sub.sectionId || '';
      const subClassId = sub.class_id || sub.classId || '';
      // Match subjects assigned directly to this section
      if (subSectionId && String(subSectionId) === String(sectionId)) return true;
      // Match class-level subjects (section_id is null) belonging to the same class
      if (!subSectionId && classId && String(subClassId) === String(classId)) return true;
      return false;
    });
  };

  const getTeachersForSubject = (sectionId, subjectId) => {
    const sec = sections.find(s => String(s.id) === String(sectionId));
    if (!sec || !subjectId) return [];
    const classId = sec.classId;
    return allTeachers.filter(t => {
      const assignments = t.teacherProfile?.assignments || [];
      return assignments.some(a => 
        String(a.classId) === String(classId) &&
        String(a.sectionId) === String(sectionId) &&
        String(a.subjectId) === String(subjectId)
      );
    });
  };

  const handleAddClick = () => { setSelectedTimetable(null); setIsModalOpen(true); };
  const handleEditClick = (t) => { setSelectedTimetable(t); setIsModalOpen(true); };
  
  const handleDeleteClick = async (id) => {
    const ok = await confirm({
      title: 'Delete Timetable Slot',
      message: 'Are you sure you want to delete this timetable entry?',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel'
    });
    if (!ok) return;
    try {
      await api.delete(`/timetable/${id}`);
      setTimetables((prev) => prev.filter((x) => x.id !== id));
    } catch (err) {
      handleApiError(err, 'Failed to delete timetable entry');
    }
  };

  const handleSubmit = async (formData) => {
    setIsSubmitting(true);
    try {
      if (selectedTimetable && selectedTimetable.id) {
        const res = await api.put(`/timetable/${selectedTimetable.id}`, formData);
        setTimetables((prev) => prev.map((p) => (p.id === selectedTimetable.id ? (res.data?.data ?? res.data) : p)));
      } else {
        const res = await api.post('/timetable', formData);
        setTimetables((prev) => [...prev, res.data?.data ?? res.data]);
      }
      setIsModalOpen(false);
      setSelectedTimetable(null);
    } catch (err) {
      handleApiError(err, 'Failed to save timetable');
    } finally { setIsSubmitting(false); }
  };

  const handleAssignIdleTeacher = (teacher, period, subjectId) => {
    const matchedPeriod = allPeriods.find(p => String(p.id) === String(period.key) || String(p.sequenceNo) === String(period.periodNumber));
    const prefill = {
      dayOfWeek: activeDay,
      periodId: matchedPeriod ? matchedPeriod.id : (period.key.length > 5 ? period.key : ''),
      periodNumber: matchedPeriod ? String(matchedPeriod.sequenceNo) : String(period.periodNumber || '1'),
      teacherId: teacher.profileId || teacher.id,
      subjectId: subjectId || '',
      startTime: period.startTime,
      endTime: period.endTime
    };
    setSelectedTimetable(prefill);
    setIsModalOpen(true);
  };

  // Teacher photo for a slot: from the slot's own teacher if present, else from the teacher list.
  const getSlotTeacherPhoto = (slot) =>
    slot.teacher?.profileImage
    || slot.teacher?.user?.profileImage
    || allTeachers.find((t) => String(t.teacherProfile?.id) === String(slot.teacherId || slot.teacher?.id))?.profileImage
    || null;

  const formatTeacherName = (t) => {
    if (!t) return null;
    const u = t.user || {};
    if (u.name) return u.name;
    const parts = [u.firstName, u.lastName].filter(Boolean);
    return parts.length ? parts.join(' ') : null;
  };

  const formatClassName = (s) => {
    if (!s) return null;
    if (s.className) return s.className;
    if (s.name) return s.name;
    return null;
  };

  const assignmentClassName = (assignment) => {
    if (!assignment) return null;
    return assignment.className || assignment.class?.name || assignment.section?.className || assignment.section?.class?.name || null;
  };

  const getTeacherName = (teacher) => {
    if (!teacher) return null;
    return teacher.name || formatTeacherName(teacher) || formatTeacherName(teacher.teacher) || null;
  };

  const getTeacherKey = (teacher) => {
    if (!teacher) return null;
    return String(teacher.teacherProfile?.id || teacher.teacherId || teacher.id || teacher.teacher?.id || teacher.user?.id || '');
  };

  const getSlotTeacherKey = (slot) => String(slot.teacherId || slot.teacher?.id || slot.teacher?.teacherProfile?.id || slot.teacher?.user?.id || '');

  const getPeriodKey = (slot) => String(slot.periodId || slot.periodNumber || `${slot.startTime}-${slot.endTime}`);

  const normalize = (value) => String(value || '').toLowerCase().replace(/\s+/g, '');

  const isClass10SectionA = (slot) => {
    const className = normalize(slot.section?.className || slot.section?.class?.name);
    const sectionName = normalize(slot.section?.name);
    return className === 'class10' && (sectionName === 'sectiona' || sectionName === 'a');
  };

  const minutesFromTime = (time) => {
    const [hours = '0', minutes = '0'] = String(time || '00:00').split(':');
    return Number(hours) * 60 + Number(minutes);
  };

  const currentDay = dayNames[now.getDay()];
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // The backend already scopes GET /timetable to the caller's own schedule whenever the
  // request comes from a TEACHER (school-timetable.service.ts listTimetables: `t.teacher_id
  // = <this teacher> OR t.section_id IN (their teacher_academic_assignments)`), so `timetables`
  // already holds only this teacher's slots — no client-side re-filter is needed. A prior
  // version re-filtered here against `teacherProfile.id` from a *separate* `/teachers/:id`
  // call; when that call failed (it does — see the comment in fetchTimetables about a 403 on
  // the profile), every slot silently failed the match and every day showed "No classes",
  // even though the data the backend sent was correct.
  const visibleTimetables = useMemo(
    () => timetables,
    [timetables]
  );

  const timetableTeachers = useMemo(() => {
    const map = new Map();
    visibleTimetables.forEach((slot) => {
      const key = getSlotTeacherKey(slot);
      const name = formatTeacherName(slot.teacher);
      if (key && name && !map.has(key)) map.set(key, { id: key, name });
    });
    return Array.from(map.values());
  }, [visibleTimetables]);

  const schoolTeachers = useMemo(() => {
    const source = allTeachers.length ? allTeachers : timetableTeachers;
    const map = new Map();
    source.forEach((teacher) => {
      const key = getTeacherKey(teacher);
      const name = getTeacherName(teacher);
      if (key && name && !map.has(key)) {
        map.set(key, {
          id: key,
          name,
          profileId: teacher.teacherProfile?.id,
          userId: teacher.id,
          photo: teacher.profileImage || teacher.user?.profileImage || null,
          subjects: Array.isArray(teacher.subjects) ? teacher.subjects : [],
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [allTeachers, timetableTeachers]);

  const filteredDropdownTeachers = useMemo(() => {
    return schoolTeachers.filter(t => t.name.toLowerCase().includes(teacherSearchQuery.toLowerCase()));
  }, [schoolTeachers, teacherSearchQuery]);

  const teachers = schoolTeachers.map((teacher) => teacher.name);
  const assignedClasses = Array.from(
    new Set((teacherProfile?.assignments || []).map(assignmentClassName).filter(Boolean))
  ).sort();
  const timetableClasses = Array.from(new Set(visibleTimetables.map((t) => formatClassName(t.section)).filter(Boolean))).sort();
  const classes = isTeacher && assignedClasses.length ? assignedClasses : timetableClasses;
  const subjects = Array.from(new Set(visibleTimetables.map((t) => t.subject?.name).filter(Boolean))).sort();
  const types = Array.from(new Set(visibleTimetables.map((t) => t.type || 'offline').filter(Boolean))).sort();
  // Section options for the Scheduled Timetable Slots filter, narrowed to the selected class.
  const slotsSections = Array.from(
    new Set(
      sections
        .filter((sec) => !slotsFilterClass || sec.className === slotsFilterClass)
        .map((sec) => sec.name)
        .filter(Boolean)
    )
  ).sort();
  const periodOptions = useMemo(() => {
    const map = new Map();
    visibleTimetables
      .filter((slot) => slot.dayOfWeek === activeDay)
      .forEach((slot) => {
        const key = getPeriodKey(slot);
        if (!map.has(key)) {
          map.set(key, {
            key,
            periodNumber: slot.periodNumber,
            label: `${slot.periodName || `Period ${slot.periodNumber || map.size + 1}`} (${slot.startTime} - ${slot.endTime})`,
            startTime: slot.startTime,
          });
        }
      });
    return Array.from(map.values()).sort((a, b) => {
      const aPeriod = Number(a.periodNumber || 999);
      const bPeriod = Number(b.periodNumber || 999);
      if (aPeriod !== bPeriod) return aPeriod - bPeriod;
      return minutesFromTime(a.startTime) - minutesFromTime(b.startTime);
    });
  }, [activeDay, visibleTimetables]);

  const validSectionIds = isTeacher && teacherProfile ? new Set((teacherProfile.assignments || []).map(a => String(a.sectionId))) : null;

  const liveTeacherStatus = useMemo(() => {
    const teacherMap = new Map();

    // 1. Initialize all school teachers as "Free"
    schoolTeachers.forEach(teacher => {
      teacherMap.set(teacher.id, {
        key: teacher.id,
        teacherName: teacher.name,
        photo: teacher.photo,
        activeSlot: null,
        nextSlot: null,
        totalSlots: 0,
      });
    });

    // 2. Iterate through all visible timetable slots
    visibleTimetables.forEach((slot) => {
      const teacherKey = getSlotTeacherKey(slot);
      if (!teacherKey || !teacherMap.has(teacherKey)) return;

      const start = minutesFromTime(slot.startTime);
      const end = minutesFromTime(slot.endTime);
      const isToday = slot.dayOfWeek === currentDay;
      const isActive = isToday && currentMinutes >= start && currentMinutes < end;

      const existing = teacherMap.get(teacherKey);
      existing.totalSlots += 1;

      if (isActive) {
        existing.activeSlot = slot;
      }
      if (isToday && start >= currentMinutes && (!existing.nextSlot || start < minutesFromTime(existing.nextSlot.startTime))) {
        existing.nextSlot = slot;
      }
    });

    return Array.from(teacherMap.values()).sort((a, b) => a.teacherName.localeCompare(b.teacherName));
  }, [schoolTeachers, visibleTimetables, currentDay, currentMinutes]);

  const periodWiseStatus = useMemo(() => {
    const daySlots = visibleTimetables.filter((slot) => slot.dayOfWeek === activeDay);
    const periods = new Map();

    daySlots.forEach((slot) => {
      const periodKey = getPeriodKey(slot);
      if (filterPeriod && String(periodKey) !== String(filterPeriod)) return;
      const existing = periods.get(periodKey) || {
        key: String(periodKey),
        periodNumber: slot.periodNumber,
        periodName: slot.periodName || `Period ${slot.periodNumber || periods.size + 1}`,
        startTime: slot.startTime,
        endTime: slot.endTime,
        slots: [],
      };
      existing.slots.push(slot);
      if (minutesFromTime(slot.startTime) < minutesFromTime(existing.startTime)) existing.startTime = slot.startTime;
      if (minutesFromTime(slot.endTime) > minutesFromTime(existing.endTime)) existing.endTime = slot.endTime;
      periods.set(periodKey, existing);
    });

    const slotMatchesFilters = (slot) => {
      if (filterTeacher && formatTeacherName(slot.teacher) !== filterTeacher) return false;
      if (filterClass && formatClassName(slot.section) !== filterClass) return false;
      if (filterType && (slot.type || 'offline') !== filterType) return false;
      if (filterSubject && slot.subject?.name !== filterSubject) return false;
      return true;
    };

    return Array.from(periods.values())
      .sort((a, b) => {
        const aPeriod = Number(a.periodNumber || 999);
        const bPeriod = Number(b.periodNumber || 999);
        if (aPeriod !== bPeriod) return aPeriod - bPeriod;
        return minutesFromTime(a.startTime) - minutesFromTime(b.startTime);
      })
      .map((period) => {
        const engagedKeys = new Set(period.slots.map(getSlotTeacherKey).filter(Boolean));
        const engaged = period.slots
          .filter((slot) => getSlotTeacherKey(slot))
          .filter(slotMatchesFilters)
          .map((slot) => ({
            key: `${slot.id}-${getSlotTeacherKey(slot)}`,
            teacherName: formatTeacherName(slot.teacher) || 'Unnamed Teacher',
            className: formatClassName(slot.section) || 'Class',
            sectionName: slot.section?.name || '',
            subjectName: slot.subject?.name || 'Subject',
            room: slot.room || '',
            type: slot.type || 'offline',
          }));
        const idle = schoolTeachers
          .filter((teacher) => !engagedKeys.has(String(teacher.id)))
          .filter((teacher) => !filterTeacher || teacher.name === filterTeacher);
        // Idle teachers grouped by the subjects actually being taught this period —
        // "who could cover this period" for a substitution, not just "who's free".
        // A teacher qualified for more than one of this period's subjects appears
        // under each; teachers with none of these subjects are left out entirely.
        const periodSubjectNames = Array.from(
          new Set(period.slots.map((slot) => slot.subject?.name).filter(Boolean))
        ).sort();
        const idleBySubject = periodSubjectNames
          .map((subjectName) => ({
            subjectName,
            teachers: idle.filter((teacher) =>
              (teacher.subjects || []).some((s) => s.name === subjectName)
            ),
          }))
          .filter((group) => group.teachers.length > 0);
        const start = minutesFromTime(period.startTime);
        const end = minutesFromTime(period.endTime);
        const isCurrentPeriod = activeDay === currentDay && currentMinutes >= start && currentMinutes < end;
        return { ...period, engaged, idle, idleBySubject, isCurrentPeriod };
      })
      .filter((period) => {
        if (filterStatus === 'engaged') return period.engaged.length > 0;
        if (filterStatus === 'idle') return period.idle.length > 0;
        if (filterTeacher || filterClass || filterType || filterSubject) {
          return period.engaged.length > 0 || period.idle.length > 0;
        }
        return true;
      });
  }, [activeDay, currentDay, currentMinutes, filterClass, filterPeriod, filterStatus, filterSubject, filterTeacher, filterType, schoolTeachers, visibleTimetables]);

  const groupedByDay = {};
  days.forEach((day) => {
    let dayTimetables = visibleTimetables.filter((t) => t.dayOfWeek === day);
    if (!isTeacher && filterTeacher) dayTimetables = dayTimetables.filter((t) => formatTeacherName(t.teacher) === filterTeacher);
    if (filterClass) dayTimetables = dayTimetables.filter((t) => formatClassName(t.section) === filterClass);
    groupedByDay[day] = dayTimetables.sort((a, b) => {
      const aPeriod = Number(a.periodNumber || 999);
      const bPeriod = Number(b.periodNumber || 999);
      if (aPeriod !== bPeriod) return aPeriod - bPeriod;
      return minutesFromTime(a.startTime) - minutesFromTime(b.startTime);
    });
  });

  if (loading) return <div className="p-8 text-sm font-semibold text-slate-500 dark:text-slate-400">Loading...</div>;

  // Pagination for the three long lists rendered below.
  const filteredLiveTeacherStatus = liveTeacherStatus.filter(
    (item) => !selectedLiveTeacherId || String(item.key) === String(selectedLiveTeacherId)
  );
  const liveTeacherTotalPages = Math.max(1, Math.ceil(filteredLiveTeacherStatus.length / TIMETABLE_PAGE_SIZE));
  const safeLiveTeacherPage = Math.min(liveTeacherPage, liveTeacherTotalPages);
  const paginatedLiveTeacherStatus = filteredLiveTeacherStatus.slice(
    (safeLiveTeacherPage - 1) * TIMETABLE_PAGE_SIZE,
    safeLiveTeacherPage * TIMETABLE_PAGE_SIZE
  );

  const activeDaySlots = (groupedByDay[activeDay] || []).filter((slot) => {
    if (slotsFilterClass && formatClassName(slot.section) !== slotsFilterClass) return false;
    if (slotsFilterSection && slot.section?.name !== slotsFilterSection) return false;
    return true;
  });
  const scheduledSlotsTotalPages = Math.max(1, Math.ceil(activeDaySlots.length / TIMETABLE_PAGE_SIZE));
  const safeScheduledSlotsPage = Math.min(scheduledSlotsPage, scheduledSlotsTotalPages);
  const paginatedActiveDaySlots = activeDaySlots.slice(
    (safeScheduledSlotsPage - 1) * TIMETABLE_PAGE_SIZE,
    safeScheduledSlotsPage * TIMETABLE_PAGE_SIZE
  );

  // One distinct colour per subject (sorted by name so it is stable), cycling when there are more subjects than colours.
  const subjectTone = new Map(
    [...new Set(visibleTimetables.map((t) => t.subject?.name).filter(Boolean))].sort().map((name, i) => [name, i])
  );

  return (
    <div className="w-full px-3 sm:px-5 lg:px-8 xl:px-10 dark:bg-slate-950 min-h-screen">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-950 dark:text-white">Timetable and Roster</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Schedule classes and manage the teacher roster.</p>
        </div>
        {!isTeacher && activeView === 'timetable' && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowPeriodsModal(true)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-slate-800 active:scale-[0.99]"
            >
              <Settings className="size-4" />
              Manage Periods
            </button>
            <button
              onClick={handleAddClick}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition hover:brightness-110 active:scale-[0.99]"
            >
              <Plus className="size-5" />
              Add Slot
            </button>
          </div>
        )}
      </div>

      {!isTeacher && (
        <div className="mb-6 inline-flex items-center gap-1.5 rounded-2xl border border-slate-100 bg-white p-1.5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {[
            { key: 'timetable', label: 'Timetable' },
            { key: 'roster', label: 'Roster' },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveView(tab.key)}
              className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
                activeView === tab.key
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6 gap-2 sm:gap-4 mb-6">
        {[
          { label: 'Total Classes', short: 'Classes', value: visibleTimetables.length, icon: CalendarDays, card: 'border-[#D5DEE9]', blob: 'bg-slate-200', tile: 'from-slate-600 to-slate-800 shadow-slate-500/30' },
          { label: 'Teachers', value: teachers.length, icon: Users, card: 'border-[#CFE3FB]', blob: 'bg-blue-100', tile: 'from-blue-500 to-blue-600 shadow-blue-500/30' },
          { label: 'Offline', value: visibleTimetables.filter(t => t.type === 'offline').length, icon: MapPin, card: 'border-[#A7F3D0]', blob: 'bg-emerald-100', tile: 'from-emerald-500 to-teal-600 shadow-emerald-500/30' },
          { label: 'Live', value: visibleTimetables.filter(t => t.type === 'live').length, icon: Video, card: 'border-[#FBCFCF]', blob: 'bg-rose-100', tile: 'from-rose-500 to-red-600 shadow-rose-500/30' },
          { label: 'Lab Sessions', short: 'Labs', value: visibleTimetables.filter(t => t.type === 'lab').length, icon: FlaskConical, card: 'border-[#DDD3FB]', blob: 'bg-violet-100', tile: 'from-violet-500 to-purple-600 shadow-violet-500/30' },
          { label: 'Extra Classes', short: 'Extras', value: visibleTimetables.filter(t => t.type === 'extra').length, icon: CalendarPlus, card: 'border-[#FFDDB8]', blob: 'bg-orange-100', tile: 'from-orange-400 to-orange-600 shadow-orange-500/30' },
        ].map(({ label, short, value, icon: Icon, card, blob, tile }) => (
          <div
            key={label}
            className={`group relative overflow-hidden rounded-xl sm:rounded-2xl border bg-white dark:bg-slate-900 p-2 sm:p-4 flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-1.5 sm:gap-3.5 text-center sm:text-left transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg ${card}`}
          >
            <div className={`pointer-events-none absolute -bottom-6 -right-6 size-16 sm:size-20 rounded-full transition-transform duration-500 group-hover:scale-125 ${blob}`} />
            <div className={`relative flex size-7 sm:size-11 shrink-0 items-center justify-center rounded-lg sm:rounded-2xl bg-gradient-to-br text-white shadow-lg ${tile}`}>
              <Icon className="size-3.5 sm:size-5" />
            </div>
            <div className="relative min-w-0">
              <p className="text-lg sm:text-2xl font-black leading-none text-[#1E293B]">{value}</p>
              <p className="mt-0.5 sm:mt-1 text-[9px] sm:text-xs font-bold uppercase tracking-wide text-slate-500 truncate">
                {short ? (<><span className="hidden sm:inline">{label}</span><span className="inline sm:hidden">{short}</span></>) : label}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Class & Section Selection Grid Card */}
      {!isTeacher && activeView === 'timetable' && (
        <div className="mb-8 p-2 rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-blue-50 dark:bg-slate-800 text-blue-600">
                <Clock className="size-6" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-950 dark:text-white">Weekly Class Timetable</h2>
                <p className="text-xs font-semibold text-slate-500">Select a class section to view and edit schedule</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <CustomSelect
                value={weeklyClassId}
                onChange={(val) => {
                  setWeeklyClassId(val);
                  setSelectedSectionId('');
                }}
                options={[
                  { value: "", label: "Select Class" },
                  ...allClasses.map(cls => ({ value: cls.id, label: cls.name }))
                ]}
                className="w-full sm:w-48"
              />

              <CustomSelect
                value={selectedSectionId}
                onChange={(val) => setSelectedSectionId(val)}
                disabled={!weeklyClassId}
                options={[
                  { value: "", label: "Select Section" },
                  ...weeklySections.map(sec => ({ value: sec.id, label: sec.name }))
                ]}
                className="w-full sm:w-48"
              />

              {selectedSectionId && (
                <>
                  {!isBulkEditMode ? (
                    <button
                      onClick={startBulkEdit}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 dark:bg-slate-800 text-white px-5 py-3 text-sm font-bold shadow-md hover:bg-slate-800 dark:hover:bg-slate-700 active:scale-[0.99] transition"
                    >
                      <Edit2 className="size-4" />
                      Bulk Edit Timetable
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleBulkSave}
                        disabled={isSubmitting}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 text-white px-5 py-3 text-sm font-bold shadow-md hover:bg-emerald-500 disabled:opacity-50 active:scale-[0.99] transition"
                      >
                        Save All Changes
                      </button>
                      <button
                        onClick={() => {
                          setIsBulkEditMode(false);
                          setBulkErrors([]);
                        }}
                        disabled={isSubmitting}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 px-5 py-3 text-sm font-bold shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-[0.99] transition"
                      >
                        Cancel
                      </button>
                    </div>
                  )}

                  <button
                    onClick={() => setIsCopyClassModalOpen(true)}
                    disabled={isBulkEditMode}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 px-5 py-3 text-sm font-bold shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99] transition"
                  >
                    Copy Class Timetable
                  </button>
                </>
              )}
            </div>
          </div>

          {bulkErrors.length > 0 && (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-900/30 dark:bg-red-950/20">
              <div className="flex gap-2 text-red-800 dark:text-red-300 font-bold text-sm mb-2">
                <AlertCircle className="size-5 text-red-650" />
                Timetable Conflict(s) Detected
              </div>
              <ul className="list-disc list-inside text-xs text-red-700 dark:text-red-400 space-y-1 pl-2">
                {bulkErrors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Timetable Grid Render */}
          {selectedSectionId ? (
            <div className="mt-6">
              {/* Copy Day Row (visible in Bulk Edit Mode) */}
              {isBulkEditMode && (
                <div className="mb-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-4">
                  <span className="text-xs font-black uppercase text-slate-500">Copy Day Schedule:</span>
                  <div className="flex items-center gap-2">
                    <select
                      id="copyFromDay"
                      className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-250 outline-none"
                    >
                      {days.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <span className="text-xs text-slate-400">&rarr;</span>
                    <select
                      id="copyToDay"
                      className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-250 outline-none"
                    >
                      {days.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <button
                      type="button"
                      onClick={() => {
                        const from = document.getElementById('copyFromDay').value;
                        const to = document.getElementById('copyToDay').value;
                        handleCopyDay(from, to);
                      }}
                      className="bg-blue-600 text-white rounded-xl px-4 py-1.5 text-xs font-bold hover:bg-blue-500 transition active:scale-95"
                    >
                      Copy Day
                    </button>
                  </div>
                  <span className="text-xs text-slate-400 dark:text-slate-500 italic">
                    Note: Changes will only be persisted after clicking "Save All Changes". You can also Drag & Drop slots to swap periods.
                  </span>
                </div>
              )}

              {/* Grid Table */}
              <div className="overflow-x-auto w-full max-w-full rounded-2xl border border-slate-400 shadow-md dark:border-slate-600">
                <Table className="min-w-full table-fixed text-left border-collapse" style={{ minWidth: 1170 }}>
                  <TableHeader>
                    <TableRow className="border-b border-slate-300 bg-gradient-to-r from-blue-50 via-indigo-50 to-violet-50 hover:bg-blue-50 dark:border-slate-700 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900">
                      <TableHead className="h-auto w-[150px] sticky left-0 top-0 z-40 bg-gradient-to-br from-blue-600 to-indigo-600 px-4 py-4 text-xs font-black uppercase tracking-wider text-white">
                        <span className="inline-flex items-center gap-1.5">
                          <Clock className="size-3.5" />
                          Period
                        </span>
                      </TableHead>
                      {days.map((day) => {
                        const isToday = day === currentDay;
                        return (
                          <TableHead key={day} className={`h-auto min-w-[170px] border-l border-slate-400 px-4 py-3 text-center dark:border-slate-600 ${isToday ? 'bg-white/70 dark:bg-blue-950/30' : ''}`}>
                            <div className="flex flex-col items-center gap-1">
                              <span className={`flex h-8 min-w-[2.75rem] items-center justify-center rounded-lg px-2 text-[11px] font-black text-white shadow-md ${DAY_CHIP_COLORS[day] || 'bg-slate-600'} ${isToday ? 'ring-4 ring-blue-200 dark:ring-blue-900/60' : ''}`}>
                                {dayShortNames[day]}
                              </span>
                              <p className="text-[10px] font-black uppercase tracking-wider text-slate-800 dark:text-white">{day.charAt(0) + day.slice(1).toLowerCase()}</p>
                              {isToday && (
                                <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-300">
                                  <span className="size-1.5 animate-pulse rounded-full bg-blue-500" />
                                  Today
                                </span>
                              )}
                            </div>
                          </TableHead>
                        );
                      })}
                    </TableRow>
                  </TableHeader>
                  <TableBody className="bg-white dark:bg-slate-900">
                    {sortedPeriods.map((period, periodIdx) => {
                      const brk = isBreakPeriod(period);
                      const rowTone = brk
                        ? 'bg-amber-50/60 dark:bg-amber-950/10'
                        : periodIdx % 2 === 1 ? 'bg-slate-50/70 dark:bg-slate-950/40' : 'bg-white dark:bg-slate-900';
                      return (
                      <TableRow key={period.id} className={`border-b border-slate-400 dark:border-slate-600 ${rowTone}`}>
                        <TableCell className={`sticky left-0 z-20 w-[150px] border-r border-slate-300 px-4 py-3 dark:border-slate-700 ${brk ? 'bg-gradient-to-r from-amber-100 to-amber-50 dark:from-slate-900 dark:to-slate-900' : 'bg-gradient-to-r from-blue-100 to-blue-50 dark:from-slate-900 dark:to-slate-900'}`}>
                          <div className="flex items-center gap-2.5">
                            <span className={`flex size-8 shrink-0 items-center justify-center rounded-lg text-xs font-black ${brk ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30' : 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-600/30'}`}>
                              {brk ? <Coffee className="size-4" /> : (period.sequenceNo || '-')}
                            </span>
                            <div className="min-w-0">
                              <p className="truncate text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white">{period.periodName || `Period ${period.sequenceNo}`}</p>
                              <p className="mt-0.5 inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                                <Clock className="size-3" />
                                {period.startTime} - {period.endTime}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        {days.map(day => {
                          const slot = getSlotForGrid(day, period.id);
                          return (
                            <TableCell
                              key={day}
                              className={`relative group align-top border-l border-slate-400 p-2 dark:border-slate-700 ${day === currentDay ? 'bg-blue-50/50 dark:bg-blue-950/10' : ''}`}
                              onDragOver={(e) => { if (isBulkEditMode) e.preventDefault(); }}
                              onDrop={(e) => { if (isBulkEditMode) handleDrop(e, day, period.id); }}
                            >
                              {isBulkEditMode ? (
                                <div
                                  draggable={!!(slot?.subjectId && slot?.teacherId)}
                                  onDragStart={(e) => { if (isBulkEditMode) handleDragStart(e, day, period.id); }}
                                  className={`space-y-2 p-2 rounded-xl border transition-all cursor-grab active:cursor-grabbing ${
                                    slot?.subjectId && slot?.teacherId
                                      ? 'border-blue-100 bg-blue-50/50 dark:border-blue-900/30 dark:bg-blue-950/20'
                                      : 'border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-950/20'
                                  }`}
                                >
                                  {/* Type Dropdown */}
                                  <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Type</label>
                                    <select
                                      value={slot?.type || 'offline'}
                                      onChange={(e) => {
                                        const newType = e.target.value;
                                        handleCellChange(day, period.id, 'type', newType);
                                        if (newType === 'break') {
                                          handleCellChange(day, period.id, 'subjectId', '');
                                          handleCellChange(day, period.id, 'teacherId', '');
                                          if (!slot?.remarks) {
                                            handleCellChange(day, period.id, 'remarks', 'Break');
                                          }
                                        }
                                      }}
                                      className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 py-1 text-xs font-semibold text-slate-750 dark:text-slate-205 outline-none"
                                    >
                                      <option value="offline">Offline</option>
                                      <option value="live">Live</option>
                                      <option value="lab">Lab</option>
                                      <option value="extra">Extra</option>
                                      <option value="break">Break</option>
                                    </select>
                                  </div>

                                  {slot?.type === 'break' ? (
                                    <>
                                      {/* Remarks/Name input for Break */}
                                      <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Break Title</label>
                                        <input
                                          type="text"
                                          value={slot?.remarks || ''}
                                          onChange={(e) => handleCellChange(day, period.id, 'remarks', e.target.value)}
                                          className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 py-1 text-xs font-semibold outline-none"
                                          placeholder="e.g. Lunch Break"
                                        />
                                      </div>
                                      {/* Room input */}
                                      <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Room (Opt)</label>
                                        <input
                                          type="text"
                                          value={slot?.room || ''}
                                          onChange={(e) => handleCellChange(day, period.id, 'room', e.target.value)}
                                          className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 py-1 text-xs font-semibold outline-none"
                                          placeholder="e.g. Playground"
                                        />
                                      </div>
                                    </>
                                  ) : (
                                    <>
                                      {/* Subject Dropdown */}
                                      <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Subject</label>
                                        <select
                                          value={slot?.subjectId || ''}
                                          onChange={(e) => handleCellChange(day, period.id, 'subjectId', e.target.value)}
                                          className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 py-1 text-xs font-semibold text-slate-750 dark:text-slate-205 outline-none"
                                        >
                                          <option value="">-- Clear --</option>
                                          {getSubjectsForSection(selectedSectionId).map(sub => (
                                            <option key={sub.id} value={sub.id}>
                                              {sub.name}
                                            </option>
                                          ))}
                                        </select>
                                      </div>

                                      {/* Teacher Dropdown */}
                                      <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Teacher</label>
                                        <select
                                          value={slot?.teacherId || ''}
                                          disabled={!slot?.subjectId}
                                          onChange={(e) => handleCellChange(day, period.id, 'teacherId', e.target.value)}
                                          className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 py-1 text-xs font-semibold text-slate-750 dark:text-slate-205 outline-none disabled:bg-slate-50 disabled:text-slate-400 dark:disabled:bg-slate-950"
                                        >
                                          <option value="">-- Select --</option>
                                          {getTeachersForSubject(selectedSectionId, slot?.subjectId).map(t => (
                                            <option key={t.teacherProfile?.id} value={t.teacherProfile?.id}>
                                              {t.name}
                                            </option>
                                          ))}
                                        </select>
                                      </div>

                                      {/* Room input */}
                                      <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Room</label>
                                        <input
                                          type="text"
                                          value={slot?.room || ''}
                                          onChange={(e) => handleCellChange(day, period.id, 'room', e.target.value)}
                                          className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 py-1 text-xs font-semibold outline-none"
                                          placeholder="101"
                                        />
                                      </div>
                                    </>
                                  )}
                                </div>
                              ) : (
                                // Read-only view
                                slot ? (
                                  <WeeklyGridSlotCard
                                    slot={slot}
                                    subjectName={slot.subject?.name || allSubjects.find(s => s.id === slot.subjectId)?.name || 'Subject'}
                                    teacherName={formatTeacherName(slot.teacher) || allTeachers.find(t => t.teacherProfile?.id === slot.teacherId)?.name || 'Teacher'}
                                    photoUrl={getSlotTeacherPhoto(slot)}
                                    onEdit={() => handleEditClick(slot)}
                                    onDelete={() => handleDeleteClick(slot.id)}
                                  />
                                ) : isBreakPeriod(period) ? (
                                  <div className="relative h-[80px] overflow-hidden rounded-xl border border-amber-200/70 bg-gradient-to-br from-amber-50 to-orange-50 dark:border-amber-900/30 dark:from-amber-950/20 dark:to-orange-950/10 flex flex-col items-center justify-center gap-1 p-2.5">
                                    <Coffee className="size-5 text-amber-500" />
                                    <span className="text-xs font-black text-amber-800 dark:text-amber-300">
                                      {period.periodName || 'Break'}
                                    </span>
                                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">
                                      {period.startTime} - {period.endTime}
                                    </span>
                                  </div>
                                ) : (
                                  <div className="h-[80px] rounded-xl border border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-1 bg-slate-50/40 dark:bg-slate-900/30 text-slate-500 dark:text-slate-400">
                                    <Plus className="size-4" />
                                    <span className="text-[10px] font-bold uppercase tracking-wider">Free</span>
                                  </div>
                                )
                              )}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-12 text-center bg-slate-50 dark:bg-slate-950">
              <Clock className="mx-auto size-12 text-slate-300 dark:text-slate-700 animate-pulse" />
              <h3 className="mt-4 text-base font-bold text-slate-700 dark:text-slate-350">Select a Class & Section</h3>
              <p className="mt-1 text-sm text-slate-400">Choose a class and section from the dropdown above to view or bulk-edit the weekly timetable.</p>
            </div>
          )}
        </div>
      )}

      {isTeacher && (
        <section className="rounded-[2rem] bg-white p-4 shadow-lg shadow-slate-200/60 ring-1 ring-slate-100 sm:p-6 dark:bg-slate-900 dark:ring-slate-800">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30">
                <Clock className="size-5" />
              </span>
              <div>
                <h2 className="text-lg font-extrabold leading-tight tracking-tight text-[#112A46] dark:text-white sm:text-xl">Teaching Schedule</h2>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Your classes, period by period</p>
              </div>
            </div>
            <span className="shrink-0 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-3.5 py-1.5 text-[11px] font-black uppercase tracking-wider text-white shadow-md shadow-blue-500/30">
              Today · {dayShortNames[currentDay] || currentDay}
            </span>
          </div>

          <div className="mt-5 w-full max-w-full overflow-x-auto">
            <div className="relative grid min-w-[20rem] w-full grid-cols-6 rounded-2xl bg-slate-100/80 p-1 sm:w-[28rem] dark:bg-slate-950">
              {/* Sliding active pill: moves to the selected day instead of jumping. */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-1 left-1 w-[calc((100%-0.5rem)/6)] rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 shadow-md shadow-blue-600/30 transition-transform duration-300 ease-out"
                style={{ transform: `translateX(${Math.max(0, days.indexOf(activeDay)) * 100}%)` }}
              />
              {days.map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => setActiveDay(day)}
                  className={`relative z-10 flex items-center justify-center gap-1.5 rounded-xl px-1 py-2.5 text-xs font-black uppercase tracking-wider transition-colors duration-300 ${
                    activeDay === day ? 'text-white' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {dayShortNames[day] || day}
                  {day === currentDay && <span className={`size-1.5 rounded-full transition-colors duration-300 ${activeDay === day ? 'bg-white' : 'bg-emerald-500'}`} title="Today" />}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2.5 md:gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {groupedByDay[activeDay].length === 0 ? (
              <div className="col-span-full rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center dark:border-slate-800 dark:bg-slate-950">
                <Clock className="mx-auto size-10 text-slate-300 dark:text-slate-700" />
                <h3 className="mt-4 text-sm font-bold text-slate-700 dark:text-slate-300">No classes scheduled for {dayShortNames[activeDay] || activeDay}</h3>
                <p className="mt-1 text-xs font-semibold text-slate-400">Your assigned timetable slots will appear here.</p>
              </div>
            ) : (
              groupedByDay[activeDay].map((slot) => {
                const isCurrentPeriod = slot.dayOfWeek === currentDay
                  && currentMinutes >= minutesFromTime(slot.startTime)
                  && currentMinutes < minutesFromTime(slot.endTime);
                const tone = isCurrentPeriod ? TEACHER_TONES.now : TEACHER_TONES.subjects[(subjectTone.get(slot.subject?.name) ?? 0) % TEACHER_TONES.subjects.length];

                return (
                  <article
                    key={slot.id}
                    className={`group relative overflow-hidden rounded-xl sm:rounded-2xl border bg-white p-2.5 pl-3.5 sm:p-4 sm:pl-5 transition-all duration-200 hover:shadow-md dark:bg-slate-900 ${
                      isCurrentPeriod ? 'border-emerald-300 bg-emerald-50/40' : 'border-slate-200 hover:border-slate-300 dark:border-slate-800'
                    }`}
                  >
                    <span className={`absolute inset-y-0 left-0 w-1 sm:w-1.5 ${tone.bar}`} />
                    <div className="flex flex-col gap-2">
                      <div className="flex items-start justify-between gap-1.5">
                        <span className="truncate max-w-[80px] rounded-md bg-slate-100 px-2 py-0.5 text-[9px] sm:text-[11px] font-bold uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          {slot.periodName || `P${slot.periodNumber || '-'}`}
                        </span>
                        <div className="flex gap-1 shrink-0">
                          <button
                            onClick={() => handleEditClick(slot)}
                            className="rounded-lg border border-slate-200 bg-white p-1 sm:p-1.5 text-slate-500 transition hover:bg-slate-50 hover:text-slate-800 dark:border-slate-700 dark:bg-slate-900"
                            title="Edit Slot"
                          >
                            <Edit2 className="size-2.5 sm:size-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(slot.id)}
                            className="rounded-lg border border-slate-200 bg-white p-1 sm:p-1.5 text-slate-400 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-slate-700 dark:bg-slate-900"
                            title="Delete Slot"
                          >
                            <Trash2 className="size-2.5 sm:size-3" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {isCurrentPeriod ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-2 py-0.5 text-[9px] sm:text-[11px] font-bold uppercase text-white">
                            <span className="size-1.5 animate-pulse rounded-full bg-white" /> Now
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-[9px] sm:text-[11px] font-bold uppercase tracking-wide text-slate-500">
                            <span className={`size-1.5 rounded-full ${tone.bar}`} />
                            {slot.type || 'Offline'}
                          </span>
                        )}
                      </div>
                    </div>

                    <h3 className="mt-2.5 sm:mt-3.5 text-xs sm:text-base font-bold text-slate-900 dark:text-white truncate">
                      {formatClassName(slot.section) || 'Class'}{slot.section?.name ? ` - ${slot.section.name}` : ''}
                    </h3>
                    <p className={`mt-0.5 sm:mt-1 text-[10px] sm:text-sm font-semibold truncate ${tone.text}`}>{slot.subject?.name || 'Subject'}</p>

                    <div className="mt-2.5 sm:mt-3.5 grid gap-1 sm:gap-1.5 border-t border-slate-100 pt-2 sm:pt-3 text-[9px] sm:text-xs font-medium text-slate-600 dark:border-slate-800 dark:text-slate-300">
                      <span className="inline-flex items-center gap-1 sm:gap-2 truncate">
                        <Clock className="size-3 sm:size-3.5 shrink-0 text-slate-400" />
                        {slot.startTime} - {slot.endTime}
                      </span>
                      <span className="inline-flex items-center gap-1 sm:gap-2 truncate" title={slot.room ? `Room ${slot.room}` : 'Room not assigned'}>
                        <MapPin className="size-3 sm:size-3.5 shrink-0 text-slate-400" />
                        {slot.room ? `Room ${slot.room}` : 'Not assigned'}
                      </span>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </section>
      )}

      {!isTeacher && activeView === 'roster' && (
        <div className="mb-6 rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-300">Live Teacher Status</p>
              <h2 className="mt-1 text-xl font-black text-slate-950 dark:text-white">All Classes</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Shows who is teaching now and who is free in the staff room.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-end gap-3 shrink-0">
              <div className="relative w-full sm:w-60 text-left" ref={teacherDropdownRef}>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-450 dark:text-slate-400 mb-1">Filter Teacher</label>
                <button
                  type="button"
                  onClick={() => !isBulkEditMode && setIsTeacherDropdownOpen(!isTeacherDropdownOpen)}
                  disabled={isBulkEditMode}
                  className="w-full flex items-center justify-between gap-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 outline-none hover:bg-slate-50 dark:hover:bg-slate-850 transition disabled:opacity-50"
                >
                  <span className="truncate">
                    {selectedLiveTeacherId
                      ? schoolTeachers.find(t => String(t.id) === String(selectedLiveTeacherId))?.name || 'Select Teacher'
                      : 'All Teachers'}
                  </span>
                  <ChevronDown className={`size-4 text-slate-400 transition-transform ${isTeacherDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isTeacherDropdownOpen && (
                  <div className="absolute right-0 left-0 sm:left-auto sm:w-64 mt-2 z-50 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl p-2 max-h-60 overflow-y-auto">
                    <div className="relative mb-2">
                      <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={teacherSearchQuery}
                        onChange={(e) => setTeacherSearchQuery(e.target.value)}
                        placeholder="Search teacher..."
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-1.5 pl-9 pr-3 text-xs font-semibold text-slate-900 dark:text-white outline-none placeholder:text-slate-400 focus:border-blue-400"
                      />
                    </div>
                    <div className="space-y-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedLiveTeacherId('');
                          setIsTeacherDropdownOpen(false);
                          setTeacherSearchQuery('');
                        }}
                        className="w-full text-left px-3 py-2 text-xs font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-850 text-blue-600 dark:text-blue-400"
                      >
                        All Teachers
                      </button>
                      {filteredDropdownTeachers.length === 0 ? (
                        <p className="text-center py-2 text-xs text-slate-400">No teachers found</p>
                      ) : (
                        filteredDropdownTeachers.map(teacher => (
                          <button
                            key={teacher.id}
                            type="button"
                            onClick={() => {
                              setSelectedLiveTeacherId(teacher.id);
                              setIsTeacherDropdownOpen(false);
                              setTeacherSearchQuery('');
                            }}
                            className={`w-full text-left px-3 py-2 text-xs font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-850 transition ${
                              String(selectedLiveTeacherId) === String(teacher.id)
                                ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                                : 'text-slate-700 dark:text-slate-250'
                            }`}
                          >
                            {teacher.name}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="rounded-2xl bg-slate-50 dark:bg-slate-850 px-4 py-2 text-right shrink-0 h-[46px] flex flex-col justify-center border border-slate-100 dark:border-slate-800">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 leading-none">Now</p>
                <p className="text-sm font-black text-slate-900 dark:text-white leading-none mt-1">
                  {currentDay} {String(now.getHours()).padStart(2, '0')}:{String(now.getMinutes()).padStart(2, '0')}
                </p>
              </div>
            </div>
          </div>

          {liveTeacherStatus.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-5 text-sm font-semibold text-slate-500 dark:text-slate-400">
              No teachers found.
            </div>
          ) : filteredLiveTeacherStatus.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-8 text-center bg-slate-50 dark:bg-slate-950 text-sm font-semibold text-slate-500 dark:text-slate-400">
              No status records found for the selected teacher.
            </div>
          ) : (
            <>
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 animate-fade-in">
              {paginatedLiveTeacherStatus.map((item) => {
                const activeSlot = item.activeSlot;
                const nextSlot = item.nextSlot;
                const isEngaged = Boolean(activeSlot);
                const palette = isEngaged ? getSlotPalette(activeSlot) : null;
                const initials = item.teacherName.split(' ').map((p) => p[0]).join('').toUpperCase().slice(0, 2);
                const sectionLabel = (slot) => `${formatClassName(slot.section) || 'Class'}${slot.section?.name ? ` - ${slot.section.name}` : ''}`;
                const minutesLeft = activeSlot ? Math.max(0, minutesFromTime(activeSlot.endTime) - currentMinutes) : 0;
                return (
                  <div
                    key={item.key}
                    className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700 dark:bg-slate-900"
                  >
                    <div className={`flex items-center justify-between gap-2 px-3.5 py-2 text-white ${isEngaged ? palette.bar : 'bg-slate-700'}`}>
                      <span className="line-clamp-1 text-xs font-black">
                        {isEngaged ? (activeSlot.subject?.name || 'Subject') : 'In Staff Room'}
                      </span>
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-white/25 px-1.5 py-0.5 text-[9px] font-black uppercase">
                        {isEngaged && <span className="size-1.5 animate-pulse rounded-full bg-white" />}
                        {isEngaged ? 'Engaged' : 'Free'}
                      </span>
                    </div>

                    <div className="flex flex-1 flex-col gap-3 p-3.5">
                      <div className="flex items-center gap-2.5">
                        <PhotoAvatar
                          src={item.photo}
                          name={item.teacherName}
                          initials={initials}
                          className={`size-9 text-xs font-black ${isEngaged ? palette.avatar : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black text-slate-950 dark:text-white">{item.teacherName}</p>
                          <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">{item.totalSlots} period{item.totalSlots === 1 ? '' : 's'} / week</p>
                        </div>
                      </div>

                      {isEngaged ? (
                        <div className="space-y-2">
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Teaching {sectionLabel(activeSlot)}</p>
                          <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                            <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-1.5 py-0.5 dark:bg-slate-800">
                              <Clock className={`size-3 ${palette.icon}`} />
                              {activeSlot.startTime} - {activeSlot.endTime}
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-1.5 py-0.5 dark:bg-slate-800">
                              <MapPin className={`size-3 ${palette.icon}`} />
                              {activeSlot.room ? activeSlot.room : 'Classroom'}
                            </span>
                            <span className="rounded-md bg-slate-100 px-1.5 py-0.5 dark:bg-slate-800">{minutesLeft} min left</span>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                            {nextSlot
                              ? `Next: ${nextSlot.subject?.name || 'Subject'} (${sectionLabel(nextSlot)})`
                              : 'No more periods today'}
                          </p>
                          <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                            <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-1.5 py-0.5 dark:bg-slate-800">
                              <MapPin className="size-3 text-slate-500" />
                              Staff Room
                            </span>
                            {nextSlot && (
                              <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-1.5 py-0.5 dark:bg-slate-800">
                                <Clock className="size-3 text-slate-500" />
                                at {nextSlot.startTime}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <DataTablePagination
              page={safeLiveTeacherPage}
              limit={TIMETABLE_PAGE_SIZE}
              total={filteredLiveTeacherStatus.length}
              totalPages={liveTeacherTotalPages}
              onPageChange={setLiveTeacherPage}
            />
            </>
          )}
        </div>
      )}

      {!isTeacher && activeView === 'roster' && (
        <div className="mb-6 rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-300">Period-wise Teacher Map</p>
              <h2 className="mt-1 text-xl font-black text-slate-950 dark:text-white">{activeDay} timetable status</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Each period shows which teachers are in class and which teachers are idle in the staff room.
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 dark:bg-slate-850 px-4 py-3 text-right">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Teachers</p>
              <p className="text-sm font-black text-slate-900 dark:text-white">{schoolTeachers.length} total</p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-7">
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Day</label>
              <select
                value={activeDay}
                onChange={(e) => setActiveDay(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 outline-none focus:border-blue-400"
              >
                {days.map((day) => (<option key={day} value={day}>{day}</option>))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Period</label>
              <select
                value={filterPeriod}
                onChange={(e) => setFilterPeriod(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 outline-none focus:border-blue-400"
              >
                <option value="">All Periods</option>
                {periodOptions.map((period) => (<option key={period.key} value={period.key}>{period.label}</option>))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Teacher</label>
              <select
                value={filterTeacher}
                onChange={(e) => setFilterTeacher(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 outline-none focus:border-blue-400"
              >
                <option value="">All Teachers</option>
                {teachers.map((teacher) => (<option key={teacher} value={teacher}>{teacher}</option>))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Class</label>
              <select
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 outline-none focus:border-blue-400"
              >
                <option value="">All Classes</option>
                {classes.map((cls) => (<option key={cls} value={cls}>{cls}</option>))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Subject</label>
              <select
                value={filterSubject}
                onChange={(e) => setFilterSubject(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 outline-none focus:border-blue-400"
              >
                <option value="">All Subjects</option>
                {subjects.map((subject) => (<option key={subject} value={subject}>{subject}</option>))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 outline-none focus:border-blue-400"
              >
                <option value="">Engaged + Idle</option>
                <option value="engaged">Engaged Only</option>
                <option value="idle">Idle Only</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Type</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 outline-none focus:border-blue-400"
              >
                <option value="">All Types</option>
                {types.map((type) => (<option key={type} value={type}>{type.toUpperCase()}</option>))}
              </select>
            </div>
          </div>

          {(filterPeriod || filterTeacher || filterClass || filterSubject || filterStatus || filterType) && (
            <div className="mt-3 flex justify-end">
              <button
                onClick={() => {
                  setFilterPeriod('');
                  setFilterTeacher('');
                  setFilterClass('');
                  setFilterSubject('');
                  setFilterStatus('');
                  setFilterType('');
                }}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                Clear Map Filters
              </button>
            </div>
          )}

          {periodWiseStatus.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-5 text-sm font-semibold text-slate-500 dark:text-slate-400">
              No periods are created for {activeDay}. Add timetable slots to see engaged and idle teachers.
            </div>
          ) : (
            <div className="mt-5 overflow-x-auto w-full max-w-full rounded-2xl border border-slate-100 dark:border-slate-800">
              <div className="min-w-[1000px]">
                <div className="hidden md:grid grid-cols-12 bg-slate-50 dark:bg-slate-850 px-4 py-3 text-xs font-black uppercase tracking-wider text-slate-500">
                  <div className="col-span-2">Period</div>
                  <div className="col-span-5">Engaged in Class</div>
                  <div className="col-span-5">Idle / Staff Room</div>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {periodWiseStatus.map((period) => (
                    <div
                      key={period.key}
                      className={`grid grid-cols-1 gap-4 px-4 py-4 md:grid-cols-12 md:gap-3 ${
                        period.isCurrentPeriod ? 'bg-emerald-50/80 dark:bg-emerald-950/20' : 'bg-white dark:bg-slate-900'
                      }`}
                    >
                    <div className="md:col-span-2">
                      <div className="flex items-center gap-2">
                        <span className={`flex size-8 items-center justify-center rounded-xl text-xs font-black ${
                          period.isCurrentPeriod ? 'bg-emerald-600 text-white' : 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300'
                        }`}>
                          {period.periodNumber || '-'}
                        </span>
                        <div>
                          <p className="text-sm font-black text-slate-950 dark:text-white">{period.periodName}</p>
                          <p className="text-xs font-semibold text-slate-500">{period.startTime} - {period.endTime}</p>
                        </div>
                      </div>
                    </div>

                    <div className="md:col-span-5">
                      <p className="mb-2 text-[11px] font-black uppercase tracking-wider text-slate-400 md:hidden">Engaged in Class</p>
                      {period.engaged.length === 0 ? (
                        <p className="rounded-xl bg-slate-50 dark:bg-slate-850 px-3 py-2 text-xs font-semibold text-slate-500">
                          No teacher assigned in this period
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {period.engaged.map((item) => (
                            <div key={item.key} className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 dark:border-emerald-900/50 dark:bg-emerald-950/20">
                              <p className="text-sm font-black text-slate-950 dark:text-white">{item.teacherName}</p>
                              <p className="text-xs font-semibold text-slate-600 dark:text-slate-350">
                                {item.className}{item.sectionName ? ` - ${item.sectionName}` : ''} - {item.subjectName}
                                {item.room ? ` - Room ${item.room}` : ''}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="md:col-span-5">
                      <p className="mb-2 text-[11px] font-black uppercase tracking-wider text-slate-400 md:hidden">Idle / Staff Room</p>
                      {period.idle.length === 0 ? (
                        <p className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-300">
                          All teachers are engaged in this period
                        </p>
                      ) : period.idleBySubject.length === 0 ? (
                        <p className="rounded-xl bg-slate-50 dark:bg-slate-850 px-3 py-2 text-xs font-semibold text-slate-500">
                          No idle teacher is qualified for this period's subjects
                        </p>
                      ) : (
                        <div className="space-y-2.5">
                          {period.idleBySubject.map((group) => (
                            <div key={group.subjectName}>
                              <p className="mb-1 text-[10px] font-black uppercase tracking-wider text-slate-400">{group.subjectName}</p>
                              <div className="flex flex-wrap gap-2">
                                {group.teachers.map((teacher) => (
                                  <button
                                    key={`${period.key}-${group.subjectName}-${teacher.id}`}
                                    onClick={() => handleAssignIdleTeacher(teacher, period, teacher.subjects.find((s) => s.name === group.subjectName)?.id)}
                                    title={`Click to assign ${teacher.name} to this period`}
                                    className="inline-flex items-center gap-1 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition active:scale-95 cursor-pointer dark:border-blue-950/50 dark:bg-blue-950/30 dark:text-blue-300 dark:hover:bg-blue-600 dark:hover:text-white"
                                  >
                                    <Plus className="size-3 shrink-0" />
                                    {teacher.name}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        </div>
      )}

      {!isTeacher && activeView === 'timetable' && (
        <section className="mb-6 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-3 mb-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col gap-1">
              <p className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-300">Daily Slots</p>
              <h2 className="text-xl font-black text-slate-950 dark:text-white">Scheduled Timetable Slots ({activeDay})</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                List of all timetable entries for the selected day.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={slotsFilterClass}
                onChange={(e) => setSlotsFilterClass(e.target.value)}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none focus:border-blue-400"
              >
                <option value="">All Classes</option>
                {classes.map((cls) => (<option key={cls} value={cls}>{cls}</option>))}
              </select>
              <select
                value={slotsFilterSection}
                onChange={(e) => setSlotsFilterSection(e.target.value)}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none focus:border-blue-400"
              >
                <option value="">All Sections</option>
                {slotsSections.map((sec) => (<option key={sec} value={sec}>Section {sec}</option>))}
              </select>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {activeDaySlots.length === 0 ? (
              <div className="col-span-full rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-10 text-center bg-slate-50 dark:bg-slate-950">
                <Clock className="mx-auto size-10 text-slate-300 dark:text-slate-700" />
                <h3 className="mt-4 text-sm font-bold text-slate-700 dark:text-slate-300">No classes scheduled for {activeDay}</h3>
                <p className="mt-1 text-xs text-slate-400">Create a new slot using the button at the top.</p>
              </div>
            ) : (
              paginatedActiveDaySlots.map((slot) => {
                const isBreak = slot.type === 'break';
                const palette = getSubjectPalette(slot, subjectColorMap);
                const teacherName = isBreak ? 'No teacher' : (formatTeacherName(slot.teacher) || 'Unnamed Teacher');
                const initials = isBreak ? '—' : teacherName.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
                const title = isBreak ? (slot.remarks || 'Break') : (slot.subject?.name || 'Subject');
                const isNow = slot.dayOfWeek === currentDay
                  && currentMinutes >= minutesFromTime(slot.startTime)
                  && currentMinutes < minutesFromTime(slot.endTime);
                return (
                  <div
                    key={slot.id}
                    className={`group relative overflow-hidden rounded-2xl border bg-white dark:bg-slate-900 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg flex flex-col justify-between ${
                      isNow ? 'border-emerald-300 ring-2 ring-emerald-200/70 dark:border-emerald-700 dark:ring-emerald-900/50' : `border-slate-100 dark:border-slate-800 ${palette.ring}`
                    }`}
                  >
                    {/* Left accent bar + top-right corner glow */}
                    <span aria-hidden className={`absolute inset-y-0 left-0 w-1.5 ${palette.bar}`} />
                    <span aria-hidden className={`pointer-events-none absolute -right-8 -top-8 size-28 rounded-full ${palette.glow} transition-transform duration-300 group-hover:scale-125`} />

                    <div className="relative p-4 pl-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <span className={`inline-flex max-w-full items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-black ${palette.badge}`}>
                            <span className={`size-1.5 shrink-0 rounded-full ${palette.bar}`} />
                            <span className="truncate">{title}</span>
                          </span>
                        </div>
                        <div className="flex shrink-0 gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEditClick(slot)}
                            title="Edit Slot"
                            className="rounded-lg border border-slate-100 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                          >
                            <Edit2 className="size-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(slot.id)}
                            title="Delete Slot"
                            className="rounded-lg border border-red-100 dark:border-rose-950/40 bg-white/90 dark:bg-slate-900/90 p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center gap-2">
                        <h3 className="text-lg font-black leading-tight text-slate-950 dark:text-white">
                          {formatClassName(slot.section)}{slot.section?.name ? ` - ${slot.section?.name}` : ''}
                        </h3>
                        {isNow && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-0.5 text-[9px] font-black uppercase text-white">
                            <span className="size-1.5 animate-pulse rounded-full bg-white" />
                            Now
                          </span>
                        )}
                      </div>

                      <div className="mt-3 flex items-center gap-2.5">
                        <Avatar className="size-8">
                          <AvatarFallback className={`text-[11px] font-black ${palette.avatar}`}>
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <span className="truncate text-sm font-semibold text-slate-700 dark:text-slate-300">{teacherName}</span>
                      </div>
                    </div>

                    <div className="relative flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/70 px-4 py-2.5 pl-5 dark:border-slate-800 dark:bg-slate-950/40">
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-600 dark:text-slate-300">
                        <Clock className={`size-3.5 ${palette.icon}`} />
                        {slot.periodName || `Period ${slot.periodNumber || 1}`}
                        <span className="font-semibold text-slate-400">· {slot.startTime} - {slot.endTime}</span>
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-black uppercase ${SLOT_TYPE_STYLES[slot.type || 'offline'] || SLOT_TYPE_STYLES.offline}`}>
                          {slot.type || 'offline'}
                        </span>
                        {slot.room && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-white px-1.5 py-0.5 text-[10px] font-bold text-slate-500 border border-slate-100 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800">
                            <MapPin className="size-3" />
                            {slot.room}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <DataTablePagination
            page={safeScheduledSlotsPage}
            limit={TIMETABLE_PAGE_SIZE}
            total={activeDaySlots.length}
            totalPages={scheduledSlotsTotalPages}
            onPageChange={setScheduledSlotsPage}
          />
        </section>
      )}

      <Modal isOpen={isModalOpen} title={selectedTimetable ? 'Edit Timetable Slot' : 'Add Timetable Slot'} onClose={() => setIsModalOpen(false)} size="lg">
        <TimetableForm timetable={selectedTimetable} onSubmit={handleSubmit} onCancel={() => setIsModalOpen(false)} isLoading={isSubmitting} />
      </Modal>

      <Modal isOpen={showPeriodsModal} title="Manage Periods" onClose={() => setShowPeriodsModal(false)} size="lg">
        <PeriodSettings />
      </Modal>

      <Modal isOpen={isCopyClassModalOpen} title="Copy Timetable to Class" onClose={() => { setIsCopyClassModalOpen(false); setTargetClassSectionId(''); }} size="md">
        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            Select the target Class & Section to copy the current timetable schedule to. Any existing slots in the target class will be deleted and overwritten.
          </p>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Target Class & Section</label>
            <select
              value={targetClassSectionId}
              onChange={(e) => setTargetClassSectionId(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-4 py-2 outline-none focus:border-blue-400 dark:bg-slate-900 dark:text-white"
            >
              <option value="">Select Target Class & Section</option>
              {sections.filter(sec => String(sec.id) !== String(selectedSectionId)).map(sec => (
                <option key={sec.id} value={sec.id}>
                  {sec.className} - {sec.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleCopyClass}
              disabled={isSubmitting || !targetClassSectionId}
              className="flex-1 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] px-4 py-2.5 font-bold text-white shadow-sm hover:shadow-md disabled:opacity-50 transition-all duration-200"
            >
              Copy Timetable
            </button>
            <button
              onClick={() => {
                setIsCopyClassModalOpen(false);
                setTargetClassSectionId('');
              }}
              className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 font-semibold text-slate-700 hover:bg-slate-50 active:scale-[0.98] transition-all duration-200"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
