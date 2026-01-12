/**
 * Filter parameters for querying new live projects
 */
export type INewLiveProjectFilterParams = {
  q?: string | undefined;
  projectName?: string | undefined;
  clientName?: string | undefined;
  clientLocation?: string | undefined;
  projectType?: "FIXED" | "HOURLY" | undefined;
  projectStatus?: "PENDING" | "ACTIVE" | "COMPLETED" | "CANCEL" | "ARCHIVED" | undefined;
};

/**
 * Document object structure stored in the documents array
 */
export type IDocument = {
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  uploadedBy: string; // UserProfile ID
  uploadedAt: string; // ISO date string
};

/**
 * Targeted deadline structure
 */
export type ITargetedDeadline = {
  backend?: string | null; // ISO date string
  frontend?: string | null; // ISO date string
  ui?: string | null; // ISO date string
};
