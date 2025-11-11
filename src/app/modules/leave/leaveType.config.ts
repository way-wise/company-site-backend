import { LeaveType } from "@prisma/client";

export interface LeaveTypeConfig {
  label: string;
  description: string;
  defaultDaysPerYear: number;
  requiresDocument: boolean;
  color: string;
}

export const LEAVE_TYPE_CONFIG: Record<LeaveType, LeaveTypeConfig> = {
  CASUAL: {
    label: "Casual Leave",
    description: "Casual leave for personal work",
    defaultDaysPerYear: 12,
    requiresDocument: false,
    color: "#60A5FA",
  },
  SICK: {
    label: "Sick Leave",
    description: "Sick leave for medical purposes",
    defaultDaysPerYear: 10,
    requiresDocument: false,
    color: "#F87171",
  },
  EMERGENCY: {
    label: "Emergency Leave",
    description: "Emergency leave for urgent situations",
    defaultDaysPerYear: 0,
    requiresDocument: true,
    color: "#FB923C",
  },
};

export const leaveTypeValues: LeaveType[] = Object.keys(
  LEAVE_TYPE_CONFIG
) as LeaveType[];

