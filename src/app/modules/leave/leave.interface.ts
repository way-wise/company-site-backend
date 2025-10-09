import { LeaveStatus } from "@prisma/client";

export interface ILeaveApplication {
  id: string;
  userProfileId: string;
  startDate: Date;
  endDate: Date;
  reason: string;
  status: LeaveStatus;
  approvedBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateLeaveApplication {
  employeeId: string; // Keep for backward compatibility, but maps to userProfileId
  startDate: Date;
  endDate: Date;
  reason: string;
}

export interface IUpdateLeaveStatus {
  status: LeaveStatus;
  approvedBy: string;
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
