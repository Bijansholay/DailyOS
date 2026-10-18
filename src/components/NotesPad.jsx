import React, { useEffect, useRef, useState } from 'react';
import {
  BookOpen, CheckSquare, FileText, Plus, Trash2, X
} from 'lucide-react';
import { PrimaryButton, SecondaryButton, IconButton } from './Button';

function cleanTaskLine(line) {
  return line.replace(/^\s*(?:[-*•]|\[\s*[xX]?\s*\]|\d+[.)])\s*/, '').trim();
}

export default function NotesPad({ authFetch, onAddTask }) {
  const [notes, setNotes] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [taskDraft, setTaskDraft] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showTaskCapture, setShowTaskCapture] = useState(false);
  const saveTimer = useRef(null);

  useEffect(() => {
    let cancelled = false;
    async function loadNotes() {
      try {
        const res = await authFetch('/api/notes');
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        setNotes(data);
        if (data[0]) {
          setActiveId(data[0].id);
          setTitle(data[0].title);
          setContent(data[0].content || '');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    loadNotes();
    return () => {
      cancelled = true;
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!activeId || isLoading) return undefined;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setIsSaving(true);
      try {
        const res = await authFetch(`/api/notes/${activeId}`, {
          method: 'PATCH',
          body: JSON.stringify({ title, content })
        });
        if (res.ok) {
          const saved = await res.json();
          setNotes(current => current.map(note => note.id === saved.id ? saved : note)
            .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at)));
        }
      } finally {
        setIsSaving(false);
      }
    }, 700);
    return () => clearTimeout(saveTimer.current);
  }, [activeId, title, content, isLoading]);

  const createNote = async () => {
    const res = await authFetch('/api/notes', {
      method: 'POST',
      body: JSON.stringify({ title: 'Untitled note', content: '' })
    });
    if (!res.ok) return;
    const note = await res.json();
    setNotes(current => [note, ...current]);
    setActiveId(note.id);
    setTitle(note.title);
    setContent(note.content || '');
  };

  const selectNote = (note) => {
    if (note.id === activeId) return;
    setActiveId(note.id);
    setTitle(note.title);
    setContent(note.content || '');
  };

  const deleteNote = async () => {
    if (!activeId || !window.confirm('Delete this note permanently?')) return;
    const res = await authFetch(`/api/notes/${activeId}`, { method: 'DELETE' });
    if (!res.ok) return;
    const remaining = notes.filter(note => note.id !== activeId);
    setNotes(remaining);
    const next = remaining[0];
    if (next) {
      setActiveId(next.id);
      setTitle(next.title);
      setContent(next.content || '');
    } else {
      setActiveId(null);
      setTitle('');
      setContent('');
    }
  };

  const convertTasks = async () => {
    const taskLines = taskDraft.split('\n').map(cleanTaskLine).filter(Boolean);
    if (!taskLines.length) return;
    for (const taskTitle of taskLines) {
      await onAddTask({
        title: taskTitle,
        category: 'personal',
        estimated_minutes: 30,
        priority: 'medium',
        scheduled_for: null
      });
    }
    setTaskDraft('');
    setShowTaskCapture(false);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 py-2">
      <div className="border-b border-[var(--border-color)] pb-5 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-semibold tracking-widest uppercase text-[var(--accent-primary)]">Workspace</span>
          <h1 className="font-journal text-3xl md:text-4xl font-normal tracking-tight mt-1 text-[var(--text-main)]">Notes Pad</h1>
          <p className="text-sm mt-1 text-[var(--text-muted)]">Write freely, keep your thoughts, and turn rough notes into tasks.</p>
        </div>
        <div className="flex items-center gap-2">
          <SecondaryButton onClick={() => setShowTaskCapture(value => !value)} icon={CheckSquare}>Capture tasks</SecondaryButton>
          <PrimaryButton onClick={createNote} icon={Plus}>New note</PrimaryButton>
        </div>
      </div>

      {showTaskCapture && (
        <div className="rounded-2xl p-5 space-y-3 animate-slideUp" style={{ background: 'var(--bg-card)', border: '1px solid var(--accent-primary)' }}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-[var(--text-main)]">Quick task capture</h2>
              <p className="text-xs mt-1 text-[var(--text-muted)]">Write one task per line. Bullets and numbered lists are cleaned up automatically.</p>
            </div>
            <IconButton onClick={() => setShowTaskCapture(false)} icon={X} title="Close" />
          </div>
          <textarea
            value={taskDraft}
            onChange={event => setTaskDraft(event.target.value)}
            placeholder={'Reply to the client\nPlan next week\nBook a dentist appointment'}
            rows={4}
            className="w-full p-4 journal-input rounded-xl text-sm resize-y"
            autoFocus
          />
          <div className="flex justify-end">
            <PrimaryButton onClick={convertTasks} icon={CheckSquare} disabled={!taskDraft.trim()}>Add to backlog</PrimaryButton>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)] gap-4 min-h-[560px]">
        <aside className="rounded-2xl p-3 space-y-2" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="flex items-center justify-between px-2 pb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Your notes</span>
            <button onClick={createNote} className="p-1.5 rounded-lg text-[var(--accent-primary)] hover:bg-[var(--accent-bg-subtle)]" title="New note"><Plus className="w-4 h-4" /></button>
          </div>
          {isLoading ? (
            <div className="p-3 text-xs text-[var(--text-muted)]">Loading notes…</div>
          ) : notes.length === 0 ? (
            <div className="p-4 text-center text-xs text-[var(--text-muted)]">Your first note starts here.</div>
          ) : notes.map(note => (
            <button key={note.id} onClick={() => selectNote(note)} className={`w-full text-left p-3 rounded-xl transition-colors ${note.id === activeId ? 'bg-[var(--accent-bg-subtle)] text-[var(--accent-primary)]' : 'hover:bg-[var(--bg-card-hover)] text-[var(--text-main)]'}`}>
              <span className="flex items-center gap-2 text-sm font-semibold truncate"><FileText className="w-4 h-4 shrink-0" />{note.title || 'Untitled note'}</span>
              <span className="block text-[10px] mt-1 truncate text-[var(--text-muted)]">{note.content || 'Empty note'}</span>
            </button>
          ))}
        </aside>

        <section className="rounded-2xl overflow-hidden flex flex-col" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          {activeId ? (
            <>
              <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-[var(--border-color)]">
                <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]"><BookOpen className="w-4 h-4" />{isSaving ? 'Saving…' : 'Saved'}</div>
                <div className="flex items-center gap-1"><IconButton onClick={deleteNote} icon={Trash2} danger title="Delete note" /></div>
              </div>
              <input value={title} onChange={event => setTitle(event.target.value)} placeholder="Note title" className="px-6 pt-6 pb-2 bg-transparent border-0 outline-none text-2xl font-journal text-[var(--text-main)] placeholder:text-[var(--text-muted)]" />
              <textarea value={content} onChange={event => setContent(event.target.value)} placeholder="Start writing…" className="flex-1 min-h-[460px] px-6 pb-8 pt-3 bg-transparent border-0 outline-none resize-none text-sm leading-7 text-[var(--text-main)] placeholder:text-[var(--text-muted)]" />
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <BookOpen className="w-10 h-10 mb-4 text-[var(--accent-primary)]" />
              <h2 className="font-journal text-2xl text-[var(--text-main)]">A clear page is waiting</h2>
              <p className="text-sm mt-2 mb-5 text-[var(--text-muted)]">Create a note for plans, ideas, meeting notes, or anything you want to return to.</p>
              <PrimaryButton onClick={createNote} icon={Plus}>Create your first note</PrimaryButton>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
