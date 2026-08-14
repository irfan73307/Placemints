/**
 * AdminCompanyAdd.jsx
 *
 * Admin-only page for submitting interview questions for a company.
 * - Manual mode: one company + N questions per submit
 * - CSV bulk-import mode: paste/upload CSV → auto-group by company → parallel submit
 *
 * Design: matches existing admin panel (Tailwind, rounded-2xl cards, slate/indigo,
 * dark-mode, Badge + Button components, useToast).
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  PlusCircle,
  Trash2,
  Upload,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  Loader2,
  Building2,
  FileText,
  RotateCcw,
  Info,
} from 'lucide-react';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { useToast } from '../contexts/ToastContext';
import { bulkAddQuestions, searchCompanies } from '../services/adminService';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Mirrors the server-side slugify so grouping is consistent client-side */
function slugify(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Parse CSV text → array of row objects */
function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  // Accept header row (case-insensitive). Skip it.
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i]);
    if (cols.length < 2) continue;
    const [companyName, questionText, topicTags = '', difficulty = 'Medium', year = String(new Date().getFullYear())] = cols;
    if (!companyName.trim() || !questionText.trim()) continue;
    rows.push({
      companyName: companyName.trim(),
      questionText: questionText.trim(),
      topicTags: topicTags.trim() || 'General',
      difficulty: ['Easy', 'Medium', 'Hard'].includes(difficulty.trim()) ? difficulty.trim() : 'Medium',
      year: parseInt(year.trim(), 10) || new Date().getFullYear(),
    });
  }
  return rows;
}

function splitCsvLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result.map((s) => s.replace(/^"|"$/g, '').trim());
}

/** Group CSV rows by normalized slug → { [slug]: { companyName, questions[] } } */
function groupRowsByCompany(rows) {
  const map = {};
  rows.forEach((row) => {
    const slug = slugify(row.companyName);
    if (!map[slug]) {
      map[slug] = { companyName: row.companyName, slug, questions: [] };
    }
    map[slug].questions.push({
      questionText: row.questionText,
      topicTags: row.topicTags,
      difficulty: row.difficulty,
      year: row.year,
    });
  });
  return map;
}

/** Client-side concurrency-capped Promise.allSettled runner (max 6 at a time) */
async function runWithConcurrency(tasks, onUpdate, concurrency = 6) {
  const results = new Array(tasks.length).fill(null);
  const indices = tasks.map((_, i) => i);
  const active = new Set();
  let cursor = 0;

  return new Promise((resolve) => {
    function launch() {
      while (active.size < concurrency && cursor < tasks.length) {
        const idx = indices[cursor++];
        active.add(idx);
        tasks[idx]()
          .then((val) => {
            results[idx] = { status: 'fulfilled', value: val };
          })
          .catch((err) => {
            results[idx] = { status: 'rejected', reason: err };
          })
          .finally(() => {
            active.delete(idx);
            onUpdate(idx, results[idx]);
            if (active.size === 0 && cursor >= tasks.length) {
              resolve(results);
            } else {
              launch();
            }
          });
      }
    }
    launch();
  });
}

// ─── Default question row ──────────────────────────────────────────────────────
function newQuestionRow() {
  return {
    id: Date.now() + Math.random(),
    questionText: '',
    topicTags: '',
    difficulty: 'Medium',
    year: new Date().getFullYear(),
    roundTitle: '',
    error: '',
  };
}

