import { LeaveStatus } from "@prisma/client";

export interface ILeaveApplication {
  id: string;
  employeeId: string;
  startDate: Date;
  endDate: Date;
  reason: string;
  status: LeaveStatus;
  approvedBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateLeaveApplication {
  employeeId: string;
  startDate: Date;
  endDate: Date;
  reason: string;
}

export interface IUpdateLeaveStatus {
  status: LeaveStatus;
  approvedBy: string;
}

export interface ILeaveApplicationWithRelations extends ILeaveApplication {
  employee: {
    id: string;
    userId: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  };
  admin?: {
    id: string;
    userId: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  } | null;
}
