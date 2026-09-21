import path from 'path';
import fileSystem from 'fs';

// Nativ .env parser if dotenv is not loaded
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
let mode = 'json'; // json | supabase

if (SUPABASE_URL && SUPABASE_KEY) {
  try {
    // Dynamic import if supabase is available
    const { createClient } = await import('@supabase/supabase-js');
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    mode = 'supabase';
    console.log('✅ Connected to Supabase PostgreSQL Database');
  } catch (err) {
    console.warn('⚠️ Supabase client not loaded, using local JSON storage engine');
  }
}

// Local JSON File DB Storage Engine (Zero External Dependencies)
const dataDir = path.resolve(process.cwd(), 'data');
if (!fileSystem.existsSync(dataDir)) {
  fileSystem.mkdirSync(dataDir, { recursive: true });
}
const jsonDbPath = path.join(dataDir, 'db.json');

function loadJsonDb() {
  if (!fileSystem.existsSync(jsonDbPath)) {
    const initialData = {
      users: [{ id: DEFAULT_USER_ID, email: 'user@dailyos.local', timezone: 'UTC', created_at: new Date().toISOString() }],
      tasks: [],
      events: [],
      daily_logs: [],
      patterns: []
    };
    fileSystem.writeFileSync(jsonDbPath, JSON.stringify(initialData, null, 2));
    return initialData;
  }
  try {
    const content = fileSystem.readFileSync(jsonDbPath, 'utf8');
    return JSON.parse(content);
  } catch (e) {
    return { users: [], tasks: [], events: [], daily_logs: [], patterns: [] };
  }
}

