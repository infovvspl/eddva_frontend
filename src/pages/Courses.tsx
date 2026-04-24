import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { LandingLayout } from "@/components/landing/LandingLayout";
import { motion } from "framer-motion";
import {
  Search,
  Users,
  Clock,
  ArrowRight,
  MapPin,
  Loader2,
  BookOpen,
  ChevronDown,
  Filter,
} from "lucide-react";
import { B, P } from "@/components/landing/DesignTokens";
import exploreCoursesBg from "@/assets/bg2.jpg";
import { useInstituteCoursesCatalog } from "@/hooks/use-tenant-catalog";
import type { InstituteCatalogCourse } from "@/lib/api/public-tenant";

/** After auth, student lands here to enroll or pay for paid batches. */
const POST_AUTH_ENROLL_PATH = "/student/courses?discover=1";
const loginWithReturn = `/login?returnTo=${encodeURIComponent(POST_AUTH_ENROLL_PATH)}`;
const registerWithReturn = `/register?returnTo=${encodeURIComponent(POST_AUTH_ENROLL_PATH)}`;

const FALLBACK_IMAGES: Record<string, string> = {
  jee: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&q=80&w=1200",
  neet: "https://images.unsplash.com/photo-1532187875605-186c73196ed8?auto=format&fit=crop&q=80&w=1200",
  default:
    "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=1200",
};

const normalize = (s?: string) => (s ?? "").toLowerCase().replace(/[\s_-]+/g, "");

function imageFor(course: InstituteCatalogCourse): string {
  if (course.thumbnailUrl) return course.thumbnailUrl;
  const e = normalize(course.examTarget);
  if (e.includes("neet")) return FALLBACK_IMAGES.neet;
  if (e.includes("jee")) return FALLBACK_IMAGES.jee;
  return FALLBACK_IMAGES.default;
}

function formatDuration(c: InstituteCatalogCourse): string {
  if (!c.startDate || !c.endDate) return "Flexible schedule";
  const ms = new Date(c.endDate).getTime() - new Date(c.startDate).getTime();
  const months = Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24 * 30)));
  return `${months} mo${months > 1 ? "s" : ""}`;
}

function labelExam(examTarget: string) {
  return examTarget.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

function labelClass(cls: string) {
  return cls.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

function CourseCard({
  course,
  index,
  showInstitute,
}: {
  course: InstituteCatalogCourse;
  index: number;
  showInstitute: boolean;
}) {
  const priceLabel = course.isPaid
    ? course.feeAmount != null
      ? `₹${Number(course.feeAmount).toLocaleString("en-IN")}`
      : "Paid"
    : "Free";
  const spotsLeft = Math.max(0, course.maxStudents - course.enrolledCount);

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.35, delay: index * 0.04 }}
      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-shadow hover:shadow-lg"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
        <img
          src={imageFor(course)}
          alt=""
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = FALLBACK_IMAGES.default;
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-slate-900/10 to-transparent" />
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-800 shadow-sm">
            {labelExam(course.examTarget)}
          </span>
          <span
            className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm"
            style={{
              background: `linear-gradient(135deg, ${B}, ${P})`,
            }}
          >
            {priceLabel}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <h3 className="text-lg font-bold leading-snug text-slate-900 line-clamp-2">{course.name}</h3>
        {showInstitute && course.instituteName ? (
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {course.instituteName}
          </p>
        ) : null}
        {course.description ? (
          <p className="line-clamp-2 text-sm text-slate-600">{course.description}</p>
        ) : null}

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-slate-500">
          <span className="inline-flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {course.enrolledCount} enrolled
            {course.maxStudents ? ` · ${spotsLeft} seats left` : ""}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {formatDuration(course)}
          </span>
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Faculty</p>
            <p className="truncate text-sm font-semibold text-slate-700">
              {course.teacherName ?? "Institute faculty"}
            </p>
            <p className="text-xs text-slate-500">{labelClass(course.class)}</p>
          </div>
          <Link
            to={loginWithReturn}
            title="Sign in to enroll or purchase"
            className="inline-flex shrink-0 items-center gap-1 rounded-full bg-slate-900 px-4 py-2 text-xs font-bold text-white transition hover:opacity-90"
          >
            Enroll <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </motion.article>
  );
}

