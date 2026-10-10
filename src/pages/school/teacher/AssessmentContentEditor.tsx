/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useMemo } from "react";
import { FileText, Key, Pencil, Eye } from "lucide-react";
import AssessmentContentRenderer from "@/components/school/AssessmentContentRenderer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Modal from "@/components/school/Modal";
import DiagramManager from "@/components/school/diagram/DiagramManager";
import DiagramsButton from "@/components/school/diagram/DiagramsButton";
import { insertMarkerAtCursor } from "@/components/school/diagram/marker-insert";
import { diagramApi, type DiagramRecord } from "@/components/school/diagram/diagram-api";
import { expandMarkersForPreview, type PreviewListState } from "@/components/school/diagram/expand-markers";

// Question mark weights used by the AI generator (matches the backend's
// hardcoded per-section values: MCQ/True-False/Fill-blank = 1 mark, Short
// answer = 3 marks, Long answer = 5 marks).
export const QUESTION_MARK_WEIGHTS = { mcq: 1, trueFalse: 1, fillBlank: 1, short: 3, long: 5 } as const;

export function computeAiConfigTotal(counts: { mcqCount: number; trueFalseCount: number; fillBlankCount: number; shortCount: number; longCount: number }) {
  return (
    counts.mcqCount * QUESTION_MARK_WEIGHTS.mcq +
    counts.trueFalseCount * QUESTION_MARK_WEIGHTS.trueFalse +
    counts.fillBlankCount * QUESTION_MARK_WEIGHTS.fillBlank +
    counts.shortCount * QUESTION_MARK_WEIGHTS.short +
    counts.longCount * QUESTION_MARK_WEIGHTS.long
  );
}

/**
 * Suggests question counts per section that sum EXACTLY to `total`, using a
 * sensible CBSE-style weightage (~30% long answer, ~25% short answer, the
 * remainder split evenly across the three 1-mark objective types). Any
 * rounding residue is absorbed by the 1-mark categories, which can always
 * make the sum land exactly on `total` since they have the finest granularity.
 */
export function distributeMarksForTotal(total: number) {
  const t = Math.max(0, Math.round(total || 0));
  if (t === 0) return { mcqCount: 0, trueFalseCount: 0, fillBlankCount: 0, shortCount: 0, longCount: 0 };

  let longCount = Math.round((t * 0.3) / QUESTION_MARK_WEIGHTS.long);
  let shortCount = Math.round((t * 0.25) / QUESTION_MARK_WEIGHTS.short);
  let remaining = t - longCount * QUESTION_MARK_WEIGHTS.long - shortCount * QUESTION_MARK_WEIGHTS.short;

  // Small totals: long/short weighting alone can overshoot — scale back
  // before touching the 1-mark categories.
  while (remaining < 0 && (longCount > 0 || shortCount > 0)) {
    if (longCount > 0) { longCount -= 1; remaining += QUESTION_MARK_WEIGHTS.long; }
    else { shortCount -= 1; remaining += QUESTION_MARK_WEIGHTS.short; }
  }

  const base = Math.floor(remaining / 3);
  const leftover = remaining - base * 3;
  const mcqCount = base + (leftover > 0 ? 1 : 0);
  const trueFalseCount = base + (leftover > 1 ? 1 : 0);
  const fillBlankCount = base;

  return { mcqCount, trueFalseCount, fillBlankCount, shortCount, longCount };
}