// ─── Difficulty pill colours ──────────────────────────────────────────────────
const DIFF_COLORS = {
  Easy: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  Medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  Hard: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function AdminCompanyAdd() {
  const toast = useToast();

  // ── mode toggle
  const [mode, setMode] = useState('manual'); // 'manual' | 'csv'

  // ── manual mode state
  const [companyName, setCompanyName] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [tier, setTier] = useState('');
  const [ctc, setCtc] = useState('');
  const [website, setWebsite] = useState('');
  const [sector, setSector] = useState('');
  const [questions, setQuestions] = useState([newQuestionRow()]);
  const [showCompanyFields, setShowCompanyFields] = useState(false);

  // ── company existence badge
  const [companyLookup, setCompanyLookup] = useState({ status: 'idle' }); // idle | searching | found | not-found
  const debounceRef = useRef(null);

  // ── manual submit state
  const [submitting, setSubmitting] = useState(false);

  // ── CSV mode state
  const [csvText, setCsvText] = useState('');
  const [csvGroups, setCsvGroups] = useState({}); // { [slug]: { companyName, questions, status, result } }
  const [csvParsed, setCsvParsed] = useState(false);
  const [csvRunning, setCsvRunning] = useState(false);
  const fileInputRef = useRef(null);

  // ─── Company name debounce lookup ─────────────────────────────────────────
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const trimmed = companyName.trim();
    if (!trimmed) {
      setCompanyLookup({ status: 'idle' });
      return;
    }
    setCompanyLookup({ status: 'searching' });
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await searchCompanies(trimmed);
        const targetSlug = slugify(trimmed);
        const match = (data.data || []).find((c) => c.slug === targetSlug);
        setCompanyLookup(match
          ? { status: 'found', company: match }
          : { status: 'not-found' }
        );
      } catch {
        setCompanyLookup({ status: 'idle' });
      }
    }, 450);
    return () => clearTimeout(debounceRef.current);
  }, [companyName]);

  // ─── Question row helpers ─────────────────────────────────────────────────
  const addQuestion = () => setQuestions((prev) => [...prev, newQuestionRow()]);

  const removeQuestion = (id) =>
    setQuestions((prev) => prev.length > 1 ? prev.filter((q) => q.id !== id) : prev);

  const updateQuestion = (id, field, value) =>
    setQuestions((prev) =>
      prev.map((q) => q.id === id ? { ...q, [field]: value, error: field === 'questionText' ? '' : q.error } : q)
    );

  // ─── Manual validation ────────────────────────────────────────────────────
  function validateManual() {
    if (!companyName.trim()) {
      toast.error('Company name is required.');
      return false;
    }
    let valid = true;
    setQuestions((prev) =>
      prev.map((q) => {
        if (!q.questionText.trim()) {
          valid = false;
          return { ...q, error: 'Question text is required.' };
        }
        return { ...q, error: '' };
      })
    );
    return valid;
  }

  // ─── Manual submit ────────────────────────────────────────────────────────
  async function handleManualSubmit(e) {
    e.preventDefault();
    if (!validateManual()) return;
    setSubmitting(true);
    try {
      const payload = {
        companyName: companyName.trim(),
        description: description.trim() || undefined,
        tags: tags.trim() || undefined,
        tier: tier.trim() || undefined,
        ctc: ctc.trim() || undefined,
        website: website.trim() || undefined,
        sector: sector.trim() || undefined,
        questions: questions.map((q) => ({
          questionText: q.questionText.trim(),
          topicTags: q.topicTags.trim() || 'General',
          difficulty: q.difficulty,
          year: parseInt(q.year, 10) || new Date().getFullYear(),
          roundTitle: q.roundTitle.trim() || undefined,
        })),
      };
      const result = await bulkAddQuestions(payload);
      toast.success(result.message);
      // Reset form
      setCompanyName('');
      setDescription('');
      setTags('');
      setTier('');
      setCtc('');
      setWebsite('');
      setSector('');
      setQuestions([newQuestionRow()]);
      setCompanyLookup({ status: 'idle' });
      setShowCompanyFields(false);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to submit questions. Please try again.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  // ─── CSV parse ────────────────────────────────────────────────────────────
  function handleCsvParse() {
    if (!csvText.trim()) {
      toast.error('Paste CSV content first.');
      return;
    }
    const rows = parseCsv(csvText);
    if (rows.length === 0) {
      toast.error('No valid rows found. Check format: companyName, questionText, topicTags, difficulty, year');
      return;
    }
    const grouped = groupRowsByCompany(rows);
    const withStatus = {};
    Object.keys(grouped).forEach((slug) => {
      withStatus[slug] = { ...grouped[slug], status: 'pending', result: null };
    });
    setCsvGroups(withStatus);
    setCsvParsed(true);
    toast.info(`Parsed ${rows.length} rows across ${Object.keys(grouped).length} companies.`);
  }

  function handleCsvFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setCsvText(ev.target.result || '');
    reader.readAsText(file);
    e.target.value = '';
  }

  // ─── CSV batch run ────────────────────────────────────────────────────────
  async function handleCsvRun() {
    const slugs = Object.keys(csvGroups);
    if (slugs.length === 0) return;
    setCsvRunning(true);

    // Mark all as pending
    setCsvGroups((prev) => {
      const updated = { ...prev };
      slugs.forEach((slug) => { updated[slug] = { ...updated[slug], status: 'running' }; });
      return updated;
    });

    const tasks = slugs.map((slug) => async () => {
      const group = csvGroups[slug];
      return bulkAddQuestions({
        companyName: group.companyName,
        questions: group.questions,
      });
    });

    await runWithConcurrency(tasks, (idx, outcome) => {
      const slug = slugs[idx];
      setCsvGroups((prev) => ({
        ...prev,
        [slug]: {
          ...prev[slug],
          status: outcome.status === 'fulfilled' ? 'success' : 'error',
          result: outcome.status === 'fulfilled'
            ? outcome.value
            : (outcome.reason?.response?.data?.message || 'Request failed.'),
        },
      }));
    }, 6);

    setCsvRunning(false);
    toast.success('Bulk import complete. Check per-company results below.');
  }

  // ─── CSV individual retry ─────────────────────────────────────────────────
  async function retryCsvCompany(slug) {
    const group = csvGroups[slug];
    setCsvGroups((prev) => ({ ...prev, [slug]: { ...prev[slug], status: 'running', result: null } }));
    try {
      const result = await bulkAddQuestions({
        companyName: group.companyName,
        questions: group.questions,
      });
      setCsvGroups((prev) => ({ ...prev, [slug]: { ...prev[slug], status: 'success', result } }));
    } catch (err) {
      const msg = err?.response?.data?.message || 'Request failed.';
      setCsvGroups((prev) => ({ ...prev, [slug]: { ...prev[slug], status: 'error', result: msg } }));
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  const isExisting = companyLookup.status === 'found';
  const isNew = companyLookup.status === 'not-found';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-16">
      {/* ── Page header ── */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center shadow-sm shrink-0">
              <PlusCircle className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-bold text-slate-900 dark:text-white leading-tight truncate">
                Company Question Upload
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Add or append interview questions to any company
              </p>
            </div>
          </div>
          {/* Mode toggle */}
          <div className="flex shrink-0 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 gap-1">
            {['manual', 'csv'].map((m) => (
              <button
                key={m}
                id={`mode-${m}`}
                onClick={() => setMode(m)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  mode === m
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                {m === 'manual' ? '✎ Manual' : '📄 CSV Bulk'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* ════════════════════════════════════════════════════════════════
            MANUAL MODE
        ════════════════════════════════════════════════════════════════ */}
        {mode === 'manual' && (
          <form onSubmit={handleManualSubmit} className="space-y-5" noValidate>
            {/* Company Card */}
            <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-indigo-500" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Company
                  </span>
                </div>
                {companyLookup.status === 'searching' && (
                  <Loader2 className="w-3.5 h-3.5 text-slate-400 animate-spin" />
                )}
                {isExisting && (
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Existing — questions will be appended
                  </span>
                )}
                {isNew && (
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2.5 py-1 rounded-full border border-indigo-200 dark:border-indigo-800">
                    <PlusCircle className="w-3.5 h-3.5" />
                    New company will be created
                  </span>
                )}
              </div>

              <div className="p-5 space-y-4">
                {/* Company name */}
                <div>
                  <label htmlFor="company-name" className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                    Company Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="company-name"
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Google, Tata Consultancy Services"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition-all"
                    autoComplete="off"
                  />
                </div>

                {/* Optional fields toggle */}
                {isNew && (
                  <button
                    type="button"
                    onClick={() => setShowCompanyFields((v) => !v)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                  >
                    {showCompanyFields ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    {showCompanyFields ? 'Hide' : 'Add'} company details (optional)
                  </button>
                )}

                {isNew && showCompanyFields && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 border-t border-slate-100 dark:border-slate-800">
                    {[
                      { id: 'description', label: 'Description', value: description, setter: setDescription, placeholder: 'Brief company overview…', textarea: true, span: 2 },
                      { id: 'tags', label: 'Tags', value: tags, setter: setTags, placeholder: 'e.g. IT, Product, FAANG' },
                      { id: 'sector', label: 'Sector', value: sector, setter: setSector, placeholder: 'e.g. Technology' },
                      { id: 'tier', label: 'Tier', value: tier, setter: setTier, placeholder: 'e.g. Tier-1' },
                      { id: 'ctc', label: 'CTC', value: ctc, setter: setCtc, placeholder: 'e.g. 18–32 LPA' },
                      { id: 'website', label: 'Website', value: website, setter: setWebsite, placeholder: 'https://…' },
                    ].map(({ id, label, value, setter, placeholder, textarea, span }) => (
                      <div key={id} className={span === 2 ? 'sm:col-span-2' : ''}>
                        <label htmlFor={`company-${id}`} className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                          {label}
                        </label>
                        {textarea ? (
                          <textarea
                            id={`company-${id}`}
                            rows={2}
                            value={value}
                            onChange={(e) => setter(e.target.value)}
                            placeholder={placeholder}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition-all resize-none"
                          />
                        ) : (
                          <input
                            id={`company-${id}`}
                            type="text"
                            value={value}
                            onChange={(e) => setter(e.target.value)}
                            placeholder={placeholder}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition-all"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* Questions Card */}
            <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-500" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Questions
                  </span>
                  <span className="ml-1 px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 text-xs font-bold">
                    {questions.length}
                  </span>
                </div>
                <button
                  type="button"
                  id="add-question-btn"
                  onClick={addQuestion}
                  className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  Add question
                </button>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {questions.map((q, idx) => (
                  <QuestionRow
                    key={q.id}
                    index={idx}
                    question={q}
                    canDelete={questions.length > 1}
                    onUpdate={updateQuestion}
                    onDelete={removeQuestion}
                  />
                ))}
              </div>
            </section>

            {/* Submit */}
            <div className="flex items-center justify-end gap-3">
              <Button
                type="submit"
                id="manual-submit-btn"
                isDisabled={submitting}
                isLoading={submitting}
              >
                {!submitting && <><CheckCircle2 className="w-4 h-4" /> Submit Questions</>}
                {submitting && 'Submitting…'}
              </Button>
            </div>
          </form>
        )}

        {/* ════════════════════════════════════════════════════════════════
            CSV BULK MODE
        ════════════════════════════════════════════════════════════════ */}
        {mode === 'csv' && (
          <div className="space-y-5">
            {/* Info */}
            <div className="flex items-start gap-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-2xl px-4 py-3.5">
              <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
              <div className="text-xs text-indigo-800 dark:text-indigo-300 space-y-1">
                <p className="font-semibold">CSV Format (first row = header, then data rows):</p>
                <code className="block bg-indigo-100 dark:bg-indigo-900/50 px-2 py-1 rounded-lg font-mono text-[11px]">
                  companyName, questionText, topicTags, difficulty, year
                </code>
                <p>Rows with the same company name (case-insensitive) are grouped automatically before sending.</p>
              </div>
            </div>

            {/* Input area */}
            <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Paste or Upload CSV
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    id="csv-upload-btn"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Upload file
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,text/csv"
                    onChange={handleCsvFile}
                    className="hidden"
                  />
                </div>
              </div>
              <div className="p-4">
                <textarea
                  id="csv-textarea"
                  rows={8}
                  value={csvText}
                  onChange={(e) => { setCsvText(e.target.value); setCsvParsed(false); setCsvGroups({}); }}
                  placeholder={`companyName,questionText,topicTags,difficulty,year\nGoogle,Two Sum,Arrays,Easy,2024\nGoogle,LRU Cache,Design,Hard,2023\nMicrosoft,Merge Intervals,Arrays,Medium,2024`}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition-all resize-y"
                />
              </div>
              <div className="px-5 pb-4 flex items-center gap-3">
                <Button
                  type="button"
                  id="csv-parse-btn"
                  onClick={handleCsvParse}
                  variant="secondary"
                >
                  <FileText className="w-4 h-4" />
                  Parse &amp; Preview
                </Button>
                {csvParsed && (
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {Object.keys(csvGroups).length} companies detected
                  </span>
                )}
              </div>
            </section>

            {/* Preview + status table */}
            {csvParsed && Object.keys(csvGroups).length > 0 && (
              <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 flex-wrap">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Companies to import — {Object.keys(csvGroups).length} total
                  </span>
                  <Button
                    type="button"
                    id="csv-run-btn"
                    onClick={handleCsvRun}
                    disabled={csvRunning}
                    className="flex items-center gap-2"
                  >
                    {csvRunning ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Running…</>
                    ) : (
                      <><Upload className="w-4 h-4" /> Start Import</>
                    )}
                  </Button>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {Object.entries(csvGroups).map(([slug, group]) => (
                    <CsvGroupRow
                      key={slug}
                      group={group}
                      onRetry={() => retryCsvCompany(slug)}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Question Row sub-component ───────────────────────────────────────────────
function QuestionRow({ index, question, canDelete, onUpdate, onDelete }) {
  return (
    <div className="p-5 group transition-colors hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
      {/* Row header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          Q{index + 1}
        </span>
        {canDelete && (
          <button
            type="button"
            id={`delete-q-${question.id}`}
            onClick={() => onDelete(question.id)}
            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-all"
            title="Remove question"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="space-y-3">
        {/* Question text */}
        <div>
          <textarea
            id={`q-text-${question.id}`}
            rows={2}
            value={question.questionText}
            onChange={(e) => onUpdate(question.id, 'questionText', e.target.value)}
            placeholder="Enter the interview question…"
            className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition-all resize-none ${
              question.error ? 'border-red-400 dark:border-red-500' : 'border-slate-200 dark:border-slate-700'
            }`}
          />
          {question.error && (
            <p className="mt-1 text-xs text-red-500 dark:text-red-400 flex items-center gap-1">
              <XCircle className="w-3 h-3" />
              {question.error}
            </p>
          )}
        </div>

        {/* Metadata row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Topic tags */}
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Topic Tags
            </label>
            <input
              id={`q-tags-${question.id}`}
              type="text"
              value={question.topicTags}
              onChange={(e) => onUpdate(question.id, 'topicTags', e.target.value)}
              placeholder="Arrays, DP…"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition-all"
            />
          </div>

          {/* Difficulty */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Difficulty
            </label>
            <div className="relative">
              <select
                id={`q-diff-${question.id}`}
                value={question.difficulty}
                onChange={(e) => onUpdate(question.id, 'difficulty', e.target.value)}
                className={`w-full appearance-none px-3 py-2 pr-7 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition-all cursor-pointer ${DIFF_COLORS[question.difficulty]}`}
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-current opacity-60" />
            </div>
          </div>

          {/* Year */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Year
            </label>
            <input
              id={`q-year-${question.id}`}
              type="number"
              min="2000"
              max="2030"
              value={question.year}
              onChange={(e) => onUpdate(question.id, 'year', e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition-all"
            />
          </div>

          {/* Round title (optional) */}
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Round Title <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <input
              id={`q-round-${question.id}`}
              type="text"
              value={question.roundTitle}
              onChange={(e) => onUpdate(question.id, 'roundTitle', e.target.value)}
              placeholder="e.g. Online Assessment"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition-all"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── CSV Group Row sub-component ──────────────────────────────────────────────
function CsvGroupRow({ group, onRetry }) {
  const statusConfig = {
    pending: { icon: <Loader2 className="w-4 h-4 text-slate-400" />, label: 'Pending', cls: 'text-slate-500' },
    running: { icon: <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />, label: 'Submitting…', cls: 'text-indigo-500' },
    success: { icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />, label: 'Done', cls: 'text-emerald-600 dark:text-emerald-400' },
    error: { icon: <XCircle className="w-4 h-4 text-red-500" />, label: 'Failed', cls: 'text-red-600 dark:text-red-400' },
  };
  const cfg = statusConfig[group.status] || statusConfig.pending;

  return (
    <div className="px-5 py-3.5 flex items-center gap-4 flex-wrap sm:flex-nowrap">
      {/* Status icon */}
      <div className="shrink-0">{cfg.icon}</div>

      {/* Company info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
          {group.companyName}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {group.questions.length} question{group.questions.length !== 1 ? 's' : ''}
          {group.status === 'success' && group.result && (
            <span className="ml-2 text-emerald-600 dark:text-emerald-400">
              — {group.result.isNew ? 'Created' : 'Appended'} · {group.result.questionsInserted} inserted
            </span>
          )}
          {group.status === 'error' && group.result && (
            <span className="ml-2 text-red-500 dark:text-red-400">— {group.result}</span>
          )}
        </p>
      </div>

      {/* Status badge */}
      <span className={`shrink-0 text-xs font-semibold ${cfg.cls}`}>
        {cfg.label}
      </span>

      {/* Retry button */}
      {group.status === 'error' && (
        <button
          type="button"
          onClick={onRetry}
          className="shrink-0 flex items-center gap-1.5 text-xs font-semibold text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-2.5 py-1.5 rounded-lg transition-all"
        >
          <RotateCcw className="w-3 h-3" />
          Retry
        </button>
      )}
    </div>
  );
}
