let currentTasks: Task[] = [];
let taskController: TaskController;

const DOM = {
  apiMethod: document.getElementById('apiMethod') as HTMLSelectElement,
  tasksList: document.getElementById('tasksList') as HTMLElement,
  getTasksButton: document.querySelector('#getTasksSection button') as HTMLButtonElement,
  createTaskForm: document.getElementById('createTaskForm') as HTMLFormElement,
  createTaskResult: document.getElementById('createTaskResult') as HTMLElement,
  updateForm: document.getElementById('updateTaskForm') as HTMLFormElement,
  updateTaskResult: document.getElementById('updateTaskResult') as HTMLElement,
  deleteTaskResult: document.getElementById('deleteTaskResult') as HTMLElement,
  getTaskByIdResult: document.getElementById('getTaskByIdResult') as HTMLElement,

  taskIdSelect: document.getElementById('taskIdSelect') as HTMLSelectElement,
  updateTaskIdSelect: document.getElementById('updateTaskIdSelect') as HTMLSelectElement,
  deleteTaskIdSelect: document.getElementById('deleteTaskIdSelect') as HTMLSelectElement,

  createName: document.getElementById('createName') as HTMLInputElement,
  createInfo: document.getElementById('createInfo') as HTMLInputElement,
  createIsImportant: document.getElementById('createIsImportant') as HTMLInputElement,
  createIsCompleted: document.getElementById('createIsCompleted') as HTMLInputElement,

  nameLikeFilter: document.getElementById('nameLikeFilter') as HTMLInputElement,
  isImportantFilter: document.getElementById('isImportantFilter') as HTMLInputElement,
  isCompletedFilter: document.getElementById('isCompletedFilter') as HTMLInputElement,

  getTaskByIdButton: document.getElementById('getTaskByIdButton') as HTMLButtonElement,
  deleteTaskButton: document.getElementById('deleteTaskButton') as HTMLButtonElement,
  updateTaskButton: document.getElementById('updateTaskButton') as HTMLButtonElement,
};

// Проверка, что строка — это ключ Task
function isTaskKey(key: string): key is keyof Task {
  return ['name', 'info', 'isImportant', 'isCompleted'].includes(key);
}

function renderTaskCard(task: Task): string {
  const { id, name = '', info = '', isImportant, isCompleted } = task;
  const isCompletedClass = isCompleted ? 'completed' : '';
  const isImportantClass = isImportant ? 'important' : '';
  return `
    <div class="task-card ${isImportantClass} ${isCompletedClass}">
      <div class="task-id">ID: ${id}</div>
      <div class="task-name">${name || ''}</div>
      <div class="task-info">${info ? info : '<em>Без описания</em>'}</div>
      <div class="task-meta">
        <span>${isImportant ? 'Важная' : 'Обычная'}</span>
        <span>${isCompleted ? 'Завершена' : 'В работе'}</span>
      </div>
    </div>
  `;
}

function renderTasks(tasks: Task[]): void {
  currentTasks = Array.isArray(tasks) ? tasks : [];

  if (!DOM.tasksList) return;

  if (currentTasks.length === 0) {
    DOM.tasksList.innerHTML = '<p class="no-tasks">Задачи не найдены.</p>';
    updateTaskIdSelects([]);
    return;
  }

  DOM.tasksList.innerHTML = currentTasks.map(renderTaskCard).join('');
  updateTaskIdSelects(currentTasks);
}

function updateTaskIdSelects(tasks: Task[]): void {
  const ids = tasks.map((t) => t.id);
  const selects = [DOM.taskIdSelect, DOM.updateTaskIdSelect, DOM.deleteTaskIdSelect].filter(
    Boolean
  ) as HTMLSelectElement[];

  selects.forEach((select) => {
    const currentVal = select.value;
    select.innerHTML = '';
    select.disabled = true;

    if (ids.length === 0) {
      select.add(new Option('— Задачи отсутствуют —', ''));
    } else {
      select.add(new Option('— Выберите ID —', ''));
      ids.forEach((id) => select.add(new Option(`ID ${id}`, String(id))));
      select.disabled = false;
      if (ids.includes(Number(currentVal))) select.value = currentVal;
    }
  });
}

