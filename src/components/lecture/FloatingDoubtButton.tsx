interface Props {
  currentTime: number;
  visible: boolean;
  onClick: () => void;
}

function fmt(s: number) {
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
}

export function FloatingDoubtButton({ currentTime, visible, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      style={{
        position: "absolute",
        bottom: "52px",
        left: "16px",
        background: "rgba(168,85,247,0.92)",
        color: "white",
        border: "none",
        borderRadius: "8px",
        padding: "8px 14px",
        fontSize: "13px",
        fontWeight: 600,
        cursor: "pointer",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(10px)",
        transition: "opacity 200ms ease, transform 200ms ease",
        pointerEvents: visible ? "auto" : "none",
        zIndex: 10,
        whiteSpace: "nowrap",
      }}
    >
      💬 Ask doubt at {fmt(currentTime)}
    </button>
  );
}
