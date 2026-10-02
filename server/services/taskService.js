import { tasksDb } from '../db/tasksDb.js';

export const taskService = {
  async getTasks({ userId, date, backlog, undone }) {
    return await tasksDb.getTasks({
      userId,
      date,
      isBacklog: backlog === 'true' || backlog === true,
      isUndone: undone === 'true' || undone === true
    });
  },

  async createTask(userId, taskData) {
    if (!taskData || !taskData.title) {
      throw { status: 400, message: 'Task title is required.' };
    }
    return await tasksDb.createTask({
      ...taskData,
      user_id: userId
    });
  },

  async updateTask(taskId, updates, userId) {
    const updated = await tasksDb.updateTask(taskId, updates, userId);
    if (!updated) {
      throw { status: 404, message: 'Task not found or unauthorized' };
    }
    return updated;
  },

  async deleteTask(taskId, userId) {
    const result = await tasksDb.deleteTask(taskId, userId);
    if (!result) {
      throw { status: 404, message: 'Task not found or unauthorized' };
    }
    return result;
  }
};
