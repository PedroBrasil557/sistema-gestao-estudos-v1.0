export type NoteCategoryOption = {
  id: string;
  name: string;
  color?: string;
};

export type NoteCourseOption = {
  id: string;
  name: string;
  color?: string;
  group?: "LANGUAGE" | "PROFESSIONAL";
  icon?: string;
};

export type ChecklistItem = {
  id: string;
  text: string;
  done: boolean;
};

export type Note = {
  id: string;
  noteDate: string;
  topic: string | null;
  title: string;
  content: string;
  color: string | null;
  isDraft: boolean;
  checklist: ChecklistItem[];
  isImportant: boolean;
  reviewAt: string | null;
  isReviewed: boolean;
  reviewedAt: string | null;
  externalUrl: string | null;
  tags: string[];
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  course: NoteCourseOption;
  category: NoteCategoryOption;
};

export type NoteInput = {
  noteDate: string;
  courseId: string;
  topic: string | null;
  title: string;
  categoryId: string;
  content: string;
  color: string | null;
  isDraft: boolean;
  checklist: ChecklistItem[];
  isImportant: boolean;
  reviewAt: string | null;
  isReviewed: boolean;
  externalUrl: string | null;
  tags: string[];
};
