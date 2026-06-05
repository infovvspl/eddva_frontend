import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, Plus, Target, Trophy, TrendingUp, Award, BarChart3, Users, Settings } from "lucide-react";
import GlassCard from "@/components/school/GlassCard";
import Button from "@/components/school/Button";
import Badge from "@/components/school/Badge";
import Tabs from "@/components/school/Tabs";
import StatCard from "@/components/school/StatCard";
import api from "@/lib/api/school-client";
import "./AssessmentSystem.css"; // Reuse assessment CSS for leaderboard

const AssessmentDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [assessment, setAssessment] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  
  // Dummy questions for Overview
  const [questions, setQuestions] = useState<any[]>([
    { id: 1, text: "Sample Question 1", type: "mcq", marks: 2 },
    { id: 2, text: "Sample Question 2", type: "short", marks: 5 }
  ]);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        // Load main assessment info
        const res = await api.get(`/assessments/${id}`);
        setAssessment(res.data.data || res.data);

        // Load leaderboard
        try {
          const lRes = await api.get(`/assessments/${id}/leaderboard`);
          if (lRes.data.data) {
            setLeaderboardData(lRes.data.data.map((item: any, index: number) => ({
              rank: index + 1,
              name: item.student_name,
              class: item.class_name || "N/A",
              marks: item.marks_obtained,
              percentage: item.percentage || Math.round((item.marks_obtained / 100) * 100),
            })));
          }
        } catch (e) {
          console.warn("No leaderboard data", e);
        }

        // Load analytics
        try {
          const aRes = await api.get(`/assessments/${id}/analytics`);
          if (aRes.data.data) {
            setAnalytics(aRes.data.data);
          }
        } catch (e) {
          console.warn("No analytics data", e);
        }

      } catch (err) {
        console.error("Failed to fetch assessment details", err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchDetails();
  }, [id]);

  if (loading) {
    return <div className="p-12 text-center text-gray-500">Loading Assessment...</div>;
  }

  if (!assessment) {
    return <div className="p-12 text-center text-red-500">Assessment not found</div>;
  }

  const overviewContent = (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-gray-900">Questions</h3>
        <Button size="sm" icon={<Plus size={16} />}>Add Question</Button>
      </div>
      
      {questions.length > 0 ? (
        <div className="space-y-4">
          {questions.map((q, idx) => (
            <div key={q.id} className="p-4 bg-white border border-gray-100 shadow-sm rounded-xl">
              <div className="flex justify-between">
                <span className="font-semibold text-gray-900">Question {idx + 1}</span>
                <span className="text-sm font-medium text-brand-600">{q.marks} marks</span>
              </div>
              <p className="mt-2 text-gray-700">{q.text}</p>
              <div className="mt-4 flex gap-2">
                <Badge variant="purple">{String(q.type).toUpperCase()}</Badge>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 text-center bg-gray-50 border border-dashed border-gray-200 rounded-xl text-gray-500">
          No questions added yet.
        </div>
      )}
    </div>
  );

  const analyticsContent = (
    <div className="assessment__results">
      <div className="assessment__result-stats">
        <StatCard
          title="Average Score"
          value={`${analytics?.averageScore || 0}%`}
          icon={<Target size={24} />}
          gradient="var(--gradient-primary)"
        />
        <StatCard
          title="Highest Score"
          value={`${analytics?.highestScore || 0}%`}
          icon={<Award size={24} />}
          gradient="var(--gradient-cool)"
        />
        <StatCard
          title="Pass Rate"
          value={`${analytics?.passRate || 0}%`}
          icon={<TrendingUp size={24} />}
          gradient="var(--gradient-accent)"
        />
        <StatCard
          title="Distinction Rate"
          value={`${analytics?.distinctionRate || 0}%`}
          icon={<Trophy size={24} />}
          gradient="var(--gradient-secondary)"
        />
      </div>

      <GlassCard>
        <h3 className="assessment__grade-title">Grade Distribution</h3>
        <div className="assessment__grade-chart mt-6">
          {analytics?.gradeDistribution ? analytics.gradeDistribution.map((g: any) => (
            <div key={g.grade} className="assessment__grade-bar-wrapper">
              <div
                className="assessment__grade-bar"
                style={{
                  height: `${(g.count || 1) * 20}px`,
                  background: g.color || '#2563eb',
                }}
              />
              <span className="assessment__grade-label">{g.grade}</span>
              <small className="assessment__grade-count">{g.count}</small>
            </div>
          )) : (
            <div className="text-center w-full text-gray-400 py-6">No distribution data</div>
          )}
        </div>
      </GlassCard>
    </div>
  );

  const leaderboardContent = (
    <GlassCard>
      <div className="assessment__leaderboard-header mb-6">
        <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900">
          <Trophy size={20} className="text-yellow-500" /> Leaderboard
        </h3>
      </div>
      <div className="assessment__leaderboard space-y-3">
        {leaderboardData.length > 0 ? (
          leaderboardData.map((entry) => (
            <div
              key={entry.rank}
              className={`assessment__leaderboard-item ${
                entry.rank <= 3 ? "assessment__leaderboard-item--top" : ""
              }`}
            >
              <div className={`assessment__rank assessment__rank--${entry.rank}`}>
                {entry.rank <= 3 ? <Trophy size={14} /> : entry.rank}
              </div>
              <div className="assessment__leader-info">
                <span className="assessment__leader-name">{entry.name}</span>
                <span className="assessment__leader-class">Class {entry.class}</span>
              </div>
              <div className="assessment__leader-score">
                <span className="assessment__leader-marks">{entry.marks}/{assessment.total_marks || 100}</span>
                <span className="assessment__leader-pct">{entry.percentage}%</span>
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 text-center bg-gray-50 border border-dashed border-gray-200 rounded-xl text-gray-500">
            No leaderboard data available yet.
          </div>
        )}
      </div>
    </GlassCard>
  );

  const attemptsContent = (
    <div className="p-12 text-center bg-gray-50 border border-dashed border-gray-200 rounded-xl text-gray-500">
      <Users size={48} className="mx-auto text-gray-300 mb-4" />
      <h3 className="text-lg font-medium text-gray-700">Student Attempts</h3>
      <p className="mt-1 text-sm">View individual student submissions here.</p>
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Badge variant="purple">{String(assessment.assessment_type || assessment.type || 'Test').toUpperCase()}</Badge>
            <Badge variant={assessment.status === 'completed' ? 'success' : 'warning'}>{assessment.status || 'Draft'}</Badge>
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            {assessment.title}
          </h1>
          <p className="mt-1 text-sm font-medium text-gray-500 flex items-center gap-3">
            <span>Total Marks: {assessment.total_marks || 100}</span>
            <span>•</span>
            <span>Duration: {assessment.duration_minutes || 60} mins</span>
          </p>
        </div>
        <Button variant="outline" size="sm" icon={<ChevronLeft size={16} />} onClick={() => navigate('/school/teacher/assessments')}>
          Back to Assessments
        </Button>
      </div>

      <Tabs
        tabs={[
          {
            id: "overview",
            label: "Overview & Questions",
            icon: <Settings size={16} />,
            content: overviewContent,
          },
          {
            id: "attempts",
            label: "Attempts",
            icon: <Users size={16} />,
            content: attemptsContent,
          },
          {
            id: "leaderboard",
            label: "Leaderboard",
            icon: <Trophy size={16} />,
            content: leaderboardContent,
          },
          {
            id: "analytics",
            label: "Analytics",
            icon: <BarChart3 size={16} />,
            content: analyticsContent,
          },
        ]}
      />
    </div>
  );
};

export default AssessmentDetails;
