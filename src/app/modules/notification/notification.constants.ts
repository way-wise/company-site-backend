export const searchableFields = ["title", "message"];
export const validParams = [
  "q",
  "type",
  "read",
  "startDate",
  "endDate",
];

export const NotificationType = {
  PROJECT: "PROJECT",
  TASK: "TASK",
  LEAVE: "LEAVE",
  PAYMENT: "PAYMENT",
  MILESTONE: "MILESTONE",
  CHAT: "CHAT",
  FILE: "FILE",
  COMMENT: "COMMENT",
  SYSTEM: "SYSTEM",
} as const;

