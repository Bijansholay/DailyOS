import { supabase, generateUuid, DEFAULT_USER_ID } from './client.js';
import { usersDb } from './usersDb.js';

export const patternsDb = {
  async getLatestPattern(userId = DEFAULT_USER_ID) {
    const { data, error } = await supabase.from('patterns').select('*').eq('user_id', userId).order('computed_at', { ascending: false }).limit(1).maybeSingle();
    if (error) console.error('❌ Supabase getLatestPattern Error:', error.message || error);
    return data;
  },

  async upsertPattern(userId = DEFAULT_USER_ID, patternData) {
    await usersDb.ensureUserExists(userId);
    const id = generateUuid();
    const computedAt = new Date().toISOString();
    const payload = {
      id,
      user_id: userId,
      computed_at: computedAt,
      most_productive_hours: patternData.most_productive_hours,
      worst_category: patternData.worst_category || null,
      avg_completion_ratio: patternData.avg_completion_ratio || 1.0,
      skip_streak_flags: patternData.skip_streak_flags,
      created_at: computedAt
    };

    const { data, error } = await supabase.from('patterns').insert(payload).select().maybeSingle();
    if (error) {
      console.error('❌ Supabase upsertPattern Error:', error.message || error);
      throw error;
    }
    return data || payload;
  },

  async getTasksForPatternComputation(userId = DEFAULT_USER_ID, daysBack = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);
    const dateStr = startDate.toISOString().split('T')[0];

    const { data, error } = await supabase.from('tasks').select('*').eq('user_id', userId).gte('scheduled_for', dateStr);
    if (error) {
      console.error('❌ Supabase getTasksForPatternComputation Error:', error.message || error);
      throw error;
    }
    return data || [];
  }
};
