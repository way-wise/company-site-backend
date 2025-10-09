export type IRoleFilterParams = {
  q?: string | undefined;
  name?: string | undefined;
};

export type ICreateRole = {
  name: string;
  description?: string;
  permissionIds?: string[];
};

export type IUpdateRole = {
  name?: string;
  description?: string;
};

export type IAssignPermissionsToRole = {
  permissionIds: string[];
};

export type IAssignRoleToUser = {
  userId: string;
  roleId: string;
};
