import { supabase, generateUuid, DEFAULT_USER_ID } from './client.js';
import { usersDb } from './usersDb.js';

export const eventsDb = {
  async getEvents({ userId = DEFAULT_USER_ID, from, to }) {
    let query = supabase.from('events').select('*').eq('user_id', userId);
    if (from) query = query.gte('event_date', from);
    if (to) query = query.lte('event_date', to);
    const { data, error } = await query.order('event_date', { ascending: true });
    if (error) {
      console.error('❌ Supabase getEvents Error:', error.message || error);
      throw error;
    }
    return data || [];
  },

  async createEvent(eventData) {
    const userId = eventData.user_id || DEFAULT_USER_ID;
    await usersDb.ensureUserExists(userId);

    const id = generateUuid();
    const newEvent = {
      id,
      user_id: userId,
      title: eventData.title,
      event_date: eventData.event_date,
      event_time: eventData.event_time || null,
      category: eventData.category || 'general',
      notes: eventData.notes || null,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase.from('events').insert(newEvent).select().maybeSingle();
    if (error) {
      console.error('❌ Supabase createEvent Error:', error.message || error);
      throw error;
    }
    return data || newEvent;
  },

  async deleteEvent(id, userId) {
    let query = supabase.from('events').delete().eq('id', id);
    if (userId) query = query.eq('user_id', userId);
    const { data, error } = await query.select();
    if (error) {
      console.error('❌ Supabase deleteEvent Error:', error.message || error);
      throw error;
    }
    if (!data || data.length === 0) return null;
    return { success: true, id };
  }
};
