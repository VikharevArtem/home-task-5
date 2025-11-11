class TaskController {
  private api: RequestTaskAgent;

  constructor() {
    this.api = new RequestTaskAgent();
  }

  async getTasks(params: RequestParams): Promise<Task[]> {
    return this.api.getAllTasks(params);
  }

  async getTaskById(id: number): Promise<Task> {
    return this.api.getTask(id);
  }

  async createTask(data: CreateTask): Promise<Task> {
    return this.api.createTask(data);
  }

  async updateTask(id: number, data: UpdateTask): Promise<Task> {
    return this.api.updateTask(id, data);
  }

  async deleteTask(id: number): Promise<Task> {
    return this.api.deleteTask(id);
  }
}
