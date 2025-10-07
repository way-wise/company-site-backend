export const leaveStatus = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;

export const validParams = [
  "status",
  "employeeId",
  "startDate",
  "endDate",
  "approvedBy",
];
