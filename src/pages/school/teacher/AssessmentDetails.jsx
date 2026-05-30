import React, { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const AssessmentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [questionText, setQuestionText] = useState("");
  const [questionType, setQuestionType] = useState("mcq");
  const [questionMarks, setQuestionMarks] = useState("1");
  const [questions, setQuestions] = useState([]);

  const assessmentLabel = useMemo(() => `Assessment ID: ${id}`, [id]);

  const handleAddQuestion = () => {
    if (!questionText.trim()) {
      window.alert("Please enter a question");
      return;
    }

    setQuestions((current) => [
      ...current,
      {
        id: Date.now(),
        text: questionText.trim(),
        type: questionType,
        marks: Number(questionMarks) || 1,
      },
    ]);

    setQuestionText("");
    setQuestionType("mcq");
    setQuestionMarks("1");
    setShowQuestionForm(false);
  };

  return (
    <div style={{ padding: "24px", maxWidth: "960px", margin: "0 auto" }}>

    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "24px",
      }}
    >
      <div>
        <h1>
          Assessment Details
        </h1>

        <p>
          {assessmentLabel}
        </p>
      </div>

      <div style={{ display: "flex", gap: "12px" }}>
      <button
        type="button"
        onClick={() => navigate("/school/teacher/assessments")}
        style={{ padding: "10px 16px", borderRadius: "10px", border: "1px solid #d0d7de", background: "#fff", cursor: "pointer" }}
      >
        Back
      </button>

      <button
        type="button"
        onClick={() => setShowQuestionForm(true)}
        style={{ padding: "10px 16px", borderRadius: "10px", border: "none", background: "#2563eb", color: "#fff", cursor: "pointer" }}
      >
        Add Question
      </button>
      </div>
    </div>

    <div style={{ display: "grid", gap: "16px" }}>
      {questions.length > 0 ? questions.map((question, index) => (
        <div key={question.id} style={{ padding: "16px", border: "1px solid #e5e7eb", borderRadius: "12px", background: "#fff" }}>
          <strong>Question {index + 1}</strong>
          <p style={{ marginTop: "8px" }}>{question.text}</p>
          <small>Type: {question.type} | Marks: {question.marks}</small>
        </div>
      )) : (
        <div style={{ padding: "20px", border: "1px dashed #cbd5e1", borderRadius: "12px", color: "#64748b" }}>
          No questions added yet. Use Add Question to create one.
        </div>
      )}
    </div>

    {showQuestionForm && (
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(15, 23, 42, 0.55)",
          display: "grid",
          placeItems: "center",
          padding: "20px",
          zIndex: 50,
        }}
      >
        <div style={{ width: "100%", maxWidth: "560px", background: "#fff", borderRadius: "16px", padding: "24px" }}>
          <h2 style={{ marginTop: 0 }}>Add Question</h2>
          <label style={{ display: "grid", gap: "8px", marginBottom: "14px" }}>
            <span>Question</span>
            <textarea
              rows={4}
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #cbd5e1" }}
            />
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 120px", gap: "12px", marginBottom: "18px" }}>
            <label style={{ display: "grid", gap: "8px" }}>
              <span>Type</span>
              <select
                value={questionType}
                onChange={(e) => setQuestionType(e.target.value)}
                style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #cbd5e1" }}
              >
                <option value="mcq">MCQ</option>
                <option value="short">Short Answer</option>
                <option value="essay">Essay</option>
              </select>
            </label>
            <label style={{ display: "grid", gap: "8px" }}>
              <span>Marks</span>
              <input
                type="number"
                min="1"
                value={questionMarks}
                onChange={(e) => setQuestionMarks(e.target.value)}
                style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #cbd5e1" }}
              />
            </label>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
            <button
              type="button"
              onClick={() => setShowQuestionForm(false)}
              style={{ padding: "10px 16px", borderRadius: "10px", border: "1px solid #d0d7de", background: "#fff", cursor: "pointer" }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAddQuestion}
              style={{ padding: "10px 16px", borderRadius: "10px", border: "none", background: "#2563eb", color: "#fff", cursor: "pointer" }}
            >
              Save Question
            </button>
          </div>
        </div>
      </div>
    )}

  </div>
);
}

export default AssessmentDetails;