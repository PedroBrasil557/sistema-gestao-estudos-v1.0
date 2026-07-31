export const certificateBucket = "certificates";
export const maxCertificateFileBytes = 10 * 1024 * 1024;
export const allowedCertificateMimeTypes = ["application/pdf", "image/jpeg", "image/png"] as const;
export const allowedCertificateExtensions = ["pdf", "jpg", "jpeg", "png"] as const;
