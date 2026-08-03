export interface AiFeature {
  key: string;
  label: string;
  description: string;
  category: 'student' | 'teacher' | 'shared_teacher_student' | 'shared_teacher_admin' | 'school_admin' | 'parent';
  uiType: 'full_page' | 'embedded' | 'mixed';
  defaultEnabled: boolean;
  icon?: string;
}

export const AI_FEATURES: AiFeature[] = [
  {
    key: 'ai_doubt_solver',
    label: 'AI Doubt Solver',
    description: 'Students get instant AI-powered answers to their doubts, and teachers get suggestions in Doubt Queue',
    category: 'shared_teacher_student',
    uiType: 'mixed',
    defaultEnabled: true,
    icon: 'MessageCircleQuestion',
  },
  {
    key: 'ai_study_planner',
    label: 'AI Study Planner',
    description: 'Personalised daily study plans and AI-tutor study-assistant flows tailored to each student',
    category: 'student',
    uiType: 'full_page',
    defaultEnabled: true,
    icon: 'CalendarCheck',
  },
  {
    key: 'ai_career_guidance',
    label: 'Career Guidance AI',
    description: 'AI-powered career counselling, aptitude analysis & guidance reports',
    category: 'student',
    uiType: 'full_page',
    defaultEnabled: true,
    icon: 'Compass',
  },
  {
    key: 'ai_notes_generator',
    label: 'AI Lecture Notes & Transcription',
    description: 'Auto-generate structured notes, transcripts, and image enrichments from lecture recordings',
    category: 'teacher',
    uiType: 'embedded',
    defaultEnabled: false,
    icon: 'FileText',
  },
  {
    key: 'ai_quiz_generator',
    label: 'AI Quiz Generator',
    description: 'Generate topic-wise MCQ quizzes from lesson content and in-video quiz authoring',
    category: 'teacher',
    uiType: 'embedded',
    defaultEnabled: false,
    icon: 'ClipboardList',
  },
  {
    key: 'ai_game_quizzes',
    label: 'AI Game Quizzes',
    description: 'AI-generated quiz questions (quiz-rush, math-sprint) in student gamification pages',
    category: 'student',
    uiType: 'embedded',
    defaultEnabled: false,
    icon: 'Zap',
  },
  {
    key: 'ai_content_generator_assessments',
    label: 'AI Content Generator — Assessments',
    description: 'Generate assessment questions and content within the assessment system',
    category: 'shared_teacher_admin',
    uiType: 'embedded',
    defaultEnabled: false,
    icon: 'Sparkles',
  },
  {
    key: 'ai_content_generator_materials',
    label: 'AI Content Generator — Study Materials',
    description: 'Generate topics, summaries, and material contents with AI',
    category: 'shared_teacher_admin',
    uiType: 'embedded',
    defaultEnabled: false,
    icon: 'Sparkles',
  },
  {
    key: 'ai_ppt_generator',
    label: 'AI PPT Studio',
    description: 'Generate beautiful presentation slides automatically inside topic management',
    category: 'shared_teacher_admin',
    uiType: 'embedded',
    defaultEnabled: false,
    icon: 'Presentation',
  },
  {
    key: 'ai_translation',
    label: 'AI Translation',
    description: 'Translate assessment questions and class notes to different languages',
    category: 'shared_teacher_student',
    uiType: 'embedded',
    defaultEnabled: false,
    icon: 'Languages',
  },
  {
    key: 'ai_ocr_handwriting',
    label: 'AI Image OCR / Handwriting',
    description: 'Extract text from student assignment submissions and handwriting images for grading',
    category: 'shared_teacher_student',
    uiType: 'embedded',
    defaultEnabled: false,
    icon: 'FileSearch',
  },
];
