# Product Requirement Document (PRD): DailyOS

**Project Title:** DailyOS  
**Subtitle:** Intelligent Journal & Behavioral Schedule Engine  
**Sector:** Social Innovation / Education  
**Target Audience:** Students, Young Professionals, and Self-Directed Learners  
**Author / Team:** DailyOS Core Team  
**Document Version:** 1.0 (Hackathon Edition)  

---

## 1. Executive Summary

**DailyOS** is a zero-cost, AI-powered personal productivity and life journal designed to bridge the executive function gap for students and young adults. Unlike traditional task managers that act as passive "dumping grounds" for to-do items, DailyOS operates as an active, behavioral schedule engine. 

By combining a warm, editorial timeline day-planner with a 30-day statistical telemetry engine and Google Gemini AI, DailyOS analyzes personal energy peaks, time-estimation accuracy, and recurring skip streaks to automatically generate realistic, burnout-resistant daily study and work routines.

---

## 2. Problem Statement & Market Context

### The Problem
* **Executive Function Gap:** Over 70% of tertiary students and young self-directed learners experience chronic task paralysis, burnout, and anxiety caused by unstructured daily schedules.
* **Planning Fallacy:** Individuals consistently underestimate task durations by 30% to 50%, leading to cascading delays, late submissions, and sleep deprivation.
* **Tool Abandonment:** Traditional SaaS productivity apps (Todoist, Notion, Trello) are overwhelming, complex, and treat all hours of the day as equal. They offer zero feedback when tasks are repeatedly skipped, leading users to abandon the app within two weeks.

### Target Audience
* **Primary:** University students, self-taught developers, and researchers balancing multi-subject study loads.
* **Secondary:** Early-career remote workers and neurodivergent individuals (e.g., ADHD) who benefit from clear visual structure, low cognitive friction, and automated schedule rollover.

---

## 3. Product Vision & Core Value Proposition

### Vision
To democratize high-level personal executive coaching through accessible AI telemetry, empowering young individuals to build sustainable, lifelong productivity habits.

### Core Value Pillars
1. **Editorial Simplicity:** Styled like a warm paper day-planner (`#1C1B19` base, serif typography) rather than a cold SaaS tool.
2. **Behavioral Telemetry:** Tracks actual vs. estimated completion times to train individual planning accuracy.
3. **Automated Maintenance:** Midnight background jobs clear backlogs automatically, preventing accumulated task guilt.
4. **Honest AI Coaching:** Delivers plain-language, data-grounded insights instead of generic motivational quotes.

---

## 4. Key Features & Functional Requirements

### 4.1. Day Planner & Running Timeline
* **Chronological Timeline View:** Replaces stacked card grids with a continuous day planner (time on the left, task/event on the right).
* **Typography-Based Priority:** Priority is expressed strictly through font weight and size (high-priority items are larger and bolder), eliminating cluttering badges.
* **Actual vs. Estimated Time Logging:** When completing a task, a streamlined modal prompts the user to log actual minutes spent, feeding the accuracy engine.
* **End-of-Day Journal Reflection:** Allows users to record daily mood notes and reflections alongside quantitative completion stats.

### 4.2. Behavioral Pattern & Telemetry Engine
* **Peak Productive Hours Detection:** Analyzes 30 days of completion timestamps to identify the user's 3-hour peak focus window (e.g., `09:00 AM – 12:00 PM`).
* **Time Estimation Ratio:** Computes the ratio of `Actual Minutes / Estimated Minutes` to highlight planning bias.
* **Skip-Streak Detection:** Automatically flags any category skipped for 3 or more consecutive days.
* **Visual Analytics Dashboard:** Interactive heatmaps and charts built with Recharts.

### 4.3. Intelligent Schedule Generator (Google Gemini AI)
* **Context-Aware Timetabling:** Ingests today's tasks, calendar events, historical peak hours, and past skip rates to construct an optimal daily schedule.
* **First-Person Journal Insights:** Surfaces direct, plain-text schedule observations (e.g., *"Your afternoon fits best for deep focus — you complete 80% of tasks planned in your peak window."*).
* **Smart Heuristic Fallback:** If API limits are reached or offline, a local algorithmic engine seamlessly computes schedules without interruption.

