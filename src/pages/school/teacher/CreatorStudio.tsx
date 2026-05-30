import React, { useState } from "react";
import {
  Presentation,
  GitBranch,
  Plus,
  CreditCard as Edit3,
  Eye,
  Archive,
  Sparkles,
  LayoutGrid as Layout,
  Type,
  Image,
  Palette,
} from "lucide-react";
import GlassCard from "@/components/school/GlassCard";
import Button from "@/components/school/Button";
import Badge from "@/components/school/Badge";
import Tabs from "@/components/school/Tabs";
import Modal from "@/components/school/Modal";
import InputField from "@/components/school/InputField";
import { useEffect } from "react";
import api from "@/lib/api/school-client";
import "./CreatorStudio.css";

const CreatorStudio: React.FC = () => {
  const [showPptModal, setShowPptModal] = useState(false);

  const [showMindMapModal, setShowMindMapModal] = useState(false);

  const [pptSlides, setPptSlides] = useState<any[]>([]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [mindMaps, setMindMaps] = useState<any[]>([]);

  const [pptTitle, setPptTitle] = useState("");

  const [pptSubject, setPptSubject] = useState("");

  const [pptDescription, setPptDescription] = useState("");

  const [pptTemplate, setPptTemplate] = useState("");

  const [pptFile, setPptFile] = useState<File | null>(null);

  const [pptErrors, setPptErrors] = useState({
    title: false,
    subject: false,
    description: false,
    template: false,
  });

  const [mindMapTitle, setMindMapTitle] = useState("");

  const [mindMapTopic, setMindMapTopic] = useState("");

  const [mindMapBranches, setMindMapBranches] = useState("");

  const [mindMapErrors, setMindMapErrors] = useState({
    title: false,
    topic: false,
    branches: false,
  });

  const notify = (message: string) => {
    window.alert(message);
  };

  const handleArchiveMindMap = (mapId: number) => {
    setMindMaps((current) =>
      current.map((map) =>
        map.id === mapId ? { ...map, status: "archived" } : map,
      ),
    );
  };

  useEffect(() => {
    const fetchPresentations = async () => {
      try {
        const response = await api.get("/creator-studio/presentations");

        setPptSlides(response.data.data);
      } catch (error) {
        console.error("Failed to fetch presentations", error);
      }
    };

    const fetchMindMaps = async () => {
      try {
        const response = await api.get("/creator-studio/mind-maps");

        setMindMaps(response.data.data);
      } catch (error) {
        console.error("Failed to fetch mind maps", error);
      }
    };

    fetchPresentations();
    fetchMindMaps();
  }, []);

  const createPresentation = async () => {
    const errors = {
      title: !pptTitle.trim(),
      subject: !pptSubject.trim(),
      description: !pptDescription.trim(),
      template: !pptTemplate.trim(),
    };

    setPptErrors(errors);

    if (
      errors.title ||
      errors.subject ||
      errors.description ||
      errors.template
    ) {
      return;
    }

    try {
      const formData = new FormData();

      formData.append("title", pptTitle);

      formData.append("subject", pptSubject);

      formData.append("description", pptDescription);

      formData.append("template", pptTemplate);

      if (pptFile) {
        formData.append("pptFile", pptFile);
      }

      const response = await api.post(
        "/creator-studio/presentations",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      setPptSlides((prev) => [response.data.data, ...prev]);

      setShowPptModal(false);

      setPptTitle("");
      setPptSubject("");
      setPptDescription("");
      setPptTemplate("");
      setPptFile(null);
    } catch (error) {
      alert("Failed to create presentation");

      console.error(error);
    }
  };

  const createMindMap = async () => {
    const errors = {
      title: !mindMapTitle.trim(),
      topic: !mindMapTopic.trim(),
      branches: !mindMapBranches.trim(),
    };

    setMindMapErrors(errors);

    if (errors.title || errors.topic || errors.branches) {
      return;
    }

    try {
      const response = await api.post("/creator-studio/mind-maps", {
        title: mindMapTitle,
        centralTopic: mindMapTopic,
        branches: mindMapBranches,
      });

      setMindMaps((prev) => [response.data.data, ...prev]);

      setShowMindMapModal(false);

      setMindMapTitle("");
      setMindMapTopic("");
      setMindMapBranches("");
    } catch (error) {
      console.error("Failed to create mind map", error);
    }
  };

  const pptContent = (
    <div className="creator__section">
      <div className="creator__section-header">
        <h3>Presentation Workspace</h3>
        <Button icon={<Plus size={16} />} onClick={() => setShowPptModal(true)}>
          New Presentation
        </Button>
      </div>
      <div className="creator__ppt-grid">
        {pptSlides.map((ppt) => (
          <GlassCard key={ppt.id} hover className="creator__ppt-card">
            <div className="creator__ppt-preview">
              <div className="creator__ppt-slide-mini">
                <Layout size={24} />
              </div>
            </div>
            <div className="creator__ppt-info">
              <h4>
                {ppt.ppt_file && (
                  <span className="creator__ppt-file">PPT Uploaded</span>
                )}
              </h4>
              <div className="creator__ppt-meta">
                <span>{ppt.slides} slides</span>
                <Badge
                  variant={ppt.status === "published" ? "success" : "warning"}
                >
                  {ppt.status}
                </Badge>
              </div>
              <span className="creator__ppt-date">
                Last edited: {ppt.lastEdited}
              </span>
            </div>
            <div className="creator__ppt-actions">
              <button className="creator__ppt-action" title="Edit" type="button" onClick={() => notify("Edit presentation coming soon") }>
                <Edit3 size={16} />
              </button>
              {ppt.ppt_file && (
                <a
                  href={`http://localhost:5000/${ppt.ppt_file}`}
                  target="_blank"
                  rel="noreferrer"
                  className="creator__ppt-action"
                  title="View PPT"
                >
                  <Eye size={16} />
                </a>
              )}
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );

  const mindMapContent = (
    <div className="creator__section">
      <div className="creator__section-header">
        <h3>Mind Map Generator</h3>
        <Button
          variant="secondary"
          icon={<Plus size={16} />}
          onClick={() => setShowMindMapModal(true)}
        >
          New Mind Map
        </Button>
      </div>
      <div className="creator__mindmap-grid">
        {mindMaps.map((map) => (
          <GlassCard key={map.id} hover className="creator__mindmap-card">
            <div className="creator__mindmap-preview">
              <div className="creator__mindmap-visual">
                <div className="creator__mindmap-center">
                  {map.title.split(" ")[0]}
                </div>
                <div className="creator__mindmap-branch creator__mindmap-branch--1" />
                <div className="creator__mindmap-branch creator__mindmap-branch--2" />
                <div className="creator__mindmap-branch creator__mindmap-branch--3" />
                <div className="creator__mindmap-branch creator__mindmap-branch--4" />
              </div>
            </div>
            <div className="creator__mindmap-info">
              <h4>{map.title}</h4>
              <div className="creator__mindmap-meta">
                <span>{map.nodes_count} nodes</span>
                <Badge
                  variant={map.status === "active" ? "success" : "default"}
                >
                  {map.status}
                </Badge>
              </div>
              <span className="creator__mindmap-date">
                Last edited: {map.lastEdited}
              </span>
            </div>
            <div className="creator__mindmap-actions">
              <button className="creator__ppt-action" title="Edit" type="button" onClick={() => notify("Edit mind map coming soon") }>
                <Edit3 size={16} />
              </button>
              {map.status === "active" && (
                <button className="creator__ppt-action" title="Archive" type="button" onClick={() => handleArchiveMindMap(map.id)}>
                  <Archive size={16} />
                </button>
              )}
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );

  const smartContent = (
    <div className="creator__section">
      <div className="creator__section-header">
        <h3>Smart Teaching Content</h3>
        <Button variant="outline" icon={<Sparkles size={16} />} onClick={() => notify("AI generation tools coming soon")}>
          AI Generate
        </Button>
      </div>
      <div className="creator__smart-grid">
        {[
          {
            title: "Quick Summary",
            desc: "Auto-generate topic summaries for revision",
            icon: Type,
            color: "var(--gradient-primary)",
          },
          {
            title: "Visual Aids",
            desc: "Create diagrams and illustrations",
            icon: Image,
            color: "var(--gradient-secondary)",
          },
          {
            title: "Practice Sets",
            desc: "Generate practice problems by difficulty",
            icon: Layout,
            color: "var(--gradient-accent)",
          },
          {
            title: "Custom Themes",
            desc: "Design beautiful presentation themes",
            icon: Palette,
            color: "var(--gradient-cool)",
          },
        ].map((item, idx) => (
          <GlassCard key={idx} hover className="creator__smart-card">
            <div
              className="creator__smart-icon"
              style={{ background: item.color }}
            >
              <item.icon size={24} />
            </div>
            <h4>{item.title}</h4>
            <p>{item.desc}</p>
            <Button size="sm" variant="outline" onClick={() => notify(`${item.title} is opening soon`)}>
              Explore
            </Button>
          </GlassCard>
        ))}
      </div>
    </div>
  );

  return (
    <div className="creator">
      <Tabs
        tabs={[
          {
            id: "ppt",
            label: "Presentations",
            icon: <Presentation size={16} />,
            content: pptContent,
          },
          {
            id: "mindmap",
            label: "Mind Maps",
            icon: <GitBranch size={16} />,
            content: mindMapContent,
          },
          {
            id: "smart",
            label: "Smart Content",
            icon: <Sparkles size={16} />,
            content: smartContent,
          },
        ]}
      />

      <Modal
        isOpen={showPptModal}
        onClose={() => setShowPptModal(false)}
        title="Create New Presentation"
      >
        <div className="creator__modal-form">
          <InputField
            label="Presentation Title"
            placeholder="Enter title"
            value={pptTitle}
            error={pptErrors.title ? "Title is required" : ""}
            onChange={(e) => {
              setPptTitle(e.target.value);

              setPptErrors((prev) => ({
                ...prev,
                title: false,
              }));
            }}
          />{" "}
          <InputField
            label="Subject"
            placeholder="e.g., Mathematics"
            value={pptSubject}
            error={pptErrors.subject ? "Subject is required" : ""}
            onChange={(e) => {
              setPptSubject(e.target.value);

              setPptErrors((prev) => ({
                ...prev,
                subject: false,
              }));
            }}
          />{" "}
          <InputField
            label="Description"
            placeholder="Brief description"
            value={pptDescription}
            error={pptErrors.description ? "Description is required" : ""}
            onChange={(e) => {
              setPptDescription(e.target.value);

              setPptErrors((prev) => ({
                ...prev,
                description: false,
              }));
            }}
          />{" "}
          <div className="creator__file-upload">
            <label className="creator__template-label">Upload PPT File</label>

            <input
              type="file"
              accept=".ppt,.pptx"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  setPptFile(e.target.files[0]);
                }
              }}
            />
          </div>
          <div className="creator__modal-template">
            <p className="creator__template-label">Choose Template</p>
            <div className="creator__template-grid">
              {["Blank", "Lesson Plan", "Quiz Review", "Summary"].map((t) => (
                <button
                  key={t}
                  className={`creator__template-btn ${
                    pptTemplate === t ? "creator__template-btn--active" : ""
                  } ${
                    pptErrors.template ? "creator__template-btn--error" : ""
                  }`}
                  onClick={() => {
                    setPptTemplate(t);

                    setPptErrors((prev) => ({
                      ...prev,
                      template: false,
                    }));
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
            {pptErrors.template && (
              <p className="creator__template-error">
                Please choose a template
              </p>
            )}
          </div>
          <div className="creator__modal-actions">
            <Button variant="outline" onClick={() => setShowPptModal(false)}>
              Cancel
            </Button>
            <Button onClick={createPresentation}>Create</Button>{" "}
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showMindMapModal}
        onClose={() => setShowMindMapModal(false)}
        title="Create New Mind Map"
      >
        <div className="creator__modal-form">
          <InputField
            label="Mind Map Title"
            placeholder="Enter title"
            value={mindMapTitle}
            error={mindMapErrors.title ? "Title is required" : ""}
            onChange={(e) => {
              setMindMapTitle(e.target.value);

              setMindMapErrors((prev) => ({
                ...prev,
                title: false,
              }));
            }}
          />{" "}
          <InputField
            label="Central Topic"
            placeholder="Main topic or concept"
            value={mindMapTopic}
            error={mindMapErrors.topic ? "Central topic is required" : ""}
            onChange={(e) => {
              setMindMapTopic(e.target.value);

              setMindMapErrors((prev) => ({
                ...prev,
                topic: false,
              }));
            }}
          />
          <InputField
            label="Branches"
            placeholder="Comma-separated subtopics"
            value={mindMapBranches}
            error={mindMapErrors.branches ? "Branches are required" : ""}
            onChange={(e) => {
              setMindMapBranches(e.target.value);

              setMindMapErrors((prev) => ({
                ...prev,
                branches: false,
              }));
            }}
          />
          <div className="creator__modal-actions">
            <Button
              variant="outline"
              onClick={() => setShowMindMapModal(false)}
            >
              Cancel
            </Button>
            <Button onClick={createMindMap}>Create</Button>{" "}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CreatorStudio;
