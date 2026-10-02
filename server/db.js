import { DEFAULT_USER_ID } from './db/client.js';
import { usersDb } from './db/usersDb.js';
import { tasksDb } from './db/tasksDb.js';
import { eventsDb } from './db/eventsDb.js';
import { dailyLogsDb } from './db/dailyLogsDb.js';
import { patternsDb } from './db/patternsDb.js';
import { goalsDb } from './db/goalsDb.js';

export const dbEngine = {
  mode: 'supabase',
  defaultUserId: DEFAULT_USER_ID,

  // Users
  ensureDefaultUser: () => usersDb.ensureDefaultUser(),
  ensureUserExists: (userId, email) => usersDb.ensureUserExists(userId, email),
  createUser: (userData) => usersDb.createUser(userData),
  findUserByEmail: (email) => usersDb.findUserByEmail(email),
  findUserById: (id) => usersDb.findUserById(id),
  syncClerkUser: ({ id, email }) => usersDb.ensureUserExists(id, email),

  // Tasks
  getTasks: (params) => tasksDb.getTasks(params),
  createTask: (taskData) => tasksDb.createTask(taskData),
  updateTask: (id, updates, userId) => tasksDb.updateTask(id, updates, userId),
  deleteTask: (id, userId) => tasksDb.deleteTask(id, userId),

  // Events
  getEvents: (params) => eventsDb.getEvents(params),
  createEvent: (eventData) => eventsDb.createEvent(eventData),
  deleteEvent: (id, userId) => eventsDb.deleteEvent(id, userId),

  // Daily Logs
  getDailyLog: (userId, logDate) => dailyLogsDb.getDailyLog(userId, logDate),
  upsertDailyLog: (userId, logDate, logData) => dailyLogsDb.upsertDailyLog(userId, logDate, logData),

  // Patterns
  getLatestPattern: (userId) => patternsDb.getLatestPattern(userId),
  upsertPattern: (userId, patternData) => patternsDb.upsertPattern(userId, patternData),
  getTasksForPatternComputation: (userId, daysBack) => patternsDb.getTasksForPatternComputation(userId, daysBack),

  // Goals
  getGoals: (params) => goalsDb.getGoals(params),
  createGoal: (goalData) => goalsDb.createGoal(goalData),
  updateGoal: (id, updates, userId) => goalsDb.updateGoal(id, updates, userId),
  deleteGoal: (id, userId) => goalsDb.deleteGoal(id, userId)
};
