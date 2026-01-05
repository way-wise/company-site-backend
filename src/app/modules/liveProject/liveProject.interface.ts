export type ILiveProjectFilterParams = {
  q?: string | undefined;
  projectName?: string | undefined;
  clientName?: string | undefined;
  clientLocation?: string | undefined;
  projectType?: "FIXED" | "HOURLY" | undefined;
  projectStatus?: "PENDING" | "ACTIVE" | "ON_HOLD" | "COMPLETED" | undefined;
};

export type IDailyNote = {
  note: string;
  createdAt: string;
  userId: string;
  userName: string;
  type?: "note" | "action"; // 'note' for regular notes, 'action' for next actions
};

