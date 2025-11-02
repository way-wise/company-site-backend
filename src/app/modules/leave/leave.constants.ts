export const leaveStatus = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  CANCELLED: "CANCELLED",
} as const;

export const validParams = [
  "status",
  "employeeId",
  "userProfileId",
  "leaveTypeId",
  "startDate",
  "endDate",
  "approvedBy",
  "year",
];
