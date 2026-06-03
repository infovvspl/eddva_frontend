import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AcademicContextType {
  classId: string;
  sectionId: string;
  subjectId: string;
  className: string;
  sectionName: string;
  subjectName: string;
}

interface AcademicStore {
  activeAcademicContext: AcademicContextType | null;
  setActiveAcademicContext: (ctx: AcademicContextType | null) => void;
  assignments: AcademicContextType[];
  setAssignments: (assignments: AcademicContextType[]) => void;
}

export const useAcademicStore = create<AcademicStore>()(
  persist(
    (set) => ({
      activeAcademicContext: null,
      setActiveAcademicContext: (ctx) => set({ activeAcademicContext: ctx }),
      assignments: [],
      setAssignments: (assignments) => set({ assignments }),
    }),
    {
      name: 'academic-context-storage',
    }
  )
);
