export type INotificationFilterParams = {
  q?: string | undefined;
  type?: string | undefined;
  read?: boolean | undefined;
  startDate?: string | undefined;
  endDate?: string | undefined;
};

export interface ICreateNotificationPayload {
  userProfileId: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
}

