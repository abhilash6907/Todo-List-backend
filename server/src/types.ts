export type Task = {
  id: string;
  userId: string;
  title: string;
  description: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ApiErrorBody = {
  message: string;
  details?: unknown;
};
