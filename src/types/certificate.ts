export type CertificateCourse = {
  id: string;
  name: string;
  kind: "COURSE" | "CERTIFICATION";
  group: "LANGUAGE" | "PROFESSIONAL";
  color: string;
  icon: string;
  workloadHours: number;
  completionDate: string | null;
  targetCompletionDate: string | null;
  status: string;
  emitsCertificate: boolean;
  platform: { id: string; name: string };
  area: { id: string; name: string };
};

export type Certificate = {
  id: string;
  isAvailable: boolean;
  credentialCode: string | null;
  validationUrl: string | null;
  fileKey: string | null;
  fileName: string | null;
  mimeType: string | null;
  size: number | null;
  completionDate: string | null;
  issueDate: string | null;
  expirationDate: string | null;
  notes: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  course: CertificateCourse;
};

export type CertificateInput = {
  courseId: string;
  isAvailable: boolean;
  credentialCode: string | null;
  validationUrl: string | null;
  completionDate: string | null;
  issueDate: string | null;
  expirationDate: string | null;
  notes: string | null;
};
