"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const API_URL = 'https://tasks-service-maks1394.amvera.io';
const BASE_CONFIG = {
    headers: {
        'Content-Type': 'application/json',
    },
};
class BaseFetchAgent {
    constructor(_apiUrl) {
        this._apiUrl = _apiUrl;
        this.fetchRequest = (endpoint_1, ...args_1) => __awaiter(this, [endpoint_1, ...args_1], void 0, function* (endpoint, config = {}, params) {
            const url = new URL(endpoint, this._apiUrl);
            if (params) {
                Object.entries(params)
                    .filter(([, v]) => v !== null && v !== undefined)
                    .forEach(([k, v]) => url.searchParams.append(k, String(v)));
            }
            const fullConfig = Object.assign(Object.assign(Object.assign({}, BASE_CONFIG), config), { headers: Object.assign(Object.assign({}, BASE_CONFIG.headers), config.headers) });
            const response = yield fetch(url.toString(), fullConfig);
            if (!response.ok) {
                let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                try {
                    const errorData = yield response.json();
                    if (typeof errorData === 'object' && errorData !== null && 'error' in errorData) {
                        const error = errorData.error;
                        if (typeof error === 'string') {
                            errorMessage = error;
                        }
                    }
                }
                catch (e) {
                }
                throw new Error(errorMessage);
            }
            const data = yield response.json();
            return data;
        });
    }
}
class RequestTaskAgent extends BaseFetchAgent {
    constructor() {
        super(API_URL);
        this.getAllTasks = (params) => {
            return this.fetchRequest('/tasks', {}, params);
        };
        this.getTask = (id) => {
            return this.fetchRequest(`/tasks/${id}`);
        };
        this.createTask = (data) => {
            return this.fetchRequest('/tasks', {
                method: 'POST',
                body: JSON.stringify(data),
            });
        };
        this.updateTask = (id, data) => {
            return this.fetchRequest(`/tasks/${id}`, {
                method: 'PATCH',
                body: JSON.stringify(data),
            });
        };
        this.deleteTask = (id) => {
            return this.fetchRequest(`/tasks/${id}`, {
                method: 'DELETE',
            });
        };
    }
}
class TaskController {
    constructor() {
        this.api = new RequestTaskAgent();
    }
    getTasks(params) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.api.getAllTasks(params);
        });
    }
    getTaskById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.api.getTask(id);
        });
    }
    createTask(data) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.api.createTask(data);
        });
    }
    updateTask(id, data) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.api.updateTask(id, data);
        });
    }
    deleteTask(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.api.deleteTask(id);
        });
    }
}
let currentTasks = [];
let taskController;
const DOM = {
    apiMethod: document.getElementById('apiMethod'),
    tasksList: document.getElementById('tasksList'),
    getTasksButton: document.querySelector('#getTasksSection button'),
    createTaskForm: document.getElementById('createTaskForm'),
    createTaskResult: document.getElementById('createTaskResult'),
    updateForm: document.getElementById('updateTaskForm'),
    updateTaskResult: document.getElementById('updateTaskResult'),
    deleteTaskResult: document.getElementById('deleteTaskResult'),
    getTaskByIdResult: document.getElementById('getTaskByIdResult'),
    taskIdSelect: document.getElementById('taskIdSelect'),
    updateTaskIdSelect: document.getElementById('updateTaskIdSelect'),
    deleteTaskIdSelect: document.getElementById('deleteTaskIdSelect'),
    createName: document.getElementById('createName'),
    createInfo: document.getElementById('createInfo'),
    createIsImportant: document.getElementById('createIsImportant'),
    createIsCompleted: document.getElementById('createIsCompleted'),
    nameLikeFilter: document.getElementById('nameLikeFilter'),
    isImportantFilter: document.getElementById('isImportantFilter'),
    isCompletedFilter: document.getElementById('isCompletedFilter'),
    getTaskByIdButton: document.getElementById('getTaskByIdButton'),
    deleteTaskButton: document.getElementById('deleteTaskButton'),
    updateTaskButton: document.getElementById('updateTaskButton'),
};
function isTaskKey(key) {
    return ['name', 'info', 'isImportant', 'isCompleted'].includes(key);
}
function renderTaskCard(task) {
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
function renderTasks(tasks) {
    currentTasks = Array.isArray(tasks) ? tasks : [];
    if (!DOM.tasksList)
        return;
    if (currentTasks.length === 0) {
        DOM.tasksList.innerHTML = '<p class="no-tasks">Задачи не найдены.</p>';
        updateTaskIdSelects([]);
        return;
    }
    DOM.tasksList.innerHTML = currentTasks.map(renderTaskCard).join('');
    updateTaskIdSelects(currentTasks);
}
function updateTaskIdSelects(tasks) {
    const ids = tasks.map((t) => t.id);
    const selects = [DOM.taskIdSelect, DOM.updateTaskIdSelect, DOM.deleteTaskIdSelect].filter(Boolean);
    selects.forEach((select) => {
        const currentVal = select.value;
        select.innerHTML = '';
        select.disabled = true;
        if (ids.length === 0) {
            select.add(new Option('— Задачи отсутствуют —', ''));
        }
        else {
            select.add(new Option('— Выберите ID —', ''));
            ids.forEach((id) => select.add(new Option(`ID ${id}`, String(id))));
            select.disabled = false;
            if (ids.includes(Number(currentVal)))
                select.value = currentVal;
        }
    });
}
function renderSingleTask(containerId, task) {
    const container = document.getElementById(containerId);
    if (container)
        container.innerHTML = renderTaskCard(task);
}
function renderError(containerId, message) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = `<p class="error-message">${message}</p>`;
    }
}
function renderSuccess(containerId, message) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = `<p class="success-message">${message}</p>`;
    }
}
function previewTaskForAction(selectId, containerId) {
    return __awaiter(this, void 0, void 0, function* () {
        const select = document.getElementById(selectId);
        const container = document.getElementById(containerId);
        if (!select || !container)
            return;
        const id = Number(select.value);
        container.innerHTML = '';
        if (!id)
            return;
        const task = currentTasks.find((t) => t.id === id);
        if (task) {
            renderSingleTask(containerId, task);
        }
        else {
            try {
                const fetchedTask = yield taskController.getTaskById(id);
                renderSingleTask(containerId, fetchedTask);
            }
            catch (error) {
                renderError(containerId, `Не удалось загрузить задачу: ${error.message}`);
            }
        }
    });
}
function setLoading(isLoading, button) {
    if (!button)
        return;
    if (isLoading) {
        if (!button.dataset.originalText) {
            button.dataset.originalText = button.textContent || '';
        }
        button.disabled = true;
        button.textContent = 'Загрузка...';
    }
    else {
        button.disabled = false;
        button.textContent = button.dataset.originalText || 'Загрузка...';
    }
}
function getTasks() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c;
        setLoading(true, DOM.getTasksButton);
        const params = {};
        const nameLike = (_a = DOM.nameLikeFilter) === null || _a === void 0 ? void 0 : _a.value.trim();
        if (nameLike)
            params.name_like = nameLike;
        if ((_b = DOM.isImportantFilter) === null || _b === void 0 ? void 0 : _b.checked)
            params.isImportant = true;
        if ((_c = DOM.isCompletedFilter) === null || _c === void 0 ? void 0 : _c.checked)
            params.isCompleted = true;
        try {
            const tasks = yield taskController.getTasks(params);
            renderTasks(tasks);
        }
        catch (error) {
            renderTasks([]);
            renderError('tasksList', `Не удалось загрузить задачи: ${error.message}`);
        }
        finally {
            setLoading(false, DOM.getTasksButton);
        }
    });
}
DOM.createTaskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    createTask();
});
function createTask() {
    return __awaiter(this, void 0, void 0, function* () {
        const form = DOM.createTaskForm;
        console.log(form);
        const data = {};
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
        setLoading(true, form.querySelector('button'));
        try {
            const result = yield taskController.createTask(data);
            renderSingleTask('createTaskResult', result);
            form.reset();
            getTasks();
        }
        catch (error) {
            renderError('createTaskResult', `Ошибка создания: ${error.message}`);
        }
        finally {
            setLoading(false, form.querySelector('button'));
        }
    });
}
function getTaskById() {
    return __awaiter(this, void 0, void 0, function* () {
        const id = DOM.taskIdSelect.value;
        if (!id || isNaN(Number(id))) {
            renderError('getTaskByIdResult', 'Выберите ID задачи');
            return;
        }
        setLoading(true, DOM.getTaskByIdButton);
        try {
            const result = yield taskController.getTaskById(Number(id));
            renderSingleTask('getTaskByIdResult', result);
        }
        catch (error) {
            renderError('getTaskByIdResult', `Ошибка получения: ${error.message}`);
        }
        finally {
            setLoading(false, DOM.getTaskByIdButton);
        }
    });
}
function updateTask() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const form = DOM.updateForm;
        const id = DOM.updateTaskIdSelect.value;
        if (!id || isNaN(Number(id))) {
            renderError('updateTaskResult', 'Выберите ID задачи');
            return;
        }
        const data = {};
        const formData = new FormData(form);
        const name = (_a = formData.get('name')) === null || _a === void 0 ? void 0 : _a.toString().trim();
        const info = (_b = formData.get('info')) === null || _b === void 0 ? void 0 : _b.toString().trim();
        const isImportant = formData.get('isImportant') === 'on';
        const isCompleted = formData.get('isCompleted') === 'on';
        if (name !== '')
            data.name = name;
        if (info !== '')
            data.info = info;
        if (isImportant)
            data.isImportant = true;
        if (isCompleted)
            data.isCompleted = true;
        if (Object.keys(data).length === 0) {
            renderError('updateTaskResult', 'Нет данных для обновления');
            return;
        }
        setLoading(true, form.querySelector('button'));
        try {
            const result = yield taskController.updateTask(Number(id), data);
            renderSuccess('updateTaskResult', `Задача ID ${id} успешно обновлена`);
            renderSingleTask('updateTaskResult', result);
            getTasks();
            form.hidden = true;
            DOM.updateTaskResult.innerHTML = `Задача ID ${id} обновлена`;
        }
        catch (error) {
            renderError('updateTaskResult', `Ошибка обновления: ${error.message}`);
        }
        finally {
            setLoading(false, DOM.updateTaskButton);
        }
    });
}
function deleteTask() {
    return __awaiter(this, void 0, void 0, function* () {
        const id = DOM.deleteTaskIdSelect.value;
        if (!id || isNaN(Number(id))) {
            renderError('deleteTaskResult', 'Выберите ID задачи');
            return;
        }
        if (!confirm(`Вы уверены, что хотите удалить задачу ID ${id}?`))
            return;
        setLoading(true, DOM.deleteTaskButton);
        try {
            const deletedTask = yield taskController.deleteTask(Number(id));
            renderSuccess('deleteTaskResult', `Задача ID ${id} успешно удалена`);
            renderSingleTask('deleteTaskResult', deletedTask);
            getTasks();
            DOM.deleteTaskResult.innerHTML = `Задача ID ${id} удалена`;
        }
        catch (error) {
            renderError('deleteTaskResult', `Ошибка удаления: ${error.message}`);
        }
        finally {
            setLoading(false, DOM.deleteTaskButton);
        }
    });
}
function autoFillUpdateForm(id) {
    const task = currentTasks.find((t) => t.id === id);
    if (!task)
        return;
    document.getElementById('updateName').value = task.name || '';
    document.getElementById('updateInfo').value = task.info || '';
    document.getElementById('updateIsImportant').checked = !!task.isImportant;
    document.getElementById('updateIsCompleted').checked = !!task.isCompleted;
}
function clearUpdateForm() {
    DOM.updateForm.reset();
    DOM.updateForm.hidden = true;
    DOM.updateTaskResult.innerHTML = '';
}
document.addEventListener('DOMContentLoaded', () => {
    var _a, _b, _c;
    taskController = new TaskController();
    getTasks();
    (_a = DOM.updateTaskIdSelect) === null || _a === void 0 ? void 0 : _a.addEventListener('change', (e) => {
        const value = e.target.value;
        if (!value) {
            clearUpdateForm();
            return;
        }
        DOM.updateForm.hidden = false;
        previewTaskForAction('updateTaskIdSelect', 'updateTaskResult');
        autoFillUpdateForm(Number(value));
    });
    (_b = DOM.deleteTaskIdSelect) === null || _b === void 0 ? void 0 : _b.addEventListener('change', () => {
        previewTaskForAction('deleteTaskIdSelect', 'deleteTaskResult');
    });
    (_c = DOM.getTasksButton) === null || _c === void 0 ? void 0 : _c.addEventListener('click', getTasks);
});
console.log('Домашка');
//# sourceMappingURL=index.js.map