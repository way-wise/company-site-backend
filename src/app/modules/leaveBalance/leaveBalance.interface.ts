export interface ILeaveBalance {
  id: string;
  userProfileId: string;
  leaveTypeId: string;
  year: number;
  totalDays: number;
  usedDays: number;
  remainingDays: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateLeaveBalance {
  userProfileId: string;
  leaveTypeId: string;
  year: number;
  totalDays: number;
}

export interface IUpdateLeaveBalance {
  totalDays?: number;
  usedDays?: number;
}

export interface ILeaveBalanceWithRelations extends ILeaveBalance {
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
}

export type ILeaveBalanceFilterParams = {
  userProfileId?: string;
  leaveTypeId?: string;
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
    leaveTypeId: string;
    leaveTypeName: string;
    leaveTypeColor: string | null;
    usedDays: number;
    remainingDays: number;
    totalDays: number;
  }>;
}