function saveJsonDb(data) {
  fileSystem.writeFileSync(jsonDbPath, JSON.stringify(data, null, 2));
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
    if (mode === 'supabase' && supabase) {
      const { data } = await supabase.from('users').select('*').eq('id', DEFAULT_USER_ID).maybeSingle();
      if (!data) {
        await supabase.from('users').insert({
          id: DEFAULT_USER_ID,
          email: 'user@dailyos.local',
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
        });
      }
    } else {
      const db = loadJsonDb();
      const user = db.users.find(u => u.id === DEFAULT_USER_ID);
      if (!user) {
        db.users.push({
          id: DEFAULT_USER_ID,
          email: 'user@dailyos.local',
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
          created_at: new Date().toISOString()
        });
        saveJsonDb(db);
      }
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

    if (mode === 'supabase' && supabase) {
      const { data, error } = await supabase.from('users').insert(newUser).select().single();
      if (error) throw error;
      return data;
    } else {
      const db = loadJsonDb();
      if (!db.users) db.users = [];
      const existing = db.users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
      if (existing) {
        throw new Error('User with this email already exists');
      }
      db.users.push(newUser);
      saveJsonDb(db);
      return newUser;
    }
  },

  async findUserByEmail(email) {
    if (mode === 'supabase' && supabase) {
      const { data } = await supabase.from('users').select('*').eq('email', email.toLowerCase().trim()).maybeSingle();
      return data;
    } else {
      const db = loadJsonDb();
      if (!db.users) return null;
      return db.users.find(u => u.email && u.email.toLowerCase() === email.toLowerCase().trim()) || null;
    }
  },

  async findUserById(id) {
    if (mode === 'supabase' && supabase) {
      const { data } = await supabase.from('users').select('*').eq('id', id).maybeSingle();
      return data;
    } else {
      const db = loadJsonDb();
      if (!db.users) return null;
      return db.users.find(u => u.id === id) || null;
    }
  },

  // TASKS
  async getTasks({ userId = DEFAULT_USER_ID, date, isBacklog = false, isUndone = false }) {
    if (mode === 'supabase' && supabase) {
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
    } else {
      const db = loadJsonDb();
      let res = db.tasks.filter(t => t.user_id === userId);
      if (isUndone) {
        res = res.filter(t => t.status !== 'done');
      } else if (isBacklog) {
        res = res.filter(t => !t.scheduled_for || t.scheduled_for === '');
      } else if (date) {
        res = res.filter(t => t.scheduled_for === date);
      }
      return res.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
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

    if (mode === 'supabase' && supabase) {
      const { data, error } = await supabase.from('tasks').insert(newTask).select().single();
      if (error) throw error;
      return data;
    } else {
      const db = loadJsonDb();
      db.tasks.push(newTask);
      saveJsonDb(db);
      return newTask;
    }
  },

  async updateTask(id, updates, userId) {
    const fieldsToUpdate = { ...updates };
    if (fieldsToUpdate.status === 'done' && !fieldsToUpdate.completed_at) {
      fieldsToUpdate.completed_at = new Date().toISOString();
    }

    if (mode === 'supabase' && supabase) {
      let query = supabase.from('tasks').update(fieldsToUpdate).eq('id', id);
      if (userId) query = query.eq('user_id', userId);
      const { data, error } = await query.select().maybeSingle();
      if (error) throw error;
      return data;
    } else {
      const db = loadJsonDb();
      const idx = db.tasks.findIndex(t => t.id === id && (!userId || t.user_id === userId));
      if (idx !== -1) {
        db.tasks[idx] = { ...db.tasks[idx], ...fieldsToUpdate };
        saveJsonDb(db);
        return db.tasks[idx];
      }
      return null;
    }
  },

  async deleteTask(id, userId) {
    if (mode === 'supabase' && supabase) {
      let query = supabase.from('tasks').delete().eq('id', id);
      if (userId) query = query.eq('user_id', userId);
      const { error } = await query;
      if (error) throw error;
      return { success: true, id };
    } else {
      const db = loadJsonDb();
      const exists = db.tasks.some(t => t.id === id && (!userId || t.user_id === userId));
      if (!exists) return null;
      db.tasks = db.tasks.filter(t => !(t.id === id && (!userId || t.user_id === userId)));
      saveJsonDb(db);
      return { success: true, id };
    }
  },

  // EVENTS
  async getEvents({ userId = DEFAULT_USER_ID, from, to }) {
    if (mode === 'supabase' && supabase) {
      let query = supabase.from('events').select('*').eq('user_id', userId);
      if (from) query = query.gte('event_date', from);
      if (to) query = query.lte('event_date', to);
      const { data, error } = await query.order('event_date', { ascending: true });
      if (error) throw error;
      return data || [];
    } else {
      const db = loadJsonDb();
      let res = db.events.filter(e => e.user_id === userId);
      if (from) res = res.filter(e => e.event_date >= from);
      if (to) res = res.filter(e => e.event_date <= to);
      return res.sort((a, b) => (a.event_date + (a.event_time || '')).localeCompare(b.event_date + (b.event_time || '')));
    }
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

    if (mode === 'supabase' && supabase) {
      const { data, error } = await supabase.from('events').insert(newEvent).select().single();
      if (error) throw error;
      return data;
    } else {
      const db = loadJsonDb();
      db.events.push(newEvent);
      saveJsonDb(db);
      return newEvent;
    }
  },

  async deleteEvent(id, userId) {
    if (mode === 'supabase' && supabase) {
      let query = supabase.from('events').delete().eq('id', id);
      if (userId) query = query.eq('user_id', userId);
      const { error } = await query;
      if (error) throw error;
      return { success: true, id };
    } else {
      const db = loadJsonDb();
      const exists = db.events.some(e => e.id === id && (!userId || e.user_id === userId));
      if (!exists) return null;
      db.events = db.events.filter(e => !(e.id === id && (!userId || e.user_id === userId)));
      saveJsonDb(db);
      return { success: true, id };
    }
  },

  // DAILY LOGS
  async getDailyLog(userId, logDate) {
    if (mode === 'supabase' && supabase) {
      const { data } = await supabase.from('daily_logs').select('*').eq('user_id', userId).eq('log_date', logDate).maybeSingle();
      return data;
    } else {
      const db = loadJsonDb();
      return db.daily_logs.find(l => l.user_id === userId && l.log_date === logDate) || null;
    }
  },

  async upsertDailyLog(userId, logDate, logData) {
    if (mode === 'supabase' && supabase) {
      const { data, error } = await supabase
        .from('daily_logs')
        .upsert({ user_id: userId, log_date: logDate, ...logData }, { onConflict: 'user_id,log_date' })
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const db = loadJsonDb();
      const idx = db.daily_logs.findIndex(l => l.user_id === userId && l.log_date === logDate);
      if (idx !== -1) {
        db.daily_logs[idx] = { ...db.daily_logs[idx], ...logData };
      } else {
        const id = generateUuid();
        db.daily_logs.push({
          id,
          user_id: userId,
          log_date: logDate,
          tasks_completed: logData.tasks_completed || 0,
          tasks_skipped: logData.tasks_skipped || 0,
          tasks_late: logData.tasks_late || 0,
          mood_note: logData.mood_note || null,
          ai_summary: logData.ai_summary || null,
          created_at: new Date().toISOString()
        });
      }
      saveJsonDb(db);
      return this.getDailyLog(userId, logDate);
    }
  },

  // PATTERNS
  async getLatestPattern(userId = DEFAULT_USER_ID) {
    if (mode === 'supabase' && supabase) {
      const { data } = await supabase.from('patterns').select('*').eq('user_id', userId).order('computed_at', { ascending: false }).limit(1).maybeSingle();
      return data;
    } else {
      const db = loadJsonDb();
      const userPatterns = db.patterns.filter(p => p.user_id === userId).sort((a, b) => new Date(b.computed_at) - new Date(a.computed_at));
      if (userPatterns.length === 0) return null;
      const pattern = userPatterns[0];
      return {
        ...pattern,
        most_productive_hours: typeof pattern.most_productive_hours === 'string' ? JSON.parse(pattern.most_productive_hours) : pattern.most_productive_hours,
        skip_streak_flags: typeof pattern.skip_streak_flags === 'string' ? JSON.parse(pattern.skip_streak_flags) : pattern.skip_streak_flags
      };
    }
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

    if (mode === 'supabase' && supabase) {
      const { data, error } = await supabase.from('patterns').insert(payload).select().single();
      if (error) throw error;
      return data;
    } else {
      const db = loadJsonDb();
      db.patterns.push(payload);
      saveJsonDb(db);
      return this.getLatestPattern(userId);
    }
  },

  async getTasksForPatternComputation(userId = DEFAULT_USER_ID, daysBack = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);
    const dateStr = startDate.toISOString().split('T')[0];

    if (mode === 'supabase' && supabase) {
      const { data, error } = await supabase.from('tasks').select('*').eq('user_id', userId).gte('scheduled_for', dateStr);
      if (error) throw error;
      return data || [];
    } else {
      const db = loadJsonDb();
      return db.tasks.filter(t => t.user_id === userId && t.scheduled_for >= dateStr);
    }
  }
};