function renderSingleTask(containerId: string, task: Task): void {
  const container = document.getElementById(containerId);
  if (container) container.innerHTML = renderTaskCard(task);
}

function renderError(containerId: string, message: string): void {
  const container = document.getElementById(containerId);
  if (container) {
    container.innerHTML = `<p class="error-message">${message}</p>`;
  }
}

function renderSuccess(containerId: string, message: string): void {
  const container = document.getElementById(containerId);
  if (container) {
    container.innerHTML = `<p class="success-message">${message}</p>`;
  }
}

async function previewTaskForAction(selectId: string, containerId: string): Promise<void> {
  const select = document.getElementById(selectId) as HTMLSelectElement;
  const container = document.getElementById(containerId);
  if (!select || !container) return;

  const id = Number(select.value);
  container.innerHTML = '';

  if (!id) return;

  const task = currentTasks.find((t) => t.id === id);

  if (task) {
    renderSingleTask(containerId, task);
  } else {
    try {
      const fetchedTask = await taskController.getTaskById(id);
      renderSingleTask(containerId, fetchedTask);
    } catch (error) {
      renderError(containerId, `Не удалось загрузить задачу: ${error.message}`);
    }
  }
}

function setLoading(isLoading: boolean, button?: HTMLButtonElement): void {
  if (!button) return;

  if (isLoading) {
    if (!button.dataset.originalText) {
      button.dataset.originalText = button.textContent || '';
    }
    button.disabled = true;
    button.textContent = 'Загрузка...';
  } else {
    button.disabled = false;
    button.textContent = button.dataset.originalText || 'Загрузка...';
  }
}

async function getTasks(): Promise<void> {
  setLoading(true, DOM.getTasksButton);

  const params: RequestParams = {};

  const nameLike = DOM.nameLikeFilter?.value.trim();
  if (nameLike) params.name_like = nameLike;

  if (DOM.isImportantFilter?.checked) params.isImportant = true;
  if (DOM.isCompletedFilter?.checked) params.isCompleted = true;

  try {
    const tasks = await taskController.getTasks(params);
    renderTasks(tasks);
  } catch (error) {
    renderTasks([]);
    renderError('tasksList', `Не удалось загрузить задачи: ${error.message}`);
  } finally {
    setLoading(false, DOM.getTasksButton);
  }
}

DOM.createTaskForm.addEventListener('submit', (e) => {
  e.preventDefault();
  createTask();
});

async function createTask(): Promise<void> {
  const form = DOM.createTaskForm;
  console.log(form);
  const data: Partial<Task> = {};
  let name = '';

  new FormData(form).forEach((value, key) => {
    if (isTaskKey(key)) {
      const strValue = value.toString().trim();
      switch (key) {
        case 'name':
          name = strValue;
          data.name = strValue;
          break;
        case 'info':
          if (strValue) {
            data.info = strValue;
          }
          break;
        case 'isImportant':
        case 'isCompleted':
          data[key] = strValue === 'on';
          break;
      }
    }
  });

  if (!name) {
    renderError('createTaskResult', 'Название задачи обязательно!');
    return;
  }

  setLoading(true, form.querySelector('button') as HTMLButtonElement);

  try {
    const result = await taskController.createTask(data as CreateTask);
    renderSingleTask('createTaskResult', result);
    form.reset();
    getTasks();
  } catch (error) {
    renderError('createTaskResult', `Ошибка создания: ${error.message}`);
  } finally {
    setLoading(false, form.querySelector('button') as HTMLButtonElement);
  }
}

async function getTaskById(): Promise<void> {
  const id = DOM.taskIdSelect.value;
  if (!id || isNaN(Number(id))) {
    renderError('getTaskByIdResult', 'Выберите ID задачи');
    return;
  }

  setLoading(true, DOM.getTaskByIdButton);

  try {
    const result = await taskController.getTaskById(Number(id));
    renderSingleTask('getTaskByIdResult', result);
  } catch (error) {
    renderError('getTaskByIdResult', `Ошибка получения: ${error.message}`);
  } finally {
    setLoading(false, DOM.getTaskByIdButton);
  }
}

