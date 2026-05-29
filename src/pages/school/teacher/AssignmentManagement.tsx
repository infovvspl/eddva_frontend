import React, { useState, useEffect } from "react";
import {
  FileText,
  Upload,
  BookOpen,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import GlassCard from "@/components/school/GlassCard";
import Button from "@/components/school/Button";
import Badge from "@/components/school/Badge";
import ProgressBar from "@/components/school/ProgressBar";
import Tabs from "@/components/school/Tabs";
import Modal from "@/components/school/Modal";
import InputField from "@/components/school/InputField";
import SelectField from "@/components/school/SelectField";
import FileUpload from "@/components/school/FileUpload";
import DataTable from "@/components/school/DataTable";
import api from "@/lib/api/school-client";
import "./AssignmentManagement.css";

const AssignmentManagement: React.FC = () => {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadType, setUploadType] = useState("homework");
  const [assignmentsList, setAssignmentsList] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  // Form states
  const [formData, setFormData] = useState({
    title: "",
    class_id: "",
    subject_id: "",
    due_date: "",
    instructions: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fetchAssignments = async () => {
    try {
      const res = await api.get("/assignments");
      setAssignmentsList(res.data?.data || res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const res = await api.get("/academic/classes");

      setClasses(res.data.data);
      if (res.data.data.length > 0) {
        setFormData((prev) => ({
          ...prev,
          class_id: String(res.data.data[0].id),
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSubjects = async () => {
    try {
      const res = await api.get("/academic/subjects");

      setSubjects(res.data.data);

      if (res.data.data.length > 0) {
        setFormData((prev) => ({
          ...prev,
          subject_id: String(res.data.data[0].id),
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };
  useEffect(() => {
    fetchAssignments();
    fetchClasses();
    fetchSubjects();
  }, []);

  const handleUpload = async () => {
    try {
      const data = new FormData();
      data.append("title", formData.title);
      data.append("type", uploadType);
      data.append("class_id", formData.class_id);
      data.append("subject_id", formData.subject_id);
      data.append("due_date", formData.due_date);
      data.append("instructions", formData.instructions);
      if (selectedFile) data.append("file", selectedFile);

      const response = await api.post("/assignments", data);

      alert("Assignment uploaded successfully");
      await fetchAssignments();
      setFormData({
        title: "",
        class_id: "",
        subject_id: "",
        due_date: "",
        instructions: "",
      });

      setSelectedFile(null);
      setShowUploadModal(false);

      setFormData({
        title: "",
        class_id: "1",
        subject_id: "1",
        due_date: "",
        instructions: "",
      });

      setSelectedFile(null);
    } catch (err: any) {
      console.error(err);

      alert(
        err?.response?.data?.message ||
          err?.response?.data?.errors?.[0]?.msg ||
          "Upload failed",
      );
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const confirmDelete = window.confirm("Delete this assignment?");

      if (!confirmDelete) return;

      await api.delete(`/assignments/${id}`);

      alert("Assignment deleted successfully");

      await fetchAssignments();
    } catch (err) {
      console.error(err);

      alert("Failed to delete assignment");
    }
  };

  const columns = [
    { key: "title", title: "Assignment" },
    {
      key: "type",
      title: "Type",
      render: (v: string) => (
        <Badge
          variant={
            v === "homework" ? "purple" : v === "dpp" ? "info" : "success"
          }
        >
          {v.toUpperCase()}
        </Badge>
      ),
    },
    {
      key: "class_name",
      title: "Class",
      render: (v: string) => <Badge variant="default">{v}</Badge>,
    },
    {
      key: "subject_name",
      title: "Subject",
      render: (v: string) => (
        <Badge variant="secondary">{v || "No Subject"}</Badge>
      ),
    },
    {
      key: "due_date",
      title: "Due Date",
      render: (v: string) =>
        v ? new Date(v).toLocaleDateString() : "No Due Date",
    },
    {
      key: "status",
      title: "Status",
      render: (v: string) => (
        <Badge
          variant={
            v === "completed" ? "success" : v === "active" ? "info" : "warning"
          }
        >
          {v || "active"}
        </Badge>
      ),
    },
    {
      key: "file_path",
      title: "File",
      render: (v: string) =>
        v ? (
          <div>
            <a
              href={`http://localhost:5000/${v}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Open File
            </a>

            <div style={{ fontSize: "12px" }}>
              {v.split("/").pop()?.replace(/^\d+-/, "")}{" "}
            </div>
          </div>
        ) : (
          "No File"
        ),
    },
    {
      key: "actions",
      title: "Actions",
      render: (_: any, row: any) => (
        <button
          onClick={() => handleDelete(row.id)}
          style={{
            background: "#ef4444",
            color: "white",
            border: "none",
            padding: "6px 10px",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          Delete
        </button>
      ),
    },
  ];

  const homeworkContent = (
    <div className="assignment__section">
      <DataTable
        columns={columns}
        data={assignmentsList.filter((a) => a.type === "homework")}
      />
    </div>
  );

  const dppContent = (
    <div className="assignment__section">
      <DataTable
        columns={columns}
        data={assignmentsList.filter((a) => a.type === "dpp")}
      />
    </div>
  );

  const notesContent = (
    <div className="assignment__section">
      <DataTable
        columns={columns}
        data={assignmentsList.filter((a) => a.type === "notes")}
      />
    </div>
  );

  const trackerContent = (
    <div className="assignment__section">
      <div className="assignment__tracker-grid">
        {assignmentsList.map((a) => (
          <GlassCard key={a.id} hover className="assignment__tracker-card">
            <div className="assignment__tracker-header">
              <h4>{a.title}</h4>
              <Badge variant={a.status === "completed" ? "success" : "info"}>
                {a.status || "active"}
              </Badge>
            </div>
            <div className="assignment__tracker-meta">
              <span>Class {a.class_name}</span>
              <span>
                Due:{" "}
                {a.due_date
                  ? new Date(a.due_date).toLocaleDateString()
                  : "No Due Date"}
              </span>{" "}
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );

  return (
    <div className="assignment">
      <div className="assignment__header">
        <div className="assignment__header-actions">
          <Button
            icon={<Upload size={16} />}
            onClick={() => {
              setUploadType("homework");
              setShowUploadModal(true);
            }}
          >
            Upload Homework
          </Button>
          <Button
            variant="secondary"
            icon={<FileText size={16} />}
            onClick={() => {
              setUploadType("dpp");
              setShowUploadModal(true);
            }}
          >
            Upload DPP
          </Button>
          <Button
            variant="outline"
            icon={<BookOpen size={16} />}
            onClick={() => {
              setUploadType("notes");
              setShowUploadModal(true);
            }}
          >
            Share Notes
          </Button>
        </div>
      </div>

      <Tabs
        tabs={[
          {
            id: "homework",
            label: "Homework",
            icon: <FileText size={16} />,
            content: homeworkContent,
          },
          {
            id: "dpp",
            label: "DPP",
            icon: <AlertCircle size={16} />,
            content: dppContent,
          },
          {
            id: "notes",
            label: "Notes",
            icon: <BookOpen size={16} />,
            content: notesContent,
          },
          {
            id: "tracker",
            label: "Submission Tracker",
            icon: <CheckCircle size={16} />,
            content: trackerContent,
          },
        ]}
      />

      <Modal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        title={`Upload ${uploadType.toUpperCase()}`}
        size="lg"
      >
        <div className="assignment__modal-form">
          <InputField
            label="Title"
            placeholder={`Enter ${uploadType} title`}
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
          />
          <SelectField
            label="Class"
            value={formData.class_id}
            onChange={(e) =>
              setFormData({ ...formData, class_id: e.target.value })
            }
            options={classes.map((cls) => ({
              value: String(cls.id),
              label: cls.name,
            }))}
          />
          <SelectField
            label="Subject"
            value={formData.subject_id}
            onChange={(e) =>
              setFormData({
                ...formData,
                subject_id: e.target.value,
              })
            }
            options={subjects.map((subject) => ({
              value: String(subject.id),
              label: subject.name,
            }))}
          />
          <InputField
            label="Due Date"
            type="date"
            value={formData.due_date}
            onChange={(e) =>
              setFormData({ ...formData, due_date: e.target.value })
            }
          />
          <InputField
            label="Instructions"
            placeholder="Any special instructions..."
            value={formData.instructions}
            onChange={(e) =>
              setFormData({ ...formData, instructions: e.target.value })
            }
          />
          <FileUpload onFilesSelected={(files) => setSelectedFile(files[0])} />
          <div className="assignment__modal-actions">
            <Button variant="outline" onClick={() => setShowUploadModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpload}>Upload</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AssignmentManagement;
