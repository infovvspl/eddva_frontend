import { motion } from "framer-motion";

interface Props {
  mockTestId: string;
  topicId: string;
  onNavigate: (path: string) => void;
  isRevisionMode?: boolean;
  animate?: boolean;
}

export function QuizUnlockButton({ mockTestId, topicId, onNavigate, isRevisionMode = false, animate = true }: Props) {
  const path = mockTestId
    ? `/student/quiz?mockTestId=${mockTestId}`
    : `/student/quiz?topicId=${topicId}`;

  if (isRevisionMode) {
    return (
      <button
        onClick={() => onNavigate(path)}
        className="w-full py-3.5 rounded-2xl font-bold text-sm transition-all"
        style={{
          background: "transparent",
          border: "2px solid #F97316",
          color: "#F97316",
        }}
      >
        Retake Quiz →
      </button>
    );
  }

  return (
    <motion.button
      initial={animate ? { scale: 0.8, opacity: 0 } : false}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", duration: 0.4 }}
      onClick={() => onNavigate(path)}
      className="w-full py-3.5 rounded-2xl font-bold text-sm text-white"
      style={{
        background: "linear-gradient(135deg, #F97316, #EA580C)",
        boxShadow: "0 4px 16px rgba(249,115,22,0.4)",
      }}
    >
      📋 Take Topic Quiz
    </motion.button>
  );
}
