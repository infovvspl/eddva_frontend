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

import MindMapVisualizer from "@/components/school/MindMapVisualizer";

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

  const [pptClassLevel, setPptClassLevel] = useState("");
  const [pptBoard, setPptBoard] = useState("");
  const [isGeneratingPpt, setIsGeneratingPpt] = useState(false);
  const [pptMode, setPptMode] = useState<"topic" | "pdf">("topic");

  const [isGeneratingMindmap, setIsGeneratingMindmap] = useState(false);
  const [generatedMindMap, setGeneratedMindMap] = useState<any>(null);

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

  const generatePresentation = async () => {
    if (pptMode === "topic" && !pptTitle.trim()) {
      notify("Please fill Title before generating.");
      return;
    }
    if (pptMode === "pdf" && !pptFile) {
      notify("Please upload a PDF file before generating.");
      return;
    }
    if (!pptSubject.trim() || !pptClassLevel.trim() || !pptBoard.trim()) {
      notify("Please fill Subject, Class Level, and Board fields before generating.");
      return;
    }

    setIsGeneratingPpt(true);
    const controller = new AbortController();
    const timeoutMs = pptMode === "pdf" ? 180000 : 60000;
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs); // 180s for PDF, 60s for Topic

    try {
      let response;

      if (pptMode === "pdf") {
        const formData = new FormData();

        formData.append("pdf", pptFile!);
        formData.append("classLevel", pptClassLevel);
        formData.append("subject", pptSubject);
        formData.append("board", pptBoard);

        response = await api.post("/creator-studio/ppt/generate-from-pdf", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          responseType: "blob",
          signal: controller.signal,
        });
      } else {
        response = await api.post("/creator-studio/ppt/generate", {
          topic: pptTitle,
          classLevel: pptClassLevel,
          subject: pptSubject,
          board: pptBoard,
        }, {
          responseType: "blob",
          signal: controller.signal,
        });
      }

      if (response.status !== 200 && response.status !== 201) {
        throw new Error(`HTTP ${response.status}`);
      }

      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      });

      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download =
        pptMode === "pdf"
          ? `PDF_Class${pptClassLevel}_${pptSubject}.pptx`
          : `${pptTitle || "Presentation"}.pptx`;

      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);

      notify("PPT generated successfully!");
      setShowPptModal(false);
    }
    catch (error: any) {
      if (error.name === "AbortError") {
        notify("Generation timed out. Please try again.");
      } else {
        notify(`Failed to generate PPT: ${error.message || "Unknown error"}`);
      }

      console.error(error);
    }
    finally {
      setIsGeneratingPpt(false);
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

    const generateMindMap = async () => {
      if (!mindMapTopic.trim()) {
        notify("Please enter a central topic before generating.");
        return;
      }

      setIsGeneratingMindmap(true);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

      try {
        const response = await api.post("/creator-studio/mindmap/generate", {
          topic: mindMapTopic,
        }, {
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        console.log("MindMap Tree", response.data.data);
        setGeneratedMindMap(response.data.data);

        notify("Mind Map generated successfully!");
        setShowMindMapModal(false);
      } catch (error: any) {
        if (error.name === "AbortError" || error.code === "ECONNABORTED" || error.name === "CanceledError") {
          notify("Generation timed out. Please try again.");
        } else {
          notify(`Failed to generate Mind Map: ${error.message || "Unknown error"}`);
        }
        console.error(error);
      } finally {
        setIsGeneratingMindmap(false);
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
                <button className="creator__ppt-action" title="Edit" type="button" onClick={() => notify("Edit presentation coming soon")}>
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
                <button className="creator__ppt-action" title="Edit" type="button" onClick={() => notify("Edit mind map coming soon")}>
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
        {generatedMindMap && <MindMapVisualizer data={generatedMindMap} />}
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
            <div style={{ display: "flex", gap: "16px", marginBottom: "8px", fontWeight: "bold" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                <input type="radio" name="pptMode" checked={pptMode === "topic"} onChange={() => setPptMode("topic")} /> Topic to PPT
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                <input type="radio" name="pptMode" checked={pptMode === "pdf"} onChange={() => setPptMode("pdf")} /> PDF to PPT
              </label>
            </div>

            {pptMode === "topic" && (
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
              />
            )}{" "}
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
              label="Class Level"
              placeholder="e.g., 6"
              value={pptClassLevel}
              error=""
              onChange={(e) => setPptClassLevel(e.target.value)}
            />{" "}
            <InputField
              label="Board"
              placeholder="e.g., CBSE"
              value={pptBoard}
              error=""
              onChange={(e) => setPptBoard(e.target.value)}
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
            {pptMode === "pdf" && (
              <div className="creator__file-upload">
                <label className="creator__template-label">Upload PDF File</label>

                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      setPptFile(e.target.files[0]);
                    }
                  }}
                />
              </div>
            )}
            <div className="creator__modal-template">
              <p className="creator__template-label">Choose Template</p>
              <div className="creator__template-grid">
                {["Blank", "Lesson Plan", "Quiz Review", "Summary"].map((t) => (
                  <button
                    key={t}
                    className={`creator__template-btn ${pptTemplate === t ? "creator__template-btn--active" : ""
                      } ${pptErrors.template ? "creator__template-btn--error" : ""
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
              <Button onClick={createPresentation} disabled={isGeneratingPpt}>Save Record</Button>{" "}
              <Button onClick={generatePresentation} disabled={isGeneratingPpt}>
                {isGeneratingPpt ? "Generating..." : "Generate PPT"}
              </Button>
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
              <Button onClick={createMindMap} disabled={isGeneratingMindmap}>Save Record</Button>{" "}
              <Button onClick={generateMindMap} disabled={isGeneratingMindmap}>
                {isGeneratingMindmap ? "Generating..." : "Generate Mind Map"}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    );
  };

  export default CreatorStudio;
