import { supabase, generateUuid, DEFAULT_USER_ID } from './client.js';
import { usersDb } from './usersDb.js';

export const tasksDb = {
  async getTasks({ userId = DEFAULT_USER_ID, date, isBacklog = false, isUndone = false }) {
    let query = supabase.from('tasks').select('*').eq('user_id', userId);
    if (isUndone) {
      query = query.neq('status', 'done');
    } else if (isBacklog) {
      query = query.is('scheduled_for', null);
    } else if (date) {
      query = query.eq('scheduled_for', date);
    }
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) {
      console.error('❌ Supabase getTasks Error:', error.message || error);
      throw error;
    }
    return data || [];
  },

  async createTask(taskData) {
    const userId = taskData.user_id || DEFAULT_USER_ID;
    await usersDb.ensureUserExists(userId);

    const id = generateUuid();
    const newTask = {
      id,
      user_id: userId,
      title: taskData.title,
      category: taskData.category || 'personal',
      estimated_minutes: Number(taskData.estimated_minutes) || 30,
      actual_minutes: taskData.actual_minutes ? Number(taskData.actual_minutes) : null,
      scheduled_for: taskData.scheduled_for || null,
      scheduled_time: taskData.scheduled_time || null,
      status: taskData.status || 'pending',
      priority: taskData.priority || 'medium',
      created_at: new Date().toISOString(),
      completed_at: taskData.completed_at || null
    };

    const { data, error } = await supabase.from('tasks').insert(newTask).select().maybeSingle();
    if (error) {
      console.error('❌ Supabase createTask Error:', error.message || error);
      throw error;
    }
    return data || newTask;
  },

  async updateTask(id, updates, userId) {
    const fieldsToUpdate = { ...updates };
    if (fieldsToUpdate.status === 'done' && !fieldsToUpdate.completed_at) {
      fieldsToUpdate.completed_at = new Date().toISOString();
    }

    let query = supabase.from('tasks').update(fieldsToUpdate).eq('id', id);
    if (userId) query = query.eq('user_id', userId);
    const { data, error } = await query.select().maybeSingle();
    if (error) {
      console.error('❌ Supabase updateTask Error:', error.message || error);
      throw error;
    }
    return data;
  },

  async deleteTask(id, userId) {
    let query = supabase.from('tasks').delete().eq('id', id);
    if (userId) query = query.eq('user_id', userId);
    const { data, error } = await query.select();
    if (error) {
      console.error('❌ Supabase deleteTask Error:', error.message || error);
      throw error;
    }
    if (!data || data.length === 0) return null;
    return { success: true, id };
  }
};
