import { supabase } from './client.js';
import { usersDb } from './usersDb.js';

export const dailyLogsDb = {
  async getDailyLog(userId, logDate) {
    const { data, error } = await supabase.from('daily_logs').select('*').eq('user_id', userId).eq('log_date', logDate).maybeSingle();
    if (error) console.error('❌ Supabase getDailyLog Error:', error.message || error);
    return data;
  },

  async upsertDailyLog(userId, logDate, logData) {
    await usersDb.ensureUserExists(userId);
    const { data, error } = await supabase
      .from('daily_logs')
      .upsert({ user_id: userId, log_date: logDate, ...logData }, { onConflict: 'user_id,log_date' })
      .select()
      .maybeSingle();
    if (error) {
      console.error('❌ Supabase upsertDailyLog Error:', error.message || error);
      throw error;
    }
    return data;
  }
};
