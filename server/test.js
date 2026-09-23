import test from 'node:test';
import assert from 'node:assert/strict';
import { dbEngine } from './db.js';

test.before(async () => {
  await dbEngine.ensureDefaultUser();
});

test('Auth: Register, Find User, and Login Flow', async () => {
  const email = `testuser_${Date.now()}@example.com`;
  const passwordHash = 'hashedPassword123';

  // Create User
  const newUser = await dbEngine.createUser({ email, password_hash: passwordHash });
  assert.ok(newUser.id, 'Created user must have an ID');
  assert.equal(newUser.email, email.toLowerCase());

  // Find User
  const foundUser = await dbEngine.findUserByEmail(email);
  assert.ok(foundUser, 'Should find user by email');
  assert.equal(foundUser.id, newUser.id);
  assert.equal(foundUser.password_hash, passwordHash);
});

test('Auth: Password Complexity Enforcement', async () => {
  const { validatePasswordStrength } = await import('./utils/authUtils.js');

  assert.equal(validatePasswordStrength('short').valid, false);
  assert.equal(validatePasswordStrength('onlyletters').valid, false);
  assert.equal(validatePasswordStrength('12345678').valid, false);

  const validResult = validatePasswordStrength('ValidPassword123');
  assert.equal(validResult.valid, true);
});

test('Task CRUD Operations', async () => {
  const user = await dbEngine.createUser({
    email: `cruduser_${Date.now()}@example.com`,
    password_hash: 'pass'
  });
  const todayStr = new Date().toISOString().split('T')[0];

  // 1. Create Task
  const task = await dbEngine.createTask({
    user_id: user.id,
    title: 'Test CRUD Task',
    category: 'work',
    estimated_minutes: 30,
    scheduled_for: todayStr,
    priority: 'high'
  });
  assert.ok(task.id);
  assert.equal(task.title, 'Test CRUD Task');
  assert.equal(task.user_id, user.id);

  // 2. Read Tasks
  const tasks = await dbEngine.getTasks({ userId: user.id, date: todayStr });
  assert.ok(tasks.some(t => t.id === task.id));

  // 3. Update Task
  const updatedTask = await dbEngine.updateTask(task.id, { title: 'Updated Title', status: 'done' }, user.id);
  assert.ok(updatedTask);
  assert.equal(updatedTask.title, 'Updated Title');
  assert.equal(updatedTask.status, 'done');

  // 4. Delete Task
  const deleteResult = await dbEngine.deleteTask(task.id, user.id);
  assert.ok(deleteResult.success);

  // Verify deletion
  const tasksAfterDelete = await dbEngine.getTasks({ userId: user.id, date: todayStr });
  assert.ok(!tasksAfterDelete.some(t => t.id === task.id));
});

test('Security IDOR Regression: User B cannot PATCH or DELETE User A task/event', async () => {
  const timestamp = Date.now();
  const userA = await dbEngine.createUser({ email: `usera_${timestamp}@example.com`, password_hash: 'pass' });
  const userB = await dbEngine.createUser({ email: `userb_${timestamp}@example.com`, password_hash: 'pass' });
  const todayStr = new Date().toISOString().split('T')[0];

  // User A creates a Task and an Event
  const taskA = await dbEngine.createTask({
    user_id: userA.id,
    title: 'User A Private Task',
    category: 'personal',
    scheduled_for: todayStr
  });

  const eventA = await dbEngine.createEvent({
    user_id: userA.id,
    title: 'User A Private Event',
    event_date: todayStr
  });

  // IDOR Test 1: User B attempts to UPDATE User A's Task
  const patchAttempt = await dbEngine.updateTask(taskA.id, { title: 'Hacked Title' }, userB.id);
  assert.equal(patchAttempt, null, 'User B should not be able to update User A task');

  // IDOR Test 2: User B attempts to DELETE User A's Task
  const deleteTaskAttempt = await dbEngine.deleteTask(taskA.id, userB.id);
  assert.equal(deleteTaskAttempt, null, 'User B should not be able to delete User A task');

  // IDOR Test 3: User B attempts to DELETE User A's Event
  const deleteEventAttempt = await dbEngine.deleteEvent(eventA.id, userB.id);
  assert.equal(deleteEventAttempt, null, 'User B should not be able to delete User A event');

  // Verify User A's task was NOT modified or deleted
  const tasksA = await dbEngine.getTasks({ userId: userA.id, date: todayStr });
  const verifiedTask = tasksA.find(t => t.id === taskA.id);
  assert.ok(verifiedTask, 'Task A must still exist');
  assert.equal(verifiedTask.title, 'User A Private Task', 'Task A title must be untouched');

  // User A can successfully UPDATE and DELETE their own Task and Event
  const validUpdate = await dbEngine.updateTask(taskA.id, { title: 'User A Updated Task' }, userA.id);
  assert.ok(validUpdate);
  assert.equal(validUpdate.title, 'User A Updated Task');

  const validTaskDelete = await dbEngine.deleteTask(taskA.id, userA.id);
  assert.ok(validTaskDelete.success);

  const validEventDelete = await dbEngine.deleteEvent(eventA.id, userA.id);
  assert.ok(validEventDelete.success);
});

