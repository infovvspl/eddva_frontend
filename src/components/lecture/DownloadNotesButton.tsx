import { useState } from "react";
import type { Lecture } from "@/lib/api/teacher";

interface Props {
  lecture: Lecture;
}

export function DownloadNotesButton({ lecture }: Props) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

      const pageW = doc.internal.pageSize.getWidth();
      const margin = 20;
      const contentW = pageW - margin * 2;
      let y = 20;

      const addText = (text: string, size: number, color: [number, number, number], bold = false, wrap = true) => {
        doc.setFontSize(size);
        doc.setTextColor(...color);
        if (bold) doc.setFont("helvetica", "bold"); else doc.setFont("helvetica", "normal");
        if (wrap) {
          const lines = doc.splitTextToSize(text, contentW);
          lines.forEach((line: string) => {
            if (y > 270) { doc.addPage(); y = 20; }
            doc.text(line, margin, y);
            y += size * 0.5;
          });
        } else {
          doc.text(text, margin, y);
          y += size * 0.5;
        }
        y += 3;
      };

      const addLine = () => {
        doc.setDrawColor(48, 54, 61);
        doc.line(margin, y, pageW - margin, y);
        y += 5;
      };

      // Header
      addText("EDDVA — Lecture Notes", 18, [249, 115, 22], true, false);
      addText(lecture.title, 14, [230, 237, 243], true, false);
      if (lecture.topic?.name) addText(`Topic: ${lecture.topic.name}`, 10, [139, 148, 158], false, false);
      addText(`Date: ${new Date().toLocaleDateString("en-IN")}`, 10, [72, 79, 88], false, false);
      addLine();

      // Key Concepts
      if ((lecture.aiKeyConcepts?.length ?? 0) > 0) {
        addText("Key Concepts", 13, [249, 115, 22], true, false);
        for (const concept of lecture.aiKeyConcepts!) {
          addText(`• ${concept}`, 10, [230, 237, 243], false, true);
        }
        y += 4;
      }

      // Formulas
      if ((lecture.aiFormulas?.length ?? 0) > 0) {
        addText("Formulas", 13, [249, 115, 22], true, false);
        for (const f of lecture.aiFormulas!) {
          addText(`${f}`, 10, [230, 237, 243], false, true);
          y += 2;
        }
        y += 4;
      }

      // Lecture Notes
      if (lecture.aiNotesMarkdown) {
        addText("Lecture Notes", 13, [249, 115, 22], true, false);
        // Strip markdown syntax for clean PDF text
        const cleaned = lecture.aiNotesMarkdown
          .replace(/#{1,6}\s*/g, "")
          .replace(/\*\*(.*?)\*\*/g, "$1")
          .replace(/\*(.*?)\*/g, "$1")
          .replace(/`(.*?)`/g, "$1")
          .replace(/\n{3,}/g, "\n\n");
        addText(cleaned, 10, [230, 237, 243], false, true);
      }

      // Footer on each page
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(72, 79, 88);
        doc.text(`EDDVA · ${lecture.title} · Page ${i}`, margin, doc.internal.pageSize.getHeight() - 10);
      }

      const topicName = lecture.topic?.name?.replace(/\s+/g, "-") ?? "Notes";
      doc.save(`${topicName}-Notes.pdf`);
    } catch (err) {
      console.error("PDF generation failed", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className="text-xs px-2.5 py-1 rounded transition-colors flex items-center gap-1"
      style={{
        background: "transparent",
        border: "1px solid #30363D",
        color: "#8B949E",
      }}
      onMouseEnter={e => (e.currentTarget.style.background = "#21262D")}
      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
    >
      {loading ? "Generating..." : "📥 PDF"}
    </button>
  );
}
