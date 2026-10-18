import { supabase, generateUuid, DEFAULT_USER_ID } from './client.js';
import { usersDb } from './usersDb.js';

export const notesDb = {
  async getNotes(userId = DEFAULT_USER_ID) {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async createNote(userId, { title, content = '' }) {
    await usersDb.ensureUserExists(userId);
    const now = new Date().toISOString();
    const note = {
      id: generateUuid(),
      user_id: userId,
      title: title?.trim() || 'Untitled note',
      content,
      created_at: now,
      updated_at: now
    };

    const { data, error } = await supabase.from('notes').insert(note).select().maybeSingle();
    if (error) throw error;
    return data || note;
  },

  async updateNote(id, userId, updates) {
    const fields = {};
    if (typeof updates.title === 'string') fields.title = updates.title.trim() || 'Untitled note';
    if (typeof updates.content === 'string') fields.content = updates.content;
    fields.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('notes')
      .update(fields)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async deleteNote(id, userId) {
    const { data, error } = await supabase
      .from('notes')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
      .select();

    if (error) throw error;
    return data?.length ? { success: true, id } : null;
  }
};
