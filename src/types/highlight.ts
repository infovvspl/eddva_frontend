export interface Highlight {
  id: string;
  recordingId: string;
  createdBy: string;
  updatedBy: string | null;
  startOffset: number;
  endOffset: number;
  displayOrder: number;
  text: string;
  color: string;
  notesHash: string | null;
  createdAt: string;
  updatedAt: string;
}

export type CreateHighlightPayload = Omit<
  Highlight,
  'id' | 'recordingId' | 'createdBy' | 'updatedBy' | 'displayOrder' | 'createdAt' | 'updatedAt'
>;
