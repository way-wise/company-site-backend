export type IPermissionFilterParams = {
  q?: string | undefined;
  name?: string | undefined;
  group?: string | undefined;
};

export type ICreatePermission = {
  name: string;
  group: string;
  description?: string;
};

export type IUpdatePermission = {
  name?: string;
  group?: string;
  description?: string;
};