export function ContentEditor({
  questions,
  onQuestionsChange,
  answerKey,
  onAnswerKeyChange,
  assessmentId,
}: {
  questions: string;
  onQuestionsChange: (v: string) => void;
  answerKey: string;
  onAnswerKeyChange: (v: string) => void;
  /** Present only for a saved assessment — diagrams belong to one. */
  assessmentId?: string;
}) {
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const [editorPage, setEditorPage] = useState<"questions" | "answerKey">("questions");
  const [showDiagrams, setShowDiagrams] = useState(false);
  const [diagramRecords, setDiagramRecords] = useState<DiagramRecord[]>([]);
  const [diagramsState, setDiagramsState] = useState<PreviewListState>('loading');
  const questionsRef = React.useRef<HTMLTextAreaElement | null>(null);

  // The paper's diagrams, so the preview can show a figure where a marker sits
  // instead of the marker's raw text. Refetched whenever the Diagrams panel
  // closes, because that is when a teacher has just created, edited or
  // approved one. A failure is silent on purpose: the preview then falls back
  // to explaining that each marker resolved to nothing, which is exactly what
  // it should say when the list could not be read.
  const reloadDiagrams = React.useCallback(() => {
    if (!assessmentId) {
      // An unsaved test has no diagrams and never will until it is saved, so
      // this is a settled answer rather than a missing one.
      setDiagramRecords([]);
      setDiagramsState('ready');
      return;
    }
    setDiagramsState('loading');
    diagramApi
      .list(assessmentId)
      .then((rows) => { setDiagramRecords(rows); setDiagramsState('ready'); })
      .catch(() => { setDiagramRecords([]); setDiagramsState('failed'); });
  }, [assessmentId]);

  useEffect(() => { reloadDiagrams(); }, [reloadDiagrams]);

  const closeDiagrams = () => {
    setShowDiagrams(false);
    reloadDiagrams();
  };

  // What a student would be served, plus an explanation wherever they would be
  // served nothing. The server remains the authority on which diagrams reach a
  // student; this only mirrors that decision so a teacher can see it.
  // The list state travels with the records. Without it an empty list reads as
  // "this marker is wrong" whether the request failed, is still in flight, or
  // genuinely returned nothing — and only the last of those is the teacher's
  // to act on.
  const previewQuestions = useMemo(
    () => expandMarkersForPreview(questions, diagramRecords, diagramsState).text,
    [questions, diagramRecords, diagramsState],
  );

  // The marker lands on its own line after the line the cursor is in, so the
  // teacher chooses the question rather than anything guessing it. The paper
  // is spliced at a line boundary, so nothing else changes.
  const handleInsertMarker = (marker: string) => {
    const el = questionsRef.current;
    const at = el ? el.selectionStart : questions.length;
    const next = insertMarkerAtCursor(questions, at, marker);
    onQuestionsChange(next.text);
    closeDiagrams();
    setEditorPage("questions");
    setActiveTab("edit");
    window.requestAnimationFrame(() => {
      const box = questionsRef.current;
      if (!box) return;
      box.focus();
      box.setSelectionRange(next.cursor, next.cursor);
    });
  };

  return (
    <div className="space-y-4">
      {/* Header Tabs & Navigation Buttons */}
      <div className="flex flex-wrap items-center justify-between border-b border-gray-200 gap-2 pb-1">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "edit" | "preview")}>
          <TabsList className="h-auto gap-0 rounded-none bg-transparent p-0">
            <TabsTrigger
              value="edit"
              className="rounded-none border-b-2 border-transparent px-3 py-2 text-sm font-bold text-gray-500 hover:text-gray-700 data-[state=active]:border-brand-500 data-[state=active]:bg-transparent data-[state=active]:font-extrabold data-[state=active]:text-brand-600 data-[state=active]:shadow-none sm:px-4"
            >
              <Pencil className="mr-1 size-3.5" /> Edit Test
            </TabsTrigger>
            <TabsTrigger
              value="preview"
              className="rounded-none border-b-2 border-transparent px-3 py-2 text-sm font-bold text-gray-500 hover:text-gray-700 data-[state=active]:border-brand-500 data-[state=active]:bg-transparent data-[state=active]:font-extrabold data-[state=active]:text-brand-600 data-[state=active]:shadow-none sm:px-4"
            >
              <Eye className="mr-1 size-3.5" /> Preview<span className="hidden sm:inline">&nbsp;(Student View)</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Quick Page Switcher Buttons */}
        <div className="flex flex-wrap items-center gap-2 pb-1">
          {editorPage === "questions" ? (
            <DiagramsButton assessmentId={assessmentId} onOpen={() => setShowDiagrams(true)} />
          ) : null}
          {editorPage === "questions" ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="gap-1.5 border-amber-300 bg-amber-50 font-bold text-amber-900 hover:bg-amber-100 hover:text-amber-900"
              onClick={() => setEditorPage("answerKey")}
            >
              <Key size={14} />
              Answer Key Page →
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="gap-1.5 border-brand-300 bg-blue-50 font-bold text-brand-700 hover:bg-blue-100 hover:text-brand-700"
              onClick={() => setEditorPage("questions")}
            >
              <FileText size={14} />
              ← Question Paper Page
            </Button>
          )}
        </div>
      </div>

      {activeTab === "edit" ? (
        <div>
          {editorPage === "questions" ? (
            /* Question Paper Page */
            <Card className="rounded-xl border-gray-200 bg-white overflow-hidden flex flex-col shadow-none">
              <div className="flex items-center justify-between bg-blue-50 px-4 py-2.5 border-b border-blue-100">
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-blue-600" />
                  <span className="text-xs font-bold uppercase tracking-wide text-blue-700">Question Paper Page</span>
                  <span className="text-[10px] text-blue-400 font-medium hidden sm:inline">(Students will see this)</span>
                </div>
              </div>
              <Textarea
                ref={questionsRef}
                value={questions}
                onChange={(e) => onQuestionsChange(e.target.value)}
                placeholder="Type or paste the question paper here. Markdown supported (## Section A, 1. question, etc.)."
                className="h-[45vh] min-h-0 w-full resize-none rounded-none border-0 p-4 text-sm leading-6 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-0"
              />
            </Card>
          ) : (
            /* Answer Key Page */
            <Card className="rounded-xl border-amber-200 bg-white overflow-hidden flex flex-col shadow-none">
              <div className="flex items-center justify-between bg-amber-50 px-4 py-2.5 border-b border-amber-100">
                <div className="flex items-center gap-2">
                  <Key size={16} className="text-amber-700" />
                  <span className="text-xs font-bold uppercase tracking-wide text-amber-700">Answer Key Page</span>
                  <span className="text-[10px] text-amber-500 font-medium hidden sm:inline">(Teacher only · hidden from students)</span>
                </div>
              </div>
              <Textarea
                value={answerKey}
                onChange={(e) => onAnswerKeyChange(e.target.value)}
                placeholder="Type or paste the answer key here. E.g. Q1(a), Q2 True, Q3 ______"
                className="h-[45vh] min-h-0 w-full resize-none rounded-none border-0 p-4 text-sm leading-6 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-0"
              />
            </Card>
          )}
        </div>
      ) : (
        <Card className="rounded-xl border-gray-200 bg-gray-50 p-5 overflow-hidden shadow-none">
          {editorPage === "questions" ? (
            <div>
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-gray-500">
                  <FileText size={14} />
                  <span>Question Paper Preview (Student View)</span>
                </div>
              </div>
              <div className="h-[45vh] overflow-y-auto rounded-lg bg-white p-6 border border-gray-100 shadow-inner">
                {questions.trim() ? (
                  <AssessmentContentRenderer>{previewQuestions}</AssessmentContentRenderer>
                ) : (
                  <p className="text-sm text-gray-400 text-center py-12">The rendered question paper will appear here once questions are added.</p>
                )}
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-amber-700">
                  <Key size={14} />
                  <span>Answer Key Preview (Teacher Only)</span>
                </div>
              </div>
              <div className="h-[45vh] overflow-y-auto rounded-lg bg-white p-6 border border-amber-100 shadow-inner">
                {answerKey.trim() ? (
                  <AssessmentContentRenderer>{answerKey}</AssessmentContentRenderer>
                ) : (
                  <p className="text-sm text-gray-400 text-center py-12">The answer key preview will appear here once answers are added.</p>
                )}
              </div>
            </div>
          )}
        </Card>
      )}

      {assessmentId && showDiagrams ? (
        <Modal
          isOpen
          onClose={closeDiagrams}
          title="Diagrams"
          size="xl"
        >
          <DiagramManager
            assessmentId={assessmentId}
            onInsertMarker={handleInsertMarker}
            onClose={closeDiagrams}
          />
        </Modal>
      ) : null}
    </div>
  );
}

