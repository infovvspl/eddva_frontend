import { Play, BookOpen, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

interface Course {
  id: string;
  name: string;
  lastLecture?: string;
  progress: number;
  subject?: string;
  thumbnailUrl?: string;
}

interface ContinueLearningProps {
  courses: Course[];
}

export default function ContinueLearning({ courses }: ContinueLearningProps) {
  const navigate = useNavigate();
  const active = courses.slice(0, 3);

  if (active.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-8 text-center">
        <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
        <p className="font-semibold text-foreground">No courses yet</p>
        <p className="text-sm text-muted-foreground mt-1">Enroll in a course to start learning</p>
        <Button className="mt-4" onClick={() => navigate("/student/courses?discover=1")}>Browse Courses</Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {active.map((course) => (
        <div
          key={course.id}
          className="group flex items-center gap-4 p-4 rounded-2xl border border-border/60 bg-card hover:border-primary/30 hover:shadow-md transition-all duration-200"
        >
          {/* Thumbnail / Icon */}
          <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
            {course.thumbnailUrl
              ? <img src={course.thumbnailUrl} alt="" className="w-full h-full object-cover" />
              : <BookOpen className="w-6 h-6 text-white" />
            }
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground truncate">{course.name}</p>
            {course.lastLecture && (
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1 truncate">
                <Clock className="w-3 h-3 shrink-0" /> Last: {course.lastLecture}
              </p>
            )}
            <div className="mt-2 flex items-center gap-2">
              <Progress value={course.progress} className="h-1.5 flex-1" />
              <span className="text-xs font-bold text-primary shrink-0">{course.progress}%</span>
            </div>
          </div>

          {/* Resume */}
          <Button
            size="sm"
            className="shrink-0 rounded-xl gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => navigate(`/student/courses/${course.id}`)}
          >
            <Play className="w-3.5 h-3.5" /> Resume
          </Button>
        </div>
      ))}
    </div>
  );
}
