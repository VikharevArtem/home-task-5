const API_URL = 'https://tasks-service-maks1394.amvera.io';

const BASE_CONFIG: RequestInit = {
  headers: {
    'Content-Type': 'application/json',
  },
};

class BaseFetchAgent {
  constructor(private _apiUrl: string) {}

  protected fetchRequest = async <ReturnDataType>(
    endpoint: string,
    config: RequestInit = {},
    params?: RequestParams
  ): Promise<ReturnDataType> => {
    const url = new URL(endpoint, this._apiUrl);
    if (params) {
      Object.entries(params)
        .filter(([, v]) => v !== null && v !== undefined)
        .forEach(([k, v]) => url.searchParams.append(k, String(v)));
    }

    const fullConfig: RequestInit = {
      ...BASE_CONFIG,
      ...config,
      headers: {
        ...BASE_CONFIG.headers,
        ...config.headers,
      },
    };

    const response = await fetch(url.toString(), fullConfig);

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

      try {
        const errorData = await response.json();

        if (typeof errorData === 'object' && errorData !== null && 'error' in errorData) {
          const error = (errorData as { error: unknown }).error;
          if (typeof error === 'string') {
            errorMessage = error;
          }
        }
      } catch (e) {
        // Если JSON не удалось распарсить — оставляем базовое сообщение
      }

      throw new Error(errorMessage); // выбрасываем после всей обработки
    }
    const data = await response.json();
    return data as ReturnDataType;
  };
}

class RequestTaskAgent extends BaseFetchAgent {
  constructor() {
    super(API_URL);
  }

  getAllTasks = (params?: RequestParams): Promise<Task[]> => {
    return this.fetchRequest<Task[]>('/tasks', {}, params);
  };

  getTask = (id: number): Promise<Task> => {
    return this.fetchRequest<Task>(`/tasks/${id}`);
  };

  createTask = (data: CreateTask): Promise<Task> => {
    return this.fetchRequest<Task>('/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  };

  updateTask = (id: number, data: UpdateTask): Promise<Task> => {
    return this.fetchRequest<Task>(`/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  };

  deleteTask = (id: number): Promise<Task> => {
    return this.fetchRequest<Task>(`/tasks/${id}`, {
      method: 'DELETE',
    });
  };
}
