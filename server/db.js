import path from 'path';
import fileSystem from 'fs';

// Native .env parser if dotenv is not loaded
function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fileSystem.existsSync(envPath)) {
    const lines = fileSystem.readFileSync(envPath, 'utf8').split('\n');
    lines.forEach(line => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || '';
        if (value.length > 0 && value.charAt(0) === '"' && value.charAt(value.length - 1) === '"') {
          value = value.replace(/\\n/g, '\n');
        }
        value = value.replace(/(^['"]|['"]$)/g, '').trim();
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    });
  }
}

loadEnv();

const { SUPABASE_URL, SUPABASE_KEY, DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000001' } = process.env;

let supabase = null;
const mode = 'supabase';

// In-Memory Supabase Client for environment/testing when remote credentials are not provided
function createInMemorySupabaseClient() {
  const memoryDb = {
    users: [{ id: DEFAULT_USER_ID, email: 'user@dailyos.local', timezone: 'UTC', created_at: new Date().toISOString() }],
    tasks: [],
    events: [],
    daily_logs: [],
    patterns: [],
    goals: []
  };

  return {
    from(tableName) {
      if (!memoryDb[tableName]) memoryDb[tableName] = [];
      const table = memoryDb[tableName];

      let filterFns = [];
      let pendingInsert = null;
      let pendingUpdate = null;
      let isDelete = false;

      const runQuery = () => {
        let rows = [...table];
        for (const fn of filterFns) {
          rows = rows.filter(fn);
        }
        return rows;
      };

      const chain = {
        select() {
          return chain;
        },
        eq(col, val) {
          filterFns.push(r => r[col] === val);
          return chain;
        },
        neq(col, val) {
          filterFns.push(r => r[col] !== val);
          return chain;
        },
        gte(col, val) {
          filterFns.push(r => r[col] >= val);
          return chain;
        },
        lte(col, val) {
          filterFns.push(r => r[col] <= val);
          return chain;
        },
        is(col, val) {
          filterFns.push(r => (val === null ? (!r[col] || r[col] === '') : r[col] === val));
          return chain;
        },
        order(col, { ascending = true } = {}) {
          return chain;
        },
        limit(num) {
          return chain;
        },
        insert(newRow) {
          if (tableName === 'users' && newRow.email) {
            const exists = table.some(u => u.email && u.email.toLowerCase() === newRow.email.toLowerCase());
            if (exists) {
              pendingInsert = { error: new Error('User with this email already exists'), data: null };
              return chain;
            }
          }
          table.push(newRow);
          pendingInsert = { data: newRow, error: null };
          return chain;
        },
        update(updates) {
          pendingUpdate = updates;
          return chain;
        },
        delete() {
          isDelete = true;
          return chain;
        },
        upsert(row, { onConflict } = {}) {
          if (onConflict === 'user_id,log_date') {
            const idx = table.findIndex(r => r.user_id === row.user_id && r.log_date === row.log_date);
            if (idx !== -1) {
              table[idx] = { ...table[idx], ...row };
              pendingInsert = { data: table[idx], error: null };
              return chain;
            }
          }
          table.push(row);
          pendingInsert = { data: row, error: null };
          return chain;
        },
        async maybeSingle() {
          if (pendingInsert) return pendingInsert;
          const rows = runQuery();
          if (pendingUpdate && rows.length > 0) {
            Object.assign(rows[0], pendingUpdate);
            return { data: rows[0], error: null };
          }
          return { data: rows[0] || null, error: null };
        },
        async single() {
          if (pendingInsert) return pendingInsert;
          const rows = runQuery();
          if (pendingUpdate && rows.length > 0) {
            Object.assign(rows[0], pendingUpdate);
            return { data: rows[0], error: null };
          }
          return { data: rows[0] || null, error: rows[0] ? null : new Error('Not found') };
        },
        then(resolve) {
          if (isDelete) {
            const matches = runQuery();
            matches.forEach(item => {
              const idx = table.indexOf(item);
              if (idx !== -1) table.splice(idx, 1);
            });
            resolve({ data: matches, error: null });
            return;
          }
          if (pendingInsert) {
            resolve(pendingInsert);
            return;
          }
          const rows = runQuery();
          resolve({ data: rows, error: null });
        }
      };

      return chain;
    }
  };
}

if (SUPABASE_URL && SUPABASE_KEY) {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    console.log('✅ Connected to Supabase PostgreSQL Database');
  } catch (err) {
    console.warn('⚠️ Could not load @supabase/supabase-js, initializing in-memory Supabase client');
    supabase = createInMemorySupabaseClient();
  }
} else {
  console.log('ℹ️ SUPABASE_URL / SUPABASE_KEY not set. Using in-memory Supabase client');
  supabase = createInMemorySupabaseClient();
}

// Helper UUID generator
function generateUuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export const dbEngine = {
  mode,
  defaultUserId: DEFAULT_USER_ID,

  async ensureDefaultUser() {
    const { data } = await supabase.from('users').select('*').eq('id', DEFAULT_USER_ID).maybeSingle();
    if (!data) {
      await supabase.from('users').insert({
        id: DEFAULT_USER_ID,
        email: 'user@dailyos.local',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
      });
    }
  },

  async createUser({ email, password_hash }) {
    const id = generateUuid();
    const newUser = {
      id,
      email: email.toLowerCase().trim(),
      password_hash,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase.from('users').insert(newUser).select().single();
    if (error) {
      if (error.code === '23505' || error.message?.includes('already exists')) {
        throw new Error('User with this email already exists');
      }
      throw error;
    }
    return data;
  },

  async findUserByEmail(email) {
    const { data } = await supabase.from('users').select('*').eq('email', email.toLowerCase().trim()).maybeSingle();
    return data;
  },

  async findUserById(id) {
    const { data } = await supabase.from('users').select('*').eq('id', id).maybeSingle();
    return data;
  },

  async updateUserOtp(userId, { otpCode, otpExpiresAt, attempts = 0 }) {
    const updates = {
      otp_code: otpCode,
      otp_expires_at: otpExpiresAt,
      otp_attempts: attempts
    };
    const { data } = await supabase.from('users').update(updates).eq('id', userId).select().maybeSingle();
    return data;
  },

  // TASKS
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
    if (error) throw error;
    return data || [];
  },

  async createTask(taskData) {
    const id = generateUuid();
    const newTask = {
      id,
      user_id: taskData.user_id || DEFAULT_USER_ID,
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

    const { data, error } = await supabase.from('tasks').insert(newTask).select().single();
    if (error) throw error;
    return data;
  },

  async updateTask(id, updates, userId) {
    const fieldsToUpdate = { ...updates };
    if (fieldsToUpdate.status === 'done' && !fieldsToUpdate.completed_at) {
      fieldsToUpdate.completed_at = new Date().toISOString();
    }

    let query = supabase.from('tasks').update(fieldsToUpdate).eq('id', id);
    if (userId) query = query.eq('user_id', userId);
    const { data, error } = await query.select().maybeSingle();
    if (error) throw error;
    return data;
  },

  async deleteTask(id, userId) {
    let query = supabase.from('tasks').delete().eq('id', id);
    if (userId) query = query.eq('user_id', userId);
    const { data, error } = await query;
    if (error) throw error;
    if (!data || data.length === 0) return null;
    return { success: true, id };
  },

  // EVENTS
  async getEvents({ userId = DEFAULT_USER_ID, from, to }) {
    let query = supabase.from('events').select('*').eq('user_id', userId);
    if (from) query = query.gte('event_date', from);
    if (to) query = query.lte('event_date', to);
    const { data, error } = await query.order('event_date', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async createEvent(eventData) {
    const id = generateUuid();
    const newEvent = {
      id,
      user_id: eventData.user_id || DEFAULT_USER_ID,
      title: eventData.title,
      event_date: eventData.event_date,
      event_time: eventData.event_time || null,
      category: eventData.category || 'general',
      notes: eventData.notes || null,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase.from('events').insert(newEvent).select().single();
    if (error) throw error;
    return data;
  },

  async deleteEvent(id, userId) {
    let query = supabase.from('events').delete().eq('id', id);
    if (userId) query = query.eq('user_id', userId);
    const { data, error } = await query;
    if (error) throw error;
    if (!data || data.length === 0) return null;
    return { success: true, id };
  },

  // DAILY LOGS
  async getDailyLog(userId, logDate) {
    const { data } = await supabase.from('daily_logs').select('*').eq('user_id', userId).eq('log_date', logDate).maybeSingle();
    return data;
  },

  async upsertDailyLog(userId, logDate, logData) {
    const { data, error } = await supabase
      .from('daily_logs')
      .upsert({ user_id: userId, log_date: logDate, ...logData }, { onConflict: 'user_id,log_date' })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // PATTERNS
  async getLatestPattern(userId = DEFAULT_USER_ID) {
    const { data } = await supabase.from('patterns').select('*').eq('user_id', userId).order('computed_at', { ascending: false }).limit(1).maybeSingle();
    return data;
  },

  async upsertPattern(userId = DEFAULT_USER_ID, patternData) {
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

    const { data, error } = await supabase.from('patterns').insert(payload).select().single();
    if (error) throw error;
    return data;
  },

  async getTasksForPatternComputation(userId = DEFAULT_USER_ID, daysBack = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);
    const dateStr = startDate.toISOString().split('T')[0];

    const { data, error } = await supabase.from('tasks').select('*').eq('user_id', userId).gte('scheduled_for', dateStr);
    if (error) throw error;
    return data || [];
  },

  // GOALS
  async getGoals({ userId = DEFAULT_USER_ID, periodType, periodKey }) {
    let query = supabase.from('goals').select('*').eq('user_id', userId);
    if (periodType) query = query.eq('period_type', periodType);
    if (periodKey) query = query.eq('period_key', periodKey);
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async createGoal(goalData) {
    const id = generateUuid();
    const newGoal = {
      id,
      user_id: goalData.user_id || DEFAULT_USER_ID,
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

    const { data, error } = await supabase.from('goals').insert(newGoal).select().single();
    if (error) throw error;
    return data;
  },

  async updateGoal(id, updates, userId) {
    const fieldsToUpdate = { ...updates };
    if (fieldsToUpdate.status === 'completed' && !fieldsToUpdate.completed_at) {
      fieldsToUpdate.completed_at = new Date().toISOString();
    }

    let query = supabase.from('goals').update(fieldsToUpdate).eq('id', id);
    if (userId) query = query.eq('user_id', userId);
    const { data, error } = await query.select().maybeSingle();
    if (error) throw error;
    return data;
  },

  async deleteGoal(id, userId) {
    let query = supabase.from('goals').delete().eq('id', id);
    if (userId) query = query.eq('user_id', userId);
    const { data, error } = await query.select();
    if (error) throw error;
    if (!data || data.length === 0) return null;
    return { success: true, id };
  }
};
