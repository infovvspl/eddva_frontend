/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ClipboardList,
  Trophy,
  BarChart3,
  Plus,
  Target,
  Award,
  TrendingUp,
  Edit,
  Trash2,
} from "lucide-react";
import GlassCard from "@/components/school/GlassCard";
import StatCard from "@/components/school/StatCard";
import Button from "@/components/school/Button";
import Badge from "@/components/school/Badge";
import Tabs from "@/components/school/Tabs";
import DataTable from "@/components/school/DataTable";
import Modal from "@/components/school/Modal";
import InputField from "@/components/school/InputField";
import SelectField from "@/components/school/SelectField";
import api from "@/lib/api/school-client";
import "./AssessmentSystem.css";

const AssessmentSystem: React.FC = () => {
  const navigate = useNavigate();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [testsList, setTestsList] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    type: "topic",
    class_id: "",
    total_marks: 100,
    duration_minutes: 120,
    scheduled_date: "",
  });

  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [editingTest, setEditingTest] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchTests = async () => {
    try {
      const res = await api.get("/assessments");

      const formatted = res.data.data.map((item: any) => ({
        id: item.id,
        title: item.title,
        type: item.type,

        totalMarks: item.total_marks,

        duration: item.duration_minutes || "-",

        date: item.scheduled_date
          ? new Date(item.scheduled_date).toLocaleDateString()
          : "-",

        class: item.class_name || "-",

        status:
          new Date(item.scheduled_date) > new Date() ? "upcoming" : "completed",

        submissions: 0,
      }));

      setTestsList(formatted);
    } catch (err) {
      console.error("Fetch assessments error:", err);
    }
  };

  const fetchLeaderboard = async (assessmentId: number) => {
    try {
      const res = await api.get(`/assessments/${assessmentId}/leaderboard`);

      const formatted = res.data.data.map((item: any, index: number) => ({
        rank: index + 1,
        name: item.student_name,
        class: item.class_name || "12-A",
        marks: item.marks_obtained,
        percentage:
          item.percentage || Math.round((item.marks_obtained / 100) * 100),
      }));

      setLeaderboardData(formatted);
    } catch (err) {
      console.error("Leaderboard fetch error:", err);
    }
  };

  const fetchAnalytics = async (assessmentId: number) => {
    try {
      const res = await api.get(`/assessments/${assessmentId}/analytics`);

      setAnalytics(res.data.data);
    } catch (err) {
      console.error("Analytics fetch error:", err);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await fetchTests();
    };

    loadData();
  }, []);

  useEffect(() => {
    if (testsList.length > 0) {
      fetchLeaderboard(testsList[0].id);
      fetchAnalytics(testsList[0].id);
    }
  }, [testsList]);

  const handleCreateTest = async () => {
    if (!formData.title.trim()) {
      alert("Please enter test title");
      return;
    }

    if (!formData.scheduled_date) {
      alert("Please select test date");
      return;
    }

    if (!formData.type) {
      alert("Please select test type");
      return;
    }

    if (!formData.class_id) {
      alert("Please select class");
      return;
    }

    if (formData.total_marks <= 0) {
      alert("Total marks must be greater than 0");
      return;
    }

    if (formData.duration_minutes <= 0) {
      alert("Duration must be greater than 0");
      return;
    }

    if (!formData.scheduled_date) {
      alert("Please select test date");
      return;
    }

    const selectedDate = new Date(formData.scheduled_date);
    const today = new Date();

    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      alert("Test date cannot be in the past");
      return;
    }

    try {
      const payload = {
        title: formData.title,
        type: formData.type,
        subject_id: 1,
        class_id: Number(formData.class_id),
        total_marks: formData.total_marks,
        duration_minutes: formData.duration_minutes,
        scheduled_date: formData.scheduled_date,
      };

      if (editingTest) {
        await api.patch(`/assessments/${editingTest.id}`, payload);
      } else {
        await api.post("/assessments", payload);
      }
      await fetchTests();

      setEditingTest(null);

      alert(
        editingTest
          ? "Test updated successfully!"
          : "Test created successfully!",
      );

      setShowCreateModal(false);

      setFormData({
        title: "",
        type: "topic",
        class_id: "",
        total_marks: 100,
        duration_minutes: 120,
        scheduled_date: "",
      });
    } catch (err) {
      console.error("Create assessment error:", err);
    }
  };

  const testColumns = [
    {
      key: "title",
      title: "Test Name",
      render: (v: string, row: any) => (
        <span
          className="assessment__title-link"
          onClick={() => {
            navigate(`/teacher/assessments/${row.id}`);
          }}
        >
          {v}
        </span>
      ),
    },
    {
      key: "type",
      title: "Type",
      render: (v: string) => (
        <Badge
          variant={
            v === "final"
              ? "error"
              : v === "mock"
                ? "warning"
                : v === "unit"
                  ? "info"
                  : "purple"
          }
        >
          {v}
        </Badge>
      ),
    },
    { key: "totalMarks", title: "Total Marks" },
    { key: "duration", title: "Duration" },
    { key: "date", title: "Date" },
    {
      key: "class",
      title: "Class",
      render: (v: string) => <Badge variant="default">{v}</Badge>,
    },
    {
      key: "status",
      title: "Status",
      render: (v: string) => (
        <Badge
          variant={
            v === "completed"
              ? "success"
              : v === "scheduled"
                ? "info"
                : "warning"
          }
        >
          {v}
        </Badge>
      ),
    },
    {
      key: "submissions",
      title: "Actions",
      render: (_: any, row: any) => (
        <Button
          size="sm"
          variant="outline"
          icon={<Trash2 size={14} />}
          onClick={async () => {
            const confirmed = window.confirm("Delete this assessment?");

            if (!confirmed) return;

            try {
              await api.delete(`/assessments/${row.id}`);

              alert("Assessment deleted successfully!");

              fetchTests();
            } catch (err) {
              console.error(err);
            }
          }}
        >
          Delete
        </Button>
      ),
    },
  ];

  const topicTestsContent = (
    <div className="assessment__section">
      <DataTable
        columns={testColumns}
        data={testsList.filter(
          (t) =>
            t.type === "topic" &&
            t.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
            (statusFilter === "all" || t.status === statusFilter),
        )}
      />
    </div>
  );

  const unitTestsContent = (
    <div className="assessment__section">
      <DataTable
        columns={testColumns}
        data={testsList.filter(
          (t) =>
            t.type === "unit" &&
            t.title.toLowerCase().includes(searchTerm.toLowerCase()),
        )}
      />
    </div>
  );

  const mockTestsContent = (
    <div className="assessment__section">
      <DataTable
        columns={testColumns}
        data={testsList.filter(
          (t) =>
            (t.type === "mock" || t.type === "subject" || t.type === "final") &&
            t.title.toLowerCase().includes(searchTerm.toLowerCase()),
        )}
      />
    </div>
  );

  const resultsContent = (
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
        <div className="assessment__grade-chart">
          {analytics?.gradeDistribution?.map((g: any) => (
            <div key={g.grade} className="assessment__grade-bar-wrapper">
              <div
                className="assessment__grade-bar"
                style={{
                  height: `${g.count * 20}px`,
                  background: g.color,
                }}
              />

              <span className="assessment__grade-label">{g.grade}</span>

              <small className="assessment__grade-count">{g.count}</small>
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard>
        <div className="assessment__leaderboard-header">
          <h3>
            <Trophy size={20} className="assessment__trophy-icon" /> Leaderboard
          </h3>
          <Badge variant="purple">Unit Test 3</Badge>
        </div>
        <div className="assessment__leaderboard">
          {leaderboardData.length > 0 ? (
            leaderboardData.map((entry) => (
              <div
                key={entry.rank}
                className={`assessment__leaderboard-item ${
                  entry.rank <= 3 ? "assessment__leaderboard-item--top" : ""
                }`}
              >
                <div
                  className={`assessment__rank assessment__rank--${entry.rank}`}
                >
                  {entry.rank <= 3 ? <Trophy size={14} /> : entry.rank}
                </div>

                <div className="assessment__leader-info">
                  <span className="assessment__leader-name">{entry.name}</span>

                  <span className="assessment__leader-class">
                    Class {entry.class}
                  </span>
                </div>

                <div className="assessment__leader-score">
                  <span className="assessment__leader-marks">
                    {entry.marks}/100
                  </span>

                  <span className="assessment__leader-pct">
                    {entry.percentage}%
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="assessment__empty">
              No leaderboard data available yet.
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );

  return (
    <div className="assessment">
      <div className="assessment__header">
        <input
          type="text"
          placeholder="Search assessments..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="assessment__search"
        />

        <select
          value={statusFilter}
          defaultValue="all"
          onChange={(e) => setStatusFilter(e.target.value)}
          className="assessment__search assessment__filter"
        >
          <option value="all" disabled hidden>
            Filter Status
          </option>

          <option value="upcoming">Upcoming</option>

          <option value="completed">Completed</option>
        </select>

        <Button
          icon={<Plus size={16} />}
          onClick={() => setShowCreateModal(true)}
        >
          Create Test
        </Button>
      </div>

      <Tabs
        tabs={[
          {
            id: "topic",
            label: "Topic Tests",
            icon: <ClipboardList size={16} />,
            content: topicTestsContent,
          },
          {
            id: "unit",
            label: "Unit Tests",
            icon: <BarChart3 size={16} />,
            content: unitTestsContent,
          },
          {
            id: "mock",
            label: "Mock & Final",
            icon: <Target size={16} />,
            content: mockTestsContent,
          },
          {
            id: "results",
            label: "Results & Leaderboard",
            icon: <Trophy size={16} />,
            content: resultsContent,
          },
        ]}
      />

      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title={editingTest ? "Update Test" : "Create New Test"}
      >
        <div className="assessment__modal-form">
          <InputField
            label="Test Title"
            placeholder="Enter test title"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
          />
          <SelectField
            label="Test Type"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            options={[
              { value: "topic", label: "Topic Test" },
              { value: "unit", label: "Unit Test" },
              { value: "mock", label: "Mock Test" },
              { value: "subject", label: "Subject Test" },
              { value: "final", label: "Final Exam" },
            ]}
          />
          <SelectField
            label="Class"
            value={formData.class_id}
            onChange={(e) =>
              setFormData({ ...formData, class_id: e.target.value })
            }
            options={[
              { value: "1", label: "Class 12-A" },
              { value: "2", label: "Class 11-B" },
            ]}
          />
          <div className="assessment__modal-row">
            <InputField
              label="Total Marks"
              type="number"
              placeholder="100"
              value={formData.total_marks}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  total_marks: Number(e.target.value),
                })
              }
            />
            <InputField
              label="Duration (mins)"
              type="number"
              placeholder="120"
              value={formData.duration_minutes}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  duration_minutes: Number(e.target.value),
                })
              }
            />
          </div>
          <InputField
            label="Date"
            type="date"
            value={formData.scheduled_date}
            onChange={(e) =>
              setFormData({ ...formData, scheduled_date: e.target.value })
            }
          />
          <div className="assessment__modal-actions">
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTest}>
              {editingTest ? "Update Test" : "Create Test"}
            </Button>{" "}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AssessmentSystem;
