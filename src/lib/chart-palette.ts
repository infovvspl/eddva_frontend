import { useTheme } from "next-themes"

/** Brand indigo, used for charts in light mode. */
const EDDVA = {
  50: "#eef2ff",
  100: "#e0e7ff",
  300: "#a5b4fc",
  400: "#818cf8",
  600: "#4f46e5",
  700: "#4338ca",
}

export type ChartPalette = {
  isDark: boolean
  grid: string
  /** hover highlight behind the active bar/column */
  cursor: string
  /** undefined = solid grid lines */
  gridDash: string | undefined
  axis: string
  legend: string
  /** Primary and secondary series (lines, areas). */
  s1: string
  s2: string
  /** First and second bar series. */
  barA: string
  barB: string
  /** Fill of line-chart dots (the card colour in dark mode). */
  dotFill: string
  /** Axis tick text. undefined = recharts default (light mode keeps the bold coloured labels). */
  tick: { fill: string; stroke: string } | undefined
  axisStyle: { fontSize: string; fontWeight: number }
  lineWidth: number
  legendIcon: "circle" | "square"
}

const LIGHT: ChartPalette = {
  isDark: false,
  grid: EDDVA[100],
  cursor: "rgba(99,102,241,0.08)",
  gridDash: "4 6",
  axis: EDDVA[400],
  legend: EDDVA[700],
  s1: EDDVA[700],
  s2: EDDVA[400],
  barA: EDDVA[600],
  barB: EDDVA[300],
  dotFill: EDDVA[50],
  tick: undefined,
  axisStyle: { fontSize: "12px", fontWeight: 700 },
  lineWidth: 3,
  legendIcon: "circle",
}

/** shadcn neutral: series use --chart-1..5 (see index.css), text is muted-foreground, grid is the border colour. */
const DARK: ChartPalette = {
  isDark: true,
  grid: "hsl(var(--border) / 0.5)",
  cursor: "hsl(var(--muted) / 0.5)",
  gridDash: undefined,
  axis: "hsl(var(--muted-foreground))",
  legend: "hsl(var(--foreground))",
  s1: "var(--chart-1)",
  s2: "var(--chart-2)",
  barA: "var(--chart-1)",
  barB: "var(--chart-2)",
  dotFill: "hsl(var(--card))",
  // shadcn: text-xs, muted-foreground, no outline on the tick text.
  tick: { fill: "hsl(var(--muted-foreground))", stroke: "none" },
  axisStyle: { fontSize: "12px", fontWeight: 400 },
  lineWidth: 2,
  legendIcon: "square",
}

/** Chart colours for the current theme. Light keeps the brand palette; dark uses the shadcn neutral set. */
export function useChartPalette(): ChartPalette {
  const { resolvedTheme } = useTheme()
  return resolvedTheme === "dark" ? DARK : LIGHT
}
