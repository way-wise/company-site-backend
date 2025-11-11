import { LeaveStatus, LeaveType } from "@prisma/client";
import { LeaveTypeConfig } from "./leaveType.config";

export interface ILeaveApplication {
  id: string;
  userProfileId: string;
  leaveType: LeaveType;
  startDate: Date;
  endDate: Date;
  reason: string;
  status: LeaveStatus;
  approvedBy?: string | null;
  totalDays: number;
  attachmentUrl?: string | null;
  cancelledAt?: Date | null;
  rejectionReason?: string | null;
  comments?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateLeaveApplication {
  employeeId: string; // Keep for backward compatibility, but maps to userProfileId
  leaveType?: LeaveType;
  startDate: Date;
  endDate: Date;
  reason: string;
  attachmentUrl?: string;
}

export interface IUpdateLeaveStatus {
  status: LeaveStatus;
  approvedBy: string;
  rejectionReason?: string;
  comments?: string;
}

export interface ILeaveApplicationWithRelations extends ILeaveApplication {
  leaveTypeMeta: LeaveTypeConfig;
  userProfile: {
    id: string;
    userId: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  };
  approver?: {
    id: string;
    userId: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  } | null;
}

export interface ILeaveStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  cancelled: number;
  byType: Array<{
    type: LeaveType;
    count: number;
    color: string;
  }>;
}

export interface ILeaveCalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  user: {
    name: string;
    email: string;
  };
  type: {
    value: LeaveType;
    label: string;
    color: string;
  };
  status: LeaveStatus;
}