async function updateTask(): Promise<void> {
  const form = DOM.updateForm;
  const id = DOM.updateTaskIdSelect.value;

  if (!id || isNaN(Number(id))) {
    renderError('updateTaskResult', 'Выберите ID задачи');
    return;
  }

  const data: Partial<Task> = {};
  const formData = new FormData(form);

  // Явно обрабатываем каждое поле
  const name = formData.get('name')?.toString().trim();
  const info = formData.get('info')?.toString().trim();
  const isImportant = formData.get('isImportant') === 'on';
  const isCompleted = formData.get('isCompleted') === 'on';

  if (name !== '') data.name = name;
  if (info !== '') data.info = info;
  if (isImportant) data.isImportant = true;
  if (isCompleted) data.isCompleted = true;

  // Если нет данных для обновления
  if (Object.keys(data).length === 0) {
    renderError('updateTaskResult', 'Нет данных для обновления');
    return;
  }

  setLoading(true, form.querySelector('button') as HTMLButtonElement);

  try {
    const result = await taskController.updateTask(Number(id), data);
    renderSuccess('updateTaskResult', `Задача ID ${id} успешно обновлена`);
    renderSingleTask('updateTaskResult', result);
    getTasks();
    form.hidden = true;
    DOM.updateTaskResult.innerHTML = `Задача ID ${id} обновлена`;
  } catch (error) {
    renderError('updateTaskResult', `Ошибка обновления: ${error.message}`);
  } finally {
    setLoading(false, DOM.updateTaskButton);
  }
}

async function deleteTask(): Promise<void> {
  const id = DOM.deleteTaskIdSelect.value;
  if (!id || isNaN(Number(id))) {
    renderError('deleteTaskResult', 'Выберите ID задачи');
    return;
  }

  if (!confirm(`Вы уверены, что хотите удалить задачу ID ${id}?`)) return;

  setLoading(true, DOM.deleteTaskButton);

  try {
    const deletedTask = await taskController.deleteTask(Number(id));
    renderSuccess('deleteTaskResult', `Задача ID ${id} успешно удалена`);
    renderSingleTask('deleteTaskResult', deletedTask);
    getTasks();
    DOM.deleteTaskResult.innerHTML = `Задача ID ${id} удалена`;
  } catch (error) {
    renderError('deleteTaskResult', `Ошибка удаления: ${error.message}`);
  } finally {
    setLoading(false, DOM.deleteTaskButton);
  }
}

function autoFillUpdateForm(id: number): void {
  const task = currentTasks.find((t) => t.id === id);
  if (!task) return;

  (document.getElementById('updateName') as HTMLInputElement).value = task.name || '';
  (document.getElementById('updateInfo') as HTMLInputElement).value = task.info || '';
  (document.getElementById('updateIsImportant') as HTMLInputElement).checked = !!task.isImportant;
  (document.getElementById('updateIsCompleted') as HTMLInputElement).checked = !!task.isCompleted;
}

function clearUpdateForm(): void {
  DOM.updateForm.reset();
  DOM.updateForm.hidden = true;
  DOM.updateTaskResult.innerHTML = '';
}

document.addEventListener('DOMContentLoaded', () => {
  taskController = new TaskController();
  getTasks();

  DOM.updateTaskIdSelect?.addEventListener('change', (e) => {
    const value = (e.target as HTMLSelectElement).value;
    if (!value) {
      clearUpdateForm();
      return;
    }
    DOM.updateForm.hidden = false;
    previewTaskForAction('updateTaskIdSelect', 'updateTaskResult');
    autoFillUpdateForm(Number(value));
  });

  DOM.deleteTaskIdSelect?.addEventListener('change', () => {
    previewTaskForAction('deleteTaskIdSelect', 'deleteTaskResult');
  });

  DOM.getTasksButton?.addEventListener('click', getTasks);
});
