export type NoteCategoryOption = {
  id: string;
  name: string;
};

export type NoteCourseOption = {
  id: string;
  name: string;
};

export type Note = {
  id: string;
  noteDate: string;
  topic: string | null;
  title: string;
  content: string;
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
  isImportant: boolean;
  reviewAt: string | null;
  isReviewed: boolean;
  externalUrl: string | null;
  tags: string[];
};
