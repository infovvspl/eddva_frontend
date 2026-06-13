import React, { useEffect, useMemo, useState } from 'react';
import api from '@/lib/api/school-client';
import { useAuth } from '@/context/SchoolAuthContext';
import {
  CalendarCheck2,
  ChevronLeft,
  ChevronRight,
  XCircle,
  MinusCircle,
  Timer,
  CheckCircle2,
  TrendingUp,
  CalendarDays,
} from 'lucide-react';

/* ─── helpers ─────────────────────────────────────────────────────────── */
function clampPct(v) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(100, Math.max(0, Math.round(n))) : 0;
}
function monthKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
function localDateKey(d) {
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function parseRecordDate(v) {
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}
function monthLabel(key) {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}
function getMonthRange(key) {
  const [y, m] = key.split('-').map(Number);
  return {
    startDate: new Date(y, m - 1, 1).toISOString(),
    endDate: new Date(y, m, 0, 23, 59, 59).toISOString(),
  };
}
function shiftMonth(key, offset) {
  const [y, m] = key.split('-').map(Number);
  return monthKey(new Date(y, m - 1 + offset, 1));
}
function normalizeStatus(s) { return String(s || '').toLowerCase(); }

const STATUS = {
  present: { label: 'Present', color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe', ring: '#3b82f6', Icon: CheckCircle2 },
  late: { label: 'Late', color: '#f59e0b', bg: '#fffbeb', border: '#fde68a', ring: '#f59e0b', Icon: Timer },
  leave: { label: 'Leave', color: '#8b5cf6', bg: '#f5f3ff', border: '#ddd6fe', ring: '#8b5cf6', Icon: MinusCircle },
  absent: { label: 'Absent', color: '#ef4444', bg: '#fef2f2', border: '#fecaca', ring: '#ef4444', Icon: XCircle },
};
function getMeta(status) {
  return STATUS[normalizeStatus(status)] || null;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/* ─── component ───────────────────────────────────────────────────────── */
export default function Attendance() {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(monthKey());

  useEffect(() => {
    const fetch = async () => {
      const userId = user?.id || user?.userId;
      if (!userId) { setLoading(false); return; }
      setLoading(true);
      const { startDate, endDate } = getMonthRange(selectedMonth);
      try {
        const res = await api.get('/attendance', { params: { userId, startDate, endDate, limit: 31 } });
        const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
        setRecords(data);
      } catch { setRecords([]); }
      finally { setLoading(false); }
    };
    fetch();
  }, [user, selectedMonth]);

  const stats = useMemo(() => {
    const present = records.filter(r => normalizeStatus(r.status) === 'present').length;
    const absent = records.filter(r => normalizeStatus(r.status) === 'absent').length;
    const late = records.filter(r => normalizeStatus(r.status) === 'late').length;
    const leave = records.filter(r => normalizeStatus(r.status) === 'leave').length;
    const total = records.length;
    const attended = present + late;
    return { present, absent, late, leave, total, attended, pct: total ? clampPct((attended / total) * 100) : 0 };
  }, [records]);

  const weeklyTrend = useMemo(() => {
    const weeks = [0, 0, 0, 0, 0];
    const counts = [0, 0, 0, 0, 0];
    records.forEach(r => {
      const d = parseRecordDate(r.date);
      if (!d) return;
      const w = Math.min(4, Math.floor((d.getDate() - 1) / 7));
      counts[w]++;
      if (['present', 'late'].includes(normalizeStatus(r.status))) weeks[w]++;
    });
    return weeks.map((attended, i) => ({
      label: `Wk ${i + 1}`,
      marked: counts[i],
      attended,
      pct: counts[i] ? clampPct((attended / counts[i]) * 100) : 0,
    }));
  }, [records]);

  const calendarDays = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const firstDate = new Date(year, month - 1, 1);
    const daysInMonth = new Date(year, month, 0).getDate();
    const byDate = new Map();
    records.forEach(r => {
      const d = parseRecordDate(r.date);
      if (d) byDate.set(localDateKey(d), r);
    });
    const blanks = Array.from({ length: firstDate.getDay() }).map((_, i) => ({ key: `blank-${i}`, blank: true }));
    const days = Array.from({ length: daysInMonth }).map((_, i) => {
      const day = i + 1;
      const date = new Date(year, month - 1, day);
      const key = localDateKey(date);
      return { day, key, weekday: date.toLocaleDateString(undefined, { weekday: 'short' }), isToday: key === localDateKey(new Date()), record: byDate.get(key) };
    });
    return [...blanks, ...days];
  }, [records, selectedMonth]);

  const recentRecords = useMemo(() =>
    [...records].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8),
    [records]
  );

  /* ── stat cards ─────────────────────────────────────────────────────── */
  const statCards = [
    { label: 'Present', value: stats.present, ...STATUS.present },
    { label: 'Absent', value: stats.absent, ...STATUS.absent },
    { label: 'Late', value: stats.late, ...STATUS.late },
    { label: 'On Leave', value: stats.leave, ...STATUS.leave },
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '60vh', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', border: '4px solid #e2e8f0', borderTopColor: '#3b82f6', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", color: '#0f172a', background: '#fff', minHeight: '100%' }}>

      {/* ── top bar ────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 28 }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#3b82f6', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 999, padding: '4px 12px', marginBottom: 10 }}>
            <CalendarCheck2 size={12} />
            {monthLabel(selectedMonth)}
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 900, lineHeight: 1.2, margin: 0 }}>Attendance</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b', fontWeight: 500 }}>Track your monthly presence and class records</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => setSelectedMonth(v => shiftMonth(v, -1))}
            style={navBtnStyle}
            aria-label="Previous month"
          >
            <ChevronLeft size={16} />
          </button>
          <input
            type="month"
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value || monthKey())}
            style={monthInputStyle}
          />
          <button
            onClick={() => setSelectedMonth(v => shiftMonth(v, 1))}
            style={navBtnStyle}
            aria-label="Next month"
          >
            <ChevronRight size={16} />
          </button>
          <button
            onClick={() => setSelectedMonth(monthKey())}
            style={{ ...navBtnStyle, padding: '0 16px', fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase' }}
          >
            Today
          </button>
        </div>
      </div>

      {/* ── summary ring + stat cards ─────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 14, marginBottom: 28 }}>
        {/* Attendance rate card */}
        <div style={{ ...card, gridColumn: 'span 1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '24px 16px' }}>
          <div style={{ position: 'relative', width: 80, height: 80 }}>
            <svg width={80} height={80} viewBox="0 0 80 80" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx={40} cy={40} r={32} fill="none" stroke="#f1f5f9" strokeWidth={8} />
              <circle
                cx={40} cy={40} r={32} fill="none"
                stroke={stats.pct >= 75 ? '#3b82f6' : stats.pct >= 50 ? '#f59e0b' : '#ef4444'}
                strokeWidth={8}
                strokeDasharray={`${(stats.pct / 100) * 201} 201`}
                strokeLinecap="round"
              />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <p style={{ fontSize: 16, fontWeight: 900, margin: 0, lineHeight: 1 }}>{stats.pct}%</p>
            </div>
          </div>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>Attendance</p>
          <p style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, margin: 0 }}>{stats.attended}/{stats.total} days</p>
        </div>

        {statCards.map(s => (
          <div key={s.label} style={{ ...card, display: 'flex', flexDirection: 'column', gap: 10, padding: '20px 18px', borderTop: `3px solid ${s.color}` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{s.label}</p>
              <div style={{ width: 30, height: 30, borderRadius: 10, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <s.Icon size={15} color={s.color} />
              </div>
            </div>
            <p style={{ margin: 0, fontSize: 28, fontWeight: 900, color: s.color }}>{s.value}</p>
            <p style={{ margin: 0, fontSize: 11, color: '#cbd5e1', fontWeight: 600 }}>days this month</p>
          </div>
        ))}
      </div>

      {/* ── weekly trend + recent records row ────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 300px', gap: 20, alignItems: 'start', marginBottom: 20 }}>

        {/* weekly trend — vertical bar chart */}
        <div style={card}>
          <div style={cardHeader}>
            <div>
              <h2 style={cardTitle}>Weekly Trend</h2>
              <p style={cardSub}>Attendance rate per week of the month</p>
            </div>
            <TrendingUp size={18} color="#3b82f6" />
          </div>

          {/* bar chart area */}
          <div style={{ marginTop: 20, display: 'flex', alignItems: 'flex-end', gap: 10 }}>
            {weeklyTrend.map((w) => {
              const TRACK = 80; /* max bar height in px */
              const barColor = w.pct >= 75 ? '#3b82f6' : w.marked ? '#ef4444' : '#e2e8f0';
              const barH = w.marked ? Math.max(6, Math.round((w.pct / 100) * TRACK)) : 6;
              return (
                <div key={w.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  {/* pct label */}
                  <span style={{ fontSize: 11, fontWeight: 900, color: w.marked ? '#0f172a' : '#e2e8f0', minHeight: 16, lineHeight: '16px' }}>
                    {w.marked ? `${w.pct}%` : ''}
                  </span>
                  {/* track + bar */}
                  <div style={{ width: '100%', height: TRACK, background: '#f8fafc', borderRadius: 8, border: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', overflow: 'hidden' }}>
                    <div style={{ width: '100%', height: barH, background: barColor, transition: 'height 0.5s cubic-bezier(.4,0,.2,1)', borderRadius: '8px 8px 0 0' }} />
                  </div>
                  {/* week label */}
                  <span style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 4 }}>{w.label}</span>
                  <span style={{ fontSize: 10, color: '#cbd5e1', fontWeight: 600 }}>{w.attended}/{w.marked}d</span>
                </div>
              );
            })}
          </div>

          {/* legend */}
          <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid #f1f5f9', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {[{ color: '#3b82f6', label: '≥75% good' }, { color: '#ef4444', label: '<75% low' }, { color: '#e2e8f0', label: 'No classes' }].map(l => (
              <span key={l.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#64748b', fontWeight: 600 }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: l.color, display: 'inline-block' }} />
                {l.label}
              </span>
            ))}
          </div>
        </div>

        {/* ── right: recent records timeline ─────────────────────────────── */}
        <div style={card}>
          <div style={cardHeader}>
            <div>
              <h2 style={cardTitle}>Recent Records</h2>
              <p style={cardSub}>Latest marked entries</p>
            </div>
            <CalendarDays size={18} color="#64748b" />
          </div>

          <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 0 }}>
            {recentRecords.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <CalendarDays size={32} color="#e2e8f0" style={{ margin: '0 auto 12px' }} />
                <p style={{ fontSize: 13, fontWeight: 800, color: '#94a3b8', margin: 0 }}>No records yet</p>
                <p style={{ fontSize: 12, color: '#cbd5e1', fontWeight: 500, margin: '4px 0 0' }}>Marked days will appear here</p>
              </div>
            ) : recentRecords.map((item, i) => {
              const meta = getMeta(item.status);
              const Icon = meta?.Icon;
              const isLast = i === recentRecords.length - 1;
              return (
                <div key={item.id || `${item.date}-${item.status}`} style={{ display: 'flex', gap: 12, paddingBottom: isLast ? 0 : 16, position: 'relative' }}>
                  {!isLast && <div style={{ position: 'absolute', left: 19, top: 38, bottom: 0, width: 2, background: '#f1f5f9', borderRadius: 99 }} />}
                  <div style={{
                    width: 38, height: 38, borderRadius: 12, flexShrink: 0,
                    background: meta ? meta.bg : '#f8fafc',
                    border: `1.5px solid ${meta ? meta.border : '#e2e8f0'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1,
                  }}>
                    {Icon ? <Icon size={16} color={meta.color} /> : <CalendarDays size={16} color="#cbd5e1" />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6 }}>
                      <div>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: '#0f172a' }}>
                          {new Date(item.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                        <p style={{ margin: '2px 0 0', fontSize: 11, color: '#94a3b8', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 140 }}>
                          {item.remarks || item.subjectName || 'Class day'}
                        </p>
                      </div>
                      {meta && (
                        <span style={{ flexShrink: 0, fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em', color: meta.color, background: meta.bg, border: `1px solid ${meta.border}`, borderRadius: 99, padding: '3px 8px' }}>
                          {meta.label}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── full-width calendar ──────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* monthly calendar */}
        <div style={card}>
          <div style={{ ...cardHeader, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h2 style={cardTitle}>Monthly Calendar</h2>
              <p style={cardSub}>Each day coloured by attendance status</p>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {Object.entries(STATUS).map(([key, s]) => (
                <span key={key} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: s.color, background: s.bg, border: `1px solid ${s.border}`, borderRadius: 99, padding: '3px 10px' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.color, display: 'inline-block' }} />
                  {s.label}
                </span>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 18 }}>
            {/* weekday headers */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, marginBottom: 6 }}>
              {WEEKDAYS.map(d => (
                <div key={d} style={{ textAlign: 'center', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#cbd5e1', padding: '4px 0' }}>{d}</div>
              ))}
            </div>
            {/* day cells */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4 }}>
              {calendarDays.map(day => {
                if (day.blank) return <div key={day.key} />;
                const meta = getMeta(day.record?.status);
                const isMarked = !!meta;
                const Icon = meta?.Icon;
                return (
                  <div
                    key={day.key}
                    style={{
                      borderRadius: 12,
                      border: day.isToday ? '2px solid #3b82f6' : `1px solid ${isMarked ? meta.border : '#f1f5f9'}`,
                      background: isMarked ? meta.bg : '#fff',
                      padding: '8px 6px',
                      minHeight: 64,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 4,
                      transition: 'transform 0.15s',
                      cursor: 'default',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.06)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
                  >
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 900, color: day.isToday ? '#3b82f6' : '#0f172a' }}>{day.day}</p>
                    {Icon
                      ? <Icon size={14} color={meta.color} />
                      : <span style={{ width: 14, height: 14 }} />
                    }
                    <p style={{ margin: 0, fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: isMarked ? meta.color : '#e2e8f0' }}>
                      {isMarked ? meta.label : '·'}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── shared style tokens ──────────────────────────────────────────────── */
const card = {
  background: '#fff',
  border: '1px solid #e2e8f0',
  borderRadius: 20,
  padding: '22px 22px',
  boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
};
const cardHeader = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 12,
};
const cardTitle = {
  margin: 0,
  fontSize: 15,
  fontWeight: 900,
  color: '#0f172a',
};
const cardSub = {
  margin: '3px 0 0',
  fontSize: 12,
  color: '#94a3b8',
  fontWeight: 500,
};
const navBtnStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: 38,
  minWidth: 38,
  borderRadius: 12,
  border: '1px solid #e2e8f0',
  background: '#fff',
  color: '#475569',
  cursor: 'pointer',
  fontFamily: 'inherit',
  fontSize: 12,
  transition: 'background 0.15s',
};
const monthInputStyle = {
  height: 38,
  borderRadius: 12,
  border: '1px solid #e2e8f0',
  background: '#fff',
  padding: '0 14px',
  fontSize: 13,
  fontWeight: 700,
  color: '#0f172a',
  outline: 'none',
  fontFamily: 'inherit',
};
