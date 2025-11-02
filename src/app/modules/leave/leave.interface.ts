import { LeaveStatus } from "@prisma/client";

export interface ILeaveApplication {
  id: string;
  userProfileId: string;
  leaveTypeId: string;
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
  leaveTypeId: string;
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
  userProfile: {
    id: string;
    userId: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  };
  leaveType: {
    id: string;
    name: string;
    description: string | null;
    color: string | null;
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
    type: string;
    count: number;
    color: string | null;
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
    name: string;
    color: string | null;
  };
  status: LeaveStatus;
}
