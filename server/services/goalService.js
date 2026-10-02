import { goalsDb } from '../db/goalsDb.js';

export const goalService = {
  async getGoals({ userId, periodType, periodKey }) {
    return await goalsDb.getGoals({ userId, periodType, periodKey });
  },

  async createGoal(userId, goalData) {
    if (!goalData || !goalData.title) {
      throw { status: 400, message: 'Goal title is required.' };
    }
    return await goalsDb.createGoal({
      ...goalData,
      user_id: userId
    });
  },

  async updateGoal(goalId, updates, userId) {
    const updated = await goalsDb.updateGoal(goalId, updates, userId);
    if (!updated) {
      throw { status: 404, message: 'Goal not found or unauthorized' };
    }
    return updated;
  },

  async deleteGoal(goalId, userId) {
    const result = await goalsDb.deleteGoal(goalId, userId);
    if (!result) {
      throw { status: 404, message: 'Goal not found or unauthorized' };
    }
    return result;
  }
};