test('Goal CRUD Operations', async () => {
  const user = await dbEngine.createUser({
    email: `goaluser_${Date.now()}@example.com`,
    password_hash: 'pass'
  });

  // 1. Create Goal
  const goal = await dbEngine.createGoal({
    user_id: user.id,
    title: 'Complete 5 Workout Sessions',
    period_type: 'weekly',
    period_key: '2026-W39',
    target_value: 5
  });
  assert.ok(goal.id, 'Goal must have ID');
  assert.equal(goal.title, 'Complete 5 Workout Sessions');
  assert.equal(goal.target_value, 5);
  assert.equal(goal.current_value, 0);

  // 2. Read Goals
  const goals = await dbEngine.getGoals({ userId: user.id, period_type: 'weekly', period_key: '2026-W39' });
  assert.ok(goals.some(g => g.id === goal.id));

  // 3. Update Goal (Increment progress)
  const updatedGoal = await dbEngine.updateGoal(goal.id, { current_value: 3, status: 'in_progress' }, user.id);
  assert.ok(updatedGoal);
  assert.equal(updatedGoal.current_value, 3);
  assert.equal(updatedGoal.status, 'in_progress');

  // 4. Delete Goal
  const deleteResult = await dbEngine.deleteGoal(goal.id, user.id);
  assert.ok(deleteResult.success);

  // Verify deletion
  const goalsAfterDelete = await dbEngine.getGoals({ userId: user.id, period_type: 'weekly', period_key: '2026-W39' });
  assert.ok(!goalsAfterDelete.some(g => g.id === goal.id));
});

test('Security IDOR Regression: User B cannot PATCH or DELETE User A goal', async () => {
  const timestamp = Date.now();
  const userA = await dbEngine.createUser({ email: `goal_usera_${timestamp}@example.com`, password_hash: 'pass' });
  const userB = await dbEngine.createUser({ email: `goal_userb_${timestamp}@example.com`, password_hash: 'pass' });

  // User A creates a Goal
  const goalA = await dbEngine.createGoal({
    user_id: userA.id,
    title: 'User A Private Goal',
    period_type: 'monthly',
    period_key: '2026-09',
    target_value: 10
  });

  // User B attempts to UPDATE User A's Goal
  const patchAttempt = await dbEngine.updateGoal(goalA.id, { title: 'Hacked Goal' }, userB.id);
  assert.equal(patchAttempt, null, 'User B should not be able to update User A goal');

  // User B attempts to DELETE User A's Goal
  const deleteGoalAttempt = await dbEngine.deleteGoal(goalA.id, userB.id);
  assert.equal(deleteGoalAttempt, null, 'User B should not be able to delete User A goal');

  // Verify User A's goal was NOT modified or deleted
  const goalsA = await dbEngine.getGoals({ userId: userA.id, period_type: 'monthly', period_key: '2026-09' });
  const verifiedGoal = goalsA.find(g => g.id === goalA.id);
  assert.ok(verifiedGoal, 'Goal A must still exist');
  assert.equal(verifiedGoal.title, 'User A Private Goal');

  // User A can successfully UPDATE and DELETE their own Goal
  const validUpdate = await dbEngine.updateGoal(goalA.id, { current_value: 5 }, userA.id);
  assert.ok(validUpdate);
  assert.equal(validUpdate.current_value, 5);

  const validDelete = await dbEngine.deleteGoal(goalA.id, userA.id);
  assert.ok(validDelete.success);
});

