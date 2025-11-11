interface Task {
  id: number;
  name: string;
  info?: string;
  isImportant?: boolean;
  isCompleted?: boolean;
}

type CreateTask = Omit<Task, 'id'>;
type UpdateTask = Partial<CreateTask>;

interface RequestParams {
  [key: string]: string | number | boolean | undefined | null;
}

interface ApiError {
  error?: string;
}
