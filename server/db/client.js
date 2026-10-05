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

export const DEFAULT_USER_ID = process.env.DEFAULT_USER_ID || 'user_000000000000000000000000001';
const { SUPABASE_URL, SUPABASE_KEY } = process.env;

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

let supabaseInstance = null;

if (SUPABASE_URL && SUPABASE_KEY) {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    supabaseInstance = createClient(SUPABASE_URL, SUPABASE_KEY);
    console.log('✅ Connected to Supabase PostgreSQL Database');
  } catch (err) {
    console.warn('⚠️ Could not load @supabase/supabase-js, initializing in-memory Supabase client');
    supabaseInstance = createInMemorySupabaseClient();
  }
} else {
  console.log('ℹ️ SUPABASE_URL / SUPABASE_KEY not set. Using in-memory Supabase client');
  supabaseInstance = createInMemorySupabaseClient();
}

export const supabase = supabaseInstance;

export function generateUuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