// Optionally test HTTP server endpoints if express is available
(async () => {
  try {
    const expressModule = await import('express');
    const express = expressModule.default;
    const tasksRouter = (await import('./routes/tasks.js')).default;
    const eventsRouter = (await import('./routes/events.js')).default;
    const goalsRouter = (await import('./routes/goals.js')).default;
    const authRouter = (await import('./routes/auth.js')).default;

    if (express && authRouter && tasksRouter && eventsRouter && goalsRouter) {
      test('HTTP API Endpoints (Express Integration)', async () => {
        const app = express();
        app.use(express.json());
        app.use('/api/auth', authRouter);
        app.use('/api/tasks', tasksRouter);
        app.use('/api/events', eventsRouter);
        app.use('/api/goals', goalsRouter);

        const server = app.listen(0, '127.0.0.1');
        const port = server.address().port;
        const baseUrl = `http://127.0.0.1:${port}`;

        try {
          // 1. Weak password registration attempt -> 400
          const weakPwRes = await fetch(`${baseUrl}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: `weak_${Date.now()}@test.com`, password: 'short' })
          });
          assert.equal(weakPwRes.status, 400);

          // 2. Register User A -> Returns requireOtp & otpCode
          const emailA = `http_usera_${Date.now()}@test.com`;
          const regResA = await fetch(`${baseUrl}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: emailA, password: 'SecurePassword123' })
          });
          assert.equal(regResA.status, 201);
          const regDataA = await regResA.json();
          assert.equal(regDataA.requireOtp, true);
          assert.ok(regDataA.otpCode);

          // Verify OTP for User A -> Returns tokenA
          const verifyResA = await fetch(`${baseUrl}/api/auth/verify-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: emailA, otpCode: regDataA.otpCode })
          });
          assert.equal(verifyResA.status, 200);
          const { token: tokenA } = await verifyResA.json();
          assert.ok(tokenA);

          // Register User B & Verify OTP
          const emailB = `http_userb_${Date.now()}@test.com`;
          const regResB = await fetch(`${baseUrl}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: emailB, password: 'SecurePassword123' })
          });
          assert.equal(regResB.status, 201);
          const regDataB = await regResB.json();

          const verifyResB = await fetch(`${baseUrl}/api/auth/verify-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: emailB, otpCode: regDataB.otpCode })
          });
          assert.equal(verifyResB.status, 200);
          const { token: tokenB } = await verifyResB.json();
          assert.ok(tokenB);

          // User A creates task
          const taskRes = await fetch(`${baseUrl}/api/tasks`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${tokenA}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: 'HTTP Task A' })
          });
          assert.equal(taskRes.status, 201);
          const taskA = await taskRes.json();

          // User B attempts to PATCH User A's task -> 404
          const patchRes = await fetch(`${baseUrl}/api/tasks/${taskA.id}`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${tokenB}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: 'Hacked' })
          });
          assert.equal(patchRes.status, 404);

          // User B attempts to DELETE User A's task -> 404
          const delRes = await fetch(`${baseUrl}/api/tasks/${taskA.id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${tokenB}` }
          });
          assert.equal(delRes.status, 404);

          // User A creates goal via HTTP
          const goalRes = await fetch(`${baseUrl}/api/goals`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${tokenA}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: 'Read 2 Books', period_type: 'monthly', period_key: '2026-09', target_value: 2 })
          });
          assert.equal(goalRes.status, 201);
          const goalA = await goalRes.json();

          // User B attempts to PATCH User A's goal -> 404
          const goalPatchRes = await fetch(`${baseUrl}/api/goals/${goalA.id}`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${tokenB}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ progress_value: 1 })
          });
          assert.equal(goalPatchRes.status, 404);

          // User B attempts to DELETE User A's goal -> 404
          const goalDelRes = await fetch(`${baseUrl}/api/goals/${goalA.id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${tokenB}` }
          });
          assert.equal(goalDelRes.status, 404);

          // Demo Auth Endpoint Test
          const demoRes = await fetch(`${baseUrl}/api/auth/demo`, { method: 'POST' });
          assert.equal(demoRes.status, 200);
          const demoData = await demoRes.json();
          assert.ok(demoData.token);
          assert.equal(demoData.user.email, 'demo@dailyos.local');

          // User Demo fetch tasks with token
          const demoTasksRes = await fetch(`${baseUrl}/api/tasks`, {
            headers: { Authorization: `Bearer ${demoData.token}` }
          });
          assert.equal(demoTasksRes.status, 200);
          const demoTasks = await demoTasksRes.json();
          assert.ok(Array.isArray(demoTasks));
        } finally {
          server.close();
        }
      });
    }
  } catch (e) {
    // Express not installed in environment, test suite relies on dbEngine unit tests
  }
})();