export default function Courses() {
  const { data, isLoading, isError, error } = useInstituteCoursesCatalog();
  const [query, setQuery] = useState("");

  const courses = data?.courses ?? [];
  const institute = data?.institute;
  const isPlatform = data?.catalogScope === "platform";

  const accent = institute?.brandColor && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(institute.brandColor)
    ? institute.brandColor
    : B;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return courses;
    return courses.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.description && c.description.toLowerCase().includes(q)) ||
        c.examTarget.toLowerCase().includes(q) ||
        (c.teacherName && c.teacherName.toLowerCase().includes(q)) ||
        (c.instituteName && c.instituteName.toLowerCase().includes(q))
    );
  }, [courses, query]);

  const showCatalog =
    !isLoading && !isError && institute && !institute.suspended;

  return (
    <LandingLayout>
      {/* ── Section 1: Institute hero (Explore courses) ── */}
      <section className="relative overflow-hidden border-b border-slate-200/80 pt-20 pb-14 sm:pt-28 sm:pb-20">
        <div
          aria-hidden
          className="absolute inset-0 -z-20 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${exploreCoursesBg})` }}
        />
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-gradient-to-br from-white/90 via-sky-50/85 to-white/92"
        />
        <div
          aria-hidden
          className="absolute inset-0 -z-10 opacity-40"
          style={{
            background: `linear-gradient(120deg, ${accent}18 0%, transparent 55%, ${P}14 100%)`,
          }}
        />
        <div className="landing-shell relative">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-16 text-slate-500">
              <Loader2 className="h-12 w-12 animate-spin" style={{ color: accent }} />
              <p className="mt-4 text-sm font-medium">Loading programs…</p>
            </div>
          )}

          {isError && (
            <div className="mx-auto max-w-lg rounded-2xl border border-red-200 bg-red-50/90 p-8 text-center">
              <p className="font-semibold text-red-900">Could not load courses</p>
              <p className="mt-2 text-sm text-red-800">
                {(error as Error)?.message || "Check your network and try again."}
              </p>
            </div>
          )}

          {showCatalog && institute && (
            <>
              <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:items-start sm:text-left">
                {institute.logoUrl ? (
                  <img
                    src={institute.logoUrl}
                    alt=""
                    className="h-20 w-20 rounded-2xl border border-white bg-white object-contain p-1 shadow-md sm:h-24 sm:w-24"
                  />
                ) : (
                  <div
                    className="flex h-20 w-20 items-center justify-center rounded-2xl text-2xl font-black text-white shadow-md sm:h-24 sm:w-24"
                    style={{ background: `linear-gradient(135deg, ${accent}, ${P})` }}
                  >
                    {(institute.name?.charAt(0) || "E").toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                    {isPlatform ? "Public catalog" : "Institute"}
                  </p>
                  <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl md:text-5xl">
                    {isPlatform ? "Explore courses" : institute.name}
                  </h1>
                  <p className="mx-auto mt-3 max-w-2xl text-base text-slate-600 sm:mx-0">
                    {institute.welcomeMessage ||
                      (isPlatform
                        ? "Programs from partner institutes. Anyone can browse; sign in or create an account to enroll and pay for paid courses."
                        : "Browse live batches from this institute. Sign in to enroll and access your classroom.")}
                  </p>
                  <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-sm text-slate-600 sm:justify-start">
                    {!isPlatform && (institute.city || institute.state) ? (
                      <span className="inline-flex items-center gap-1.5 font-medium">
                        <MapPin className="h-4 w-4 shrink-0 opacity-70" />
                        {[institute.city, institute.state].filter(Boolean).join(", ")}
                      </span>
                    ) : null}
                    <span className="inline-flex items-center gap-1.5 font-semibold text-slate-800">
                      <BookOpen className="h-4 w-4 shrink-0" style={{ color: accent }} />
                      {courses.length} program{courses.length === 1 ? "" : "s"}
                      {isPlatform ? " listed" : " open"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mx-auto mt-10 max-w-2xl sm:mx-0">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <input
                      type="search"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder={
                        isPlatform
                          ? "Search by course, institute, exam, or teacher…"
                          : "Search by course, exam, or teacher…"
                      }
                      className="h-14 w-full rounded-2xl border border-slate-200/90 bg-white/95 pl-12 pr-4 text-sm font-medium text-slate-900 shadow-sm outline-none ring-slate-200 transition focus:ring-2"
                    />
                  </div>

                  <div className="relative shrink-0 sm:w-48">
                    <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
                      <Filter className="h-4 w-4 text-slate-400" />
                    </div>
                    <select
                      value={["jee", "neet", "foundation", "crash course"].includes(query.toLowerCase()) ? query : ""}
                      onChange={(e) => setQuery(e.target.value)}
                      className="h-14 w-full appearance-none rounded-2xl border border-slate-200/90 bg-white/95 pl-10 pr-10 text-sm font-bold text-slate-700 shadow-sm outline-none ring-slate-200 transition focus:ring-2"
                    >
                      <option value="">All Categories</option>
                      <option value="JEE">JEE</option>
                      <option value="NEET">NEET</option>
                      <option value="Foundation">Foundation</option>
                      <option value="Crash Course">Crash Course</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>

                {query && (
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={() => setQuery("")}
                      className="text-xs font-bold text-red-500 transition hover:text-red-600 hover:underline"
                    >
                      Clear filters & search
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </section>

      {/* ── Section 2: Course catalog ── */}
      {showCatalog && (
        <section id="courses" className="landing-section bg-slate-50/80">
          <div className="landing-shell">
            <div className="mb-10 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">All programs</h2>
                <p className="mt-1 text-sm text-slate-600">
                  {filtered.length === courses.length
                    ? isPlatform
                      ? `${courses.length} open course${courses.length === 1 ? "" : "s"} across institutes.`
                      : `${courses.length} course${courses.length === 1 ? "" : "s"} from ${institute!.name}.`
                    : `${filtered.length} of ${courses.length} courses match your search.`}
                </p>
              </div>
            </div>

            {courses.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-20 text-center">
                <BookOpen className="mx-auto h-12 w-12 text-slate-300" />
                <p className="mt-4 text-lg font-semibold text-slate-800">No programs available yet</p>
                <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                  {isPlatform
                    ? "There are no published courses on the platform right now. Check back later."
                    : "This institute has not published any active batches. Check back soon or contact the institute."}
                </p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center text-slate-600">
                No courses match &ldquo;{query}&rdquo;. Try another search.
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((c, i) => (
                  <CourseCard key={c.id} course={c} index={i} showInstitute={isPlatform} />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {!isLoading && !isError && institute?.suspended && (
        <section className="landing-section bg-slate-50">
          <div className="landing-shell max-w-xl rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <p className="text-lg font-bold text-slate-900">This institute is unavailable</p>
            <p className="mt-2 text-sm text-slate-600">Please contact support or try again later.</p>
          </div>
        </section>
      )}

      {/* ── Section 3: CTA ── */}
      {showCatalog && (
        <section className="landing-section pb-20">
          <div className="landing-shell">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="relative overflow-hidden rounded-3xl px-8 py-12 text-center text-white sm:px-14 sm:py-14"
              style={{ background: `linear-gradient(135deg, ${accent} 0%, ${P} 100%)` }}
            >
              <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
              <h2 className="relative text-2xl font-black leading-tight sm:text-3xl">Enroll or purchase</h2>
              <p className="relative mx-auto mt-3 max-w-lg text-sm text-white/90">
                Create a free student account (or sign in). Then open{" "}
                <strong className="font-bold">Discover courses</strong> to join a batch and complete payment for paid
                programs.
              </p>
              <div className="relative mt-8 flex flex-wrap justify-center gap-3">
                <Link
                  to={registerWithReturn}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3 text-sm font-bold text-slate-900 shadow-lg transition hover:scale-[1.02] active:scale-[0.98]"
                >
                  Create account <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to={loginWithReturn}
                  className="inline-flex items-center gap-2 rounded-full border-2 border-white/80 bg-transparent px-7 py-3 text-sm font-bold text-white transition hover:bg-white/10"
                >
                  Sign in to continue
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      )}
    </LandingLayout>
  );
}
