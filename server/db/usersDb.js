import { supabase, DEFAULT_USER_ID } from './client.js';

export const usersDb = {
  async ensureDefaultUser() {
    await this.ensureUserExists(DEFAULT_USER_ID, 'user@dailyos.local');
  },

  async ensureUserExists(userId, email = null) {
    if (!userId) return;
    try {
      const { data } = await supabase.from('users').select('id').eq('id', userId).maybeSingle();
      if (!data) {
        const newUser = {
          id: userId,
          email: (email || `${userId}@dailyos.local`).toLowerCase().trim(),
          created_at: new Date().toISOString()
        };
        await supabase.from('users').insert(newUser).maybeSingle();
      }
    } catch (e) {
      // Ignore user creation conflict
    }
  },

  async createUser({ id, email, password_hash }) {
    const userId = id || `user_${Date.now()}`;
    const newUser = {
      id: userId,
      email: (email || '').toLowerCase().trim(),
      created_at: new Date().toISOString()
    };
    if (password_hash) newUser.password_hash = password_hash;

    const { data, error } = await supabase.from('users').insert(newUser).select().maybeSingle();
    if (error && !error.message?.includes('already exists')) {
      if (error.message?.includes('password_hash')) {
        delete newUser.password_hash;
        const retry = await supabase.from('users').insert(newUser).select().maybeSingle();
        return retry.data || newUser;
      }
      console.error('❌ Supabase createUser Error:', error.message || error);
      throw error;
    }
    return data || newUser;
  },

  async findUserByEmail(email) {
    if (!email) return null;
    const { data, error } = await supabase.from('users').select('*').eq('email', email.toLowerCase().trim()).maybeSingle();
    if (error) console.error('❌ Supabase findUserByEmail Error:', error.message || error);
    return data;
  },

  async findUserById(id) {
    if (!id) return null;
    const { data, error } = await supabase.from('users').select('*').eq('id', id).maybeSingle();
    if (error) console.error('❌ Supabase findUserById Error:', error.message || error);
    return data;
  }
};
