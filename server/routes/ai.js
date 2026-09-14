import https from 'https';
import { dbEngine } from '../db.js';

let router = null;

try {
  const expressModule = await import('express');
  const express = expressModule.default;
  router = express.Router();

  router.post('/daily-brief', async (req, res) => {
    try {
      const { date } = req.body;
      const dateStr = date || new Date().toISOString().split('T')[0];
      const userId = dbEngine.defaultUserId;
      const brief = await generateDailyBriefing(userId, dateStr);
      res.json(brief);
    } catch (err) {
      console.error('Error generating daily brief:', err);
      res.status(500).json({ error: err.message });
    }
  });
} catch (e) {}

export async function generateDailyBriefing(userId, dateStr) {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  const todayTasks = await dbEngine.getTasks({ userId, date: dateStr });
  const yesterdayDate = new Date(new Date(dateStr).valueOf() - 86400000).toISOString().split('T')[0];
  const todayEvents = await dbEngine.getEvents({ userId, from: dateStr, to: dateStr });
  const pattern = await dbEngine.getLatestPattern(userId);
  const yesterdayLog = await dbEngine.getDailyLog(userId, yesterdayDate);

  let briefResult = null;

  if (GEMINI_API_KEY) {
    try {
      const promptText = `
You are a personal scheduling assistant for DailyOS.
Given the user's task list for today, their historical productivity patterns, and yesterday's log:

TODAY'S TASKS:
${JSON.stringify(todayTasks.map(t => ({ id: t.id, title: t.title, category: t.category, estimated_minutes: t.estimated_minutes, priority: t.priority })), null, 2)}

TODAY'S SCHEDULED EVENTS:
${JSON.stringify(todayEvents.map(e => ({ title: e.title, time: e.event_time })), null, 2)}

HISTORICAL PRODUCTIVITY PATTERNS:
- Productive Hours: ${JSON.stringify(pattern?.most_productive_hours || {})}
- Highest Skip Rate Category: ${pattern?.worst_category || 'N/A'}
- Average Completion Ratio (Actual / Estimated): ${pattern?.avg_completion_ratio || 1.0}
- Skip Streak Flags: ${JSON.stringify(pattern?.skip_streak_flags || [])}

YESTERDAY'S LOG SUMMARY:
${JSON.stringify(yesterdayLog || { tasks_completed: 0, tasks_skipped: 0, mood_note: '' })}

INSTRUCTIONS:
1. Produce a suggested order and timing for today's tasks (respecting their known productive hours).
2. Produce ONE short, honest, data-grounded observation about a pattern worth their attention (e.g. recurring skip streak, underestimation of time, or high evening completion). Be direct and concise, not a generic motivational poster.

Respond ONLY in valid JSON matching this exact structure:
{
  "schedule": [
    {
      "task_id": "string",
      "suggested_time": "HH:MM",
      "reason": "short rationale"
    }
  ],
  "insight": "Short direct pattern insight"
}
`;
      briefResult = await callGeminiApi(GEMINI_API_KEY, promptText);
    } catch (err) {
      console.warn('⚠️ Google Gemini API call failed or failed parsing, using heuristic engine:', err.message);
    }
  }

  // Fallback Heuristic Briefing Generator
  if (!briefResult) {
    const productiveStart = pattern?.most_productive_hours?.start || '09:00';
    let currentHour = parseInt(productiveStart.split(':')[0], 10);

    const sortedTasks = [...todayTasks].sort((a, b) => {
      const priorityOrder = { high: 1, medium: 2, low: 3 };
      return (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2);
    });

    const schedule = sortedTasks.map((t) => {
      const timeStr = `${currentHour.toString().padStart(2, '0')}:00`;
      const estHours = Math.max(1, Math.round((t.estimated_minutes || 30) / 60));
      currentHour = (currentHour + estHours) % 24;
      return {
        task_id: t.id,
        suggested_time: timeStr,
        reason: `Scheduled during peak productive window (${pattern?.most_productive_hours?.start || '09:00'}-${pattern?.most_productive_hours?.end || '12:00'})`
      };
    });

    let insight = "Maintain momentum! Keep actual time tracking updated to refine your completion stats.";
    if (pattern?.skip_streak_flags && pattern.skip_streak_flags.length > 0) {
      insight = pattern.skip_streak_flags[0].message;
    } else if (pattern?.worst_category && pattern.worst_category !== 'none') {
      insight = `Noticeable pattern: Tasks in '${pattern.worst_category}' have your highest skip rate recently. Consider breaking them down.`;
    } else if (pattern?.avg_completion_ratio > 1.25) {
      insight = `Tasks are taking ~${Math.round((pattern.avg_completion_ratio - 1) * 100)}% longer than estimated. Buffer extra time today.`;
    }

    briefResult = { schedule, insight };
  }

  const aiSummaryJson = JSON.stringify(briefResult);
  await dbEngine.upsertDailyLog(userId, dateStr, { ai_summary: aiSummaryJson });
  return briefResult;
}

function callGeminiApi(apiKey, promptText) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      contents: [{ parts: [{ text: promptText }] }],
      generationConfig: { response_mime_type: "application/json" }
    });

    const options = {
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const text = json.candidates[0].content.parts[0].text;
          resolve(JSON.parse(text));
        } catch (e) { reject(e); }
      });
    });

    req.on('error', e => reject(e));
    req.write(postData);
    req.end();
  });
}

export default router;
