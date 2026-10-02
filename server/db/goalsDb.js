import { supabase, generateUuid, DEFAULT_USER_ID } from './client.js';
import { usersDb } from './usersDb.js';

export const goalsDb = {
  async getGoals({ userId = DEFAULT_USER_ID, periodType, periodKey }) {
    let query = supabase.from('goals').select('*').eq('user_id', userId);
    if (periodType) query = query.eq('period_type', periodType);
    if (periodKey) query = query.eq('period_key', periodKey);
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) {
      console.error('❌ Supabase getGoals Error:', error.message || error);
      throw error;
    }
    return data || [];
  },

  async createGoal(goalData) {
    const userId = goalData.user_id || DEFAULT_USER_ID;
    await usersDb.ensureUserExists(userId);

    const id = generateUuid();
    const newGoal = {
      id,
      user_id: userId,
      title: goalData.title,
      period_type: goalData.period_type || 'daily',
      period_key: goalData.period_key,
      target_value: Number(goalData.target_value) || 1,
      current_value: Number(goalData.current_value) || 0,
      category: goalData.category || 'general',
      status: goalData.status || 'pending',
      created_at: new Date().toISOString(),
      completed_at: goalData.completed_at || null
    };

    const { data, error } = await supabase.from('goals').insert(newGoal).select().maybeSingle();
    if (error) {
      console.error('❌ Supabase createGoal Error:', error.message || error);
      throw error;
    }
    return data || newGoal;
  },

  async updateGoal(id, updates, userId) {
    const fieldsToUpdate = { ...updates };
    if (fieldsToUpdate.status === 'completed' && !fieldsToUpdate.completed_at) {
      fieldsToUpdate.completed_at = new Date().toISOString();
    }

    let query = supabase.from('goals').update(fieldsToUpdate).eq('id', id);
    if (userId) query = query.eq('user_id', userId);
    const { data, error } = await query.select().maybeSingle();
    if (error) {
      console.error('❌ Supabase updateGoal Error:', error.message || error);
      throw error;
    }
    return data;
  },

  async deleteGoal(id, userId) {
    let query = supabase.from('goals').delete().eq('id', id);
    if (userId) query = query.eq('user_id', userId);
    const { data, error } = await query.select();
    if (error) {
      console.error('❌ Supabase deleteGoal Error:', error.message || error);
      throw error;
    }
    if (!data || data.length === 0) return null;
    return { success: true, id };
  }
};
