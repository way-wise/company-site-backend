export interface ILeaveType {
  id: string;
  name: string;
  description?: string | null;
  defaultDaysPerYear: number;
  requiresDocument: boolean;
  color?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateLeaveType {
  name: string;
  description?: string;
  defaultDaysPerYear: number;
  requiresDocument: boolean;
  color?: string;
  isActive?: boolean;
}

export interface IUpdateLeaveType {
  name?: string;
  description?: string;
  defaultDaysPerYear?: number;
  requiresDocument?: boolean;
  color?: string;
  isActive?: boolean;
}

export type ILeaveTypeFilterParams = {
  q?: string;
  isActive?: boolean;
};