### 4.4. Automated Background Maintenance (24/7 Cron Daemon)
* **00:01 AM Midnight Rollover:** Automatically transitions uncompleted past tasks to `late` or backlog, maintaining a clean workspace every morning.
* **00:05 AM Pattern Recomputation:** Nightly calculation of 30-day productivity trends.
* **06:00 AM Pre-computed Daily Briefing:** Generates and caches the morning schedule before the user wakes up.

---

## 5. Technical Architecture & Tech Stack

```
 ┌─────────────────────────────────────────────────────────┐
 │                   React 19 Frontend                     │
 │  - Newsreader Serif & Plus Jakarta Sans Typography       │
 │  - Warm Neutral Theme (#1C1B19 base, #D4A24C amber)     │
 │  - Recharts Visualizations & Lucide Icons               │
 └────────────────────────────┬────────────────────────────┘
                              │ REST API (/api/*)
 ┌────────────────────────────▼────────────────────────────┐
 │                  Node.js / Express Server               │
 │  - Static Asset Serving (Vite /dist)                    │
 │  - node-cron 24/7 Scheduler Daemon                      │
 │  - Dual Storage Engine (SQLite / JSON / Supabase)       │
 └──────────────┬───────────────────────────┬──────────────┘
                │                           │
 ┌──────────────▼──────────────┐  ┌─────────▼──────────────┐
 │   Google Gemini 2.5 API    │  │   AWS EC2 + PM2         │
 │   Schedule & Insight Engine │  │   Nginx + Let's Encrypt │
 └─────────────────────────────┘  └────────────────────────┘
```

| Layer | Technologies |
| :--- | :--- |
| **Frontend UI** | React 19, Vite, Tailwind CSS, Recharts, Lucide Icons |
| **Typography** | Newsreader (Google Fonts Serif) + Plus Jakarta Sans |
| **Backend API** | Node.js, Express.js |
| **Database** | SQLite (`better-sqlite3`) / Supabase PostgreSQL / Local JSON |
| **AI Integration** | Google Gemini API (`@google/genai`) with Heuristic Fallback |
| **Scheduler** | `node-cron` daemon |
| **Hosting & Infra** | AWS EC2 (Ubuntu 24.04), Nginx Reverse Proxy, Let's Encrypt SSL, PM2 |
| **CI/CD** | GitHub Actions (`.github/workflows/deploy.yml`) |

---

## 6. Design System & User Experience

* **Color Palette:** Warm neutral `#1C1B19` near-black base, `#24221F` card surfaces, `#33302B` subtle borders, and `#D4A24C` Amber/Ochre accent for active focus.
* **Typography System:** Serif headers for journal identity; clean sans-serif for task titles and inputs.
* **Low Cognitive Load:** Zero unnecessary badges, sparkles, or intrusive AI popups. The system feels like an extension of a physical day planner.

---

## 7. Impact Metrics & Success Criteria

1. **Task Completion Rate:** % increase in tasks marked `done` within scheduled energy windows.
2. **Estimation Accuracy Improvement:** Reduction in the variance between actual vs. estimated task durations over 30 days.
3. **Retention Rate:** % of users who maintain active daily logging past 30 days due to zero-maintenance rollover.
4. **Procrastination Mitigation:** Reduction in multi-day category skip streaks.

---

## 8. Future Roadmap

* **Phase 1 (Completed / MVP):** Full-stack web application, timeline planner, Gemini AI integration, pattern analytics, EC2 deployment, CI/CD pipeline.
* **Phase 2 (Post-Hackathon):** Offline PWA (Progressive Web App) support with local SQLite sync.
* **Phase 3:** Calendar sync integration (Google Calendar / iCal bi-directional sync).
* **Phase 4:** Voice journal entry input for instant hands-free task logging.
