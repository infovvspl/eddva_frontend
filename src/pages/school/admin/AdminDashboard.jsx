import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ArrowUpRight, Building2, CheckCircle2, Clock3, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '@/lib/api/school-client';
import { getResponseData } from '@/lib/school/apiData';
import { Skeleton } from '@/components/school/admin/Skeleton';
import { InstituteLogo, StatusBadge } from '@/components/school/admin/Brand';
import { useAuth } from '@/context/SchoolAuthContext';
import InstituteDashboardWorkspace from './InstituteDashboardWorkspace';
import SuperAdminDashboardWorkspace from './SuperAdminDashboardWorkspace';

function formatNumber(value) {
  return Number(value || 0).toLocaleString();
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-surface-200 bg-white p-3 shadow-soft">
      <p className="mb-1 text-xs font-bold uppercase text-surface-500">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="flex items-center gap-2 text-sm font-bold" style={{ color: entry.color }}>
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  );
}

function StatCard({ title, value, icon: Icon, tone, delay, onClick }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 14 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.35, delay }} 
      onClick={onClick}
      className="glass-panel-hover cursor-pointer rounded-lg p-5 shadow-soft transition-transform hover:-translate-y-1"
    >
      <div className="mb-5 flex items-start justify-between">
        <div className={`grid h-12 w-12 place-items-center rounded-lg ${tone}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-1 text-xs font-bold text-brand-700">
          <ArrowUpRight className="h-3.5 w-3.5" />
          Live
        </div>
      </div>
      <p className="text-sm font-bold text-surface-500">{title}</p>
      <p className="mt-1 font-display text-3xl font-extrabold text-surface-950">{formatNumber(value)}</p>
    </motion.div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, institute: storedInstitute } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadStats() {
    try {
      const res = await api.get('/dashboard/stats');
      const statsData = getResponseData(res);
      setStats(statsData);
      if (statsData?.currentInstitute) {
        localStorage.setItem('institute', JSON.stringify(statsData.currentInstitute));
      }
    } catch (err) {
      console.error(err);
      setStats(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStats();
    window.addEventListener('eddva:data-changed', loadStats);
    const interval = setInterval(loadStats, 30000);
    return () => {
      clearInterval(interval);
      window.removeEventListener('eddva:data-changed', loadStats);
    };
  }, []);

  const institute = stats?.currentInstitute || storedInstitute;
  const isInstituteAdmin = user?.role === 'INSTITUTE_ADMIN';

  const handleCardClick = (cardTitle) => {
    if (isInstituteAdmin) {
      if (cardTitle === 'Total Teachers') {
        navigate('/school/admin/teachers');
      } else if (cardTitle === 'Total Students') {
        navigate('/school/admin/students');
      } else if (cardTitle === 'Student Attendance %') {
        navigate('/school/admin/reports');
        localStorage.setItem('selectedReport', 'Student Attendance');
      } else if (cardTitle === 'Teacher Attendance %') {
        navigate('/school/admin/reports');
        localStorage.setItem('selectedReport', 'Teacher Attendance');
      }
    }
  };

  const cards = useMemo(() => {
    if (isInstituteAdmin) {
      return [
        { 
          title: 'Total Teachers', 
          value: stats?.totalTeachers || 0, 
          icon: Users, 
          tone: 'bg-brand-50 text-brand-700',
          onClick: () => handleCardClick('Total Teachers')
        },
        { 
          title: 'Total Students', 
          value: stats?.totalStudents || 0, 
          icon: Users, 
          tone: 'bg-sky-50 text-sky-700',
          onClick: () => handleCardClick('Total Students')
        },
        { 
          title: 'Student Attendance %', 
          value: `${Math.round(stats?.studentAttendancePercentage || 0)}%`, 
          icon: CheckCircle2, 
          tone: 'bg-emerald-50 text-emerald-600',
          onClick: () => handleCardClick('Student Attendance %')
        },
        { 
          title: 'Teacher Attendance %', 
          value: `${Math.round(stats?.teacherAttendancePercentage || 0)}%`, 
          icon: CheckCircle2, 
          tone: 'bg-amber-50 text-amber-600',
          onClick: () => handleCardClick('Teacher Attendance %')
        },
      ];
    }

    return [
      { title: 'Total Institutes', value: stats?.totalInstitutes, icon: Building2, tone: 'bg-brand-50 text-brand-700' },
      { title: 'Approved Institutes', value: stats?.approvedInstitutes, icon: CheckCircle2, tone: 'bg-emerald-50 text-emerald-600' },
      { title: 'Pending Approvals', value: stats?.pendingApprovals, icon: Clock3, tone: 'bg-sky-50 text-sky-700' },
      { title: 'Active Users', value: stats?.activeUsers, icon: Users, tone: 'bg-primary/10 text-primary' },
    ];
  }, [isInstituteAdmin, stats]);

  const onlineStatus = stats?.onlineStatus || [];
  const liveClasses = stats?.liveClasses || [];

  if (loading && isInstituteAdmin) {
    return <InstituteDashboardWorkspace stats={null} institute={storedInstitute} loading />;
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-44 w-full rounded-lg" />
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <Skeleton key={item} className="h-36 rounded-lg" />
          ))}
        </div>
        <div className="grid gap-5 xl:grid-cols-2">
          <Skeleton className="h-80 rounded-lg" />
          <Skeleton className="h-80 rounded-lg" />
        </div>
      </div>
    );
  }

  if (isInstituteAdmin) {
    return <InstituteDashboardWorkspace stats={stats} institute={institute} loading={false} />;
  }

  return <SuperAdminDashboardWorkspace stats={stats} />;
}
