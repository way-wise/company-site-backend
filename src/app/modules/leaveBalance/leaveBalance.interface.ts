import { LeaveType } from "@prisma/client";
import { LeaveTypeConfig } from "../leave/leaveType.config";

export interface ILeaveBalance {
  id: string;
  userProfileId: string;
  leaveType: LeaveType;
  year: number;
  totalDays: number;
  usedDays: number;
  remainingDays: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateLeaveBalance {
  userProfileId: string;
  leaveType: LeaveType;
  year: number;
  totalDays: number;
}

export interface IUpdateLeaveBalance {
  totalDays?: number;
  usedDays?: number;
}

export interface ILeaveBalanceWithRelations extends ILeaveBalance {
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
}

export type ILeaveBalanceFilterParams = {
  userProfileId?: string;
  leaveType?: LeaveType;
  year?: number;
};

export interface IEmployeeLeaveSummary {
  userProfileId: string;
  employeeName: string;
  employeeEmail: string;
  totalUsedDays: number;
  totalRemainingDays: number;
  totalDays: number;
  leaveBreakdown: Array<{
    leaveType: LeaveType;
    leaveTypeMeta: LeaveTypeConfig;
    usedDays: number;
    remainingDays: number;
    totalDays: number;
  }>;
}
