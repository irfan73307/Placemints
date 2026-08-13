import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  CirclePlus,
  DatabaseZap,
  Loader2,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import apiClient from "../services/api";
import { Input } from "../components/Input";
import Button from "../components/Button";
import Badge from "../components/Badge";
import { useToast } from "../contexts/ToastContext";

const DEFAULT_QUESTION = {
  questionText: "",
  topicTags: "DSA",
  difficulty: "Medium",
  year: new Date().getFullYear(),
  roundTitle: "",
};

function normalizeCompanySlug(companyName) {
  return String(companyName || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function normalizeDifficulty(value) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();
  if (normalized === "easy") return "Easy";
  if (normalized === "hard") return "Hard";
  return "Medium";
}

function parseCsvRows(text) {
  const rows = String(text || "")
    .split(/\r?\n/)
    .map((row) => row.trim())
    .filter(Boolean);

  if (rows.length === 0) return [];

  const hasHeader = /companyname|questiontext/i.test(rows[0]);
  const dataRows = hasHeader ? rows.slice(1) : rows;

  return dataRows
    .map((row) =>
      row
        .split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/)
        .map((part) => part.trim().replace(/^"|"$/g, "")),
    )
    .filter((columns) => columns.length >= 2)
    .map((columns) => ({
      companyName: columns[0] || "",
      questionText: columns[1] || "",
      topicTags: columns[2] || "DSA",
      difficulty: normalizeDifficulty(columns[3]),
      year: parseInt(columns[4], 10) || new Date().getFullYear(),
      roundTitle: columns[5] || "",
    }));
}

function groupRowsByCompany(rows) {
  const grouped = new Map();

  rows.forEach((row) => {
    const companyName = String(row.companyName || "").trim();
    if (!companyName) return;

    const slug = normalizeCompanySlug(companyName);
    if (!slug) return;

    if (!grouped.has(slug)) {
      grouped.set(slug, {
        slug,
        companyName,
        questions: [],
        status: "pending",
        message: "",
        insertedCount: 0,
        skippedCount: 0,
      });
    }

    grouped.get(slug).questions.push({
      questionText: String(row.questionText || "").trim(),
      topicTags: String(row.topicTags || "").trim() || "DSA",
      difficulty: normalizeDifficulty(row.difficulty),
      year: parseInt(row.year, 10) || new Date().getFullYear(),
      roundTitle: String(row.roundTitle || "").trim(),
    });
  });

  return Array.from(grouped.values());
}

async function runWithConcurrencyLimit(items, limit, worker) {
  const queue = items.slice();
  const runners = Array.from(
    { length: Math.min(limit, queue.length) },
    async () => {
      while (queue.length > 0) {
        const item = queue.shift();
        if (!item) break;
        await worker(item);
      }
    },
  );

  await Promise.allSettled(runners);
}

export default function AdminCompanyQuestions() {
  const toast = useToast();
  const [mode, setMode] = useState("single");
  const [companyName, setCompanyName] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [tier, setTier] = useState("");
  const [ctc, setCtc] = useState("");
  const [website, setWebsite] = useState("");
  const [sector, setSector] = useState("");
  const [questionRows, setQuestionRows] = useState([DEFAULT_QUESTION]);
  const [companyLookup, setCompanyLookup] = useState({
    status: "idle",
    exists: false,
    company: null,
  });
  const [lookupLoading, setLookupLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [singleErrors, setSingleErrors] = useState({});
  const [bulkText, setBulkText] = useState("");
  const [bulkFileName, setBulkFileName] = useState("");
  const [bulkJobs, setBulkJobs] = useState([]);
  const [bulkSummary, setBulkSummary] = useState({
    total: 0,
    success: 0,
    failed: 0,
    pending: 0,
  });
  const fileInputRef = React.useRef(null);

  useEffect(() => {
    const normalized = companyName.trim();
    if (!normalized) {
      setLookupLoading(false);
      setCompanyLookup({ status: "idle", exists: false, company: null });
      return undefined;
    }

    let isActive = true;
    const timer = window.setTimeout(async () => {
      setLookupLoading(true);
      try {
        const response = await apiClient.get("/companies", {
          params: { search: normalized },
        });
        const slug = normalizeCompanySlug(normalized);
        const existingCompany = (response.data?.data || []).find(
          (company) => company.slug === slug,
        );

        if (!isActive) return;

        setCompanyLookup({
          status: existingCompany ? "existing" : "new",
          exists: Boolean(existingCompany),
          company: existingCompany || null,
        });
      } catch (error) {
        if (!isActive) return;
        setCompanyLookup({ status: "idle", exists: false, company: null });
      } finally {
        if (!isActive) return;
        setLookupLoading(false);
      }
    }, 400);

    return () => {
      isActive = false;
      window.clearTimeout(timer);
    };
  }, [companyName]);

  useEffect(() => {
    const success = bulkJobs.filter((job) => job.status === "success").length;
    const failed = bulkJobs.filter((job) => job.status === "failed").length;
    const pending = bulkJobs.filter(
      (job) => job.status === "pending" || job.status === "running",
    ).length;

    setBulkSummary({
      total: bulkJobs.length,
      success,
      failed,
      pending,
    });
  }, [bulkJobs]);

  const lookupBadge = useMemo(() => {
    if (lookupLoading) {
      return <Badge variant="info">Checking company...</Badge>;
    }

    if (companyLookup.exists) {
      return (
        <Badge variant="success">
          ✓ Existing company - questions will be appended
        </Badge>
      );
    }

    if (companyLookup.status === "new" && companyName.trim()) {
      return <Badge variant="warning">+ New company will be created</Badge>;
    }

    return null;
  }, [companyLookup.exists, companyLookup.status, companyName, lookupLoading]);

  const updateQuestionRow = (index, field, value) => {
    setQuestionRows((current) =>
      current.map((row, rowIndex) =>
        rowIndex === index ? { ...row, [field]: value } : row,
      ),
    );
    setSingleErrors((current) => ({
      ...current,
      [index]: {
        ...(current[index] || {}),
        [field]: "",
      },
    }));
  };

  const addQuestionRow = () => {
    setQuestionRows((current) => [
      ...current,
      { ...DEFAULT_QUESTION, year: new Date().getFullYear() },
    ]);
  };

  const removeQuestionRow = (index) => {
    setQuestionRows((current) =>
      current.length === 1
        ? current
        : current.filter((_, rowIndex) => rowIndex !== index),
    );
    setSingleErrors((current) => {
      const next = { ...current };
      delete next[index];
      const reindexed = {};
      Object.entries(next).forEach(([key, value]) => {
        if (key === "companyName") {
          reindexed.companyName = value;
          return;
        }

        const numericKey = Number(key);
        reindexed[numericKey > index ? numericKey - 1 : numericKey] = value;
      });
      return reindexed;
    });
  };

  const validateSingleForm = () => {
    const errors = {};

    if (!companyName.trim()) {
      errors.companyName = "Company name is required.";
    }

    const rowErrors = {};
    questionRows.forEach((row, index) => {
      if (!String(row.questionText || "").trim()) {
        rowErrors[index] = { questionText: "Question text is required." };
      }
    });

    setSingleErrors({
      companyName: errors.companyName || "",
      ...rowErrors,
    });
    return {
      valid:
        Object.keys(errors).length === 0 && Object.keys(rowErrors).length === 0,
      errors,
    };
  };

  const resetSingleForm = () => {
    setCompanyName("");
    setDescription("");
    setTags("");
    setTier("");
    setCtc("");
    setWebsite("");
    setSector("");
    setQuestionRows([{ ...DEFAULT_QUESTION, year: new Date().getFullYear() }]);
    setSingleErrors({});
    setCompanyLookup({ status: "idle", exists: false, company: null });
  };

  const handleSingleSubmit = async (event) => {
    event.preventDefault();
    const validation = validateSingleForm();
    if (!validation.valid) {
      toast.error("Please fix the highlighted fields before submitting.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiClient.post("/admin/companies/bulk-questions", {
        companyName,
        description,
        tags,
        tier,
        ctc,
        website,
        sector,
        questions: questionRows.map((row) => ({
          questionText: String(row.questionText || "").trim(),
          topicTags: String(row.topicTags || "").trim(),
          difficulty: normalizeDifficulty(row.difficulty),
          year: parseInt(row.year, 10) || new Date().getFullYear(),
          roundTitle: String(row.roundTitle || "").trim(),
        })),
      });

      toast.success(
        response.data?.message || "Company questions submitted successfully.",
      );
      resetSingleForm();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to submit company questions.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const loadBulkRows = (rows, fileName = "") => {
    const groups = groupRowsByCompany(rows);
    const preparedJobs = groups.map((group) => ({
      ...group,
      status: "pending",
      message: "",
      insertedCount: 0,
      skippedCount: 0,
    }));
    setBulkJobs(preparedJobs);
    setBulkFileName(fileName);
    toast.success(`Loaded ${preparedJobs.length} companies from CSV.`);
  };

  const handleCsvUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    setBulkText(text);
    loadBulkRows(parseCsvRows(text), file.name);
  };

  const handleParseBulkText = () => {
    loadBulkRows(parseCsvRows(bulkText), bulkFileName);
  };

  const submitBulkJobs = async (jobs, { replaceExisting = false } = {}) => {
    const nextJobs = jobs.map((job) => ({
      ...job,
      status: "pending",
      message: "",
    }));

    if (replaceExisting) {
      setBulkJobs(nextJobs);
    } else {
      const jobsBySlug = new Map(nextJobs.map((job) => [job.slug, job]));
      setBulkJobs((current) =>
        current.map((item) =>
          jobsBySlug.has(item.slug)
            ? {
                ...item,
                status: "pending",
                message: "",
                insertedCount: 0,
                skippedCount: 0,
              }
            : item,
        ),
      );
    }

    await runWithConcurrencyLimit(nextJobs, 6, async (job) => {
      setBulkJobs((current) =>
        current.map((item) =>
          item.slug === job.slug
            ? { ...item, status: "running", message: "Submitting..." }
            : item,
        ),
      );

      try {
        const response = await apiClient.post(
          "/admin/companies/bulk-questions",
          {
            companyName: job.companyName,
            questions: job.questions,
          },
        );

        setBulkJobs((current) =>
          current.map((item) =>
            item.slug === job.slug
              ? {
                  ...item,
                  status: "success",
                  message:
                    response.data?.message ||
                    `Submitted ${job.questions.length} questions successfully.`,
                  insertedCount:
                    response.data?.insertedCount || job.questions.length,
                  skippedCount: response.data?.skippedCount || 0,
                }
              : item,
          ),
        );
      } catch (error) {
        setBulkJobs((current) =>
          current.map((item) =>
            item.slug === job.slug
              ? {
                  ...item,
                  status: "failed",
                  message:
                    error.response?.data?.message ||
                    "Failed to submit company.",
                }
              : item,
          ),
        );
      }
    });
  };

  const handleStartBulkImport = async () => {
    if (bulkJobs.length === 0) {
      toast.error("Load a CSV or paste data before importing.");
      return;
    }

    try {
      await submitBulkJobs(bulkJobs);
      toast.success("Bulk import finished. Review per-company results below.");
    } catch (error) {
      toast.error("Bulk import encountered errors.");
    }
  };

  const retryBulkJob = async (slug) => {
    const job = bulkJobs.find((item) => item.slug === slug);
    if (!job) return;
    await submitBulkJobs([job], { replaceExisting: false });
  };

  return (
    <div className="space-y-6 pb-12 font-sans">
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 rounded-3xl text-white shadow-xl border border-indigo-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-bold uppercase tracking-wider">
            <DatabaseZap className="w-4 h-4" />
            <span>Admin Company Question Upload</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Company Addn
          </h1>
          <p className="text-sm text-indigo-200/80 max-w-2xl">
            Submit multiple interview questions at once. Existing companies are
            matched by normalized slug, and new companies are created only when
            needed.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant={mode === "single" ? "primary" : "secondary"}
            size="sm"
            onClick={() => setMode("single")}
            className="gap-2"
          >
            <CirclePlus className="w-4 h-4" />
            <span>Single Company</span>
          </Button>
          <Button
            variant={mode === "bulk" ? "primary" : "secondary"}
            size="sm"
            onClick={() => setMode("bulk")}
            className="gap-2"
          >
            <Upload className="w-4 h-4" />
            <span>Bulk CSV</span>
          </Button>
        </div>
      </div>

      {mode === "single" && (
        <form onSubmit={handleSingleSubmit} className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex items-start justify-between gap-3 flex-col lg:flex-row lg:items-center">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Company Resolution
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Use the exact company name you want to resolve. Matching is
                  done by normalized slug.
                </p>
              </div>
              <div>{lookupBadge}</div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Input
                label="Company Name"
                value={companyName}
                onChange={(event) => {
                  setCompanyName(event.target.value);
                  setSingleErrors((current) => ({
                    ...current,
                    companyName: "",
                  }));
                }}
                placeholder="Google, TCS, Zoho..."
                error={singleErrors.companyName}
              />
              <Input
                label="Website"
                value={website}
                onChange={(event) => setWebsite(event.target.value)}
                placeholder="https://company.com"
              />
              <Input
                label="Tier"
                value={tier}
                onChange={(event) => setTier(event.target.value)}
                placeholder="Product-based"
              />
              <Input
                label="CTC"
                value={ctc}
                onChange={(event) => setCtc(event.target.value)}
                placeholder="₹8 - 18 LPA"
              />
              <Input
                label="Sector"
                value={sector}
                onChange={(event) => setSector(event.target.value)}
                placeholder="IT Services / Product"
              />
              <Input
                label="Tags"
                value={tags}
                onChange={(event) => setTags(event.target.value)}
                placeholder="Product-based, Core Software"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1.5">
                Description
              </label>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Used only when a new company is created..."
                className="w-full min-h-28 px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 shadow-subtle outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                {companyLookup.exists
                  ? "This metadata is ignored because the company already exists."
                  : "This metadata is used only when the company does not already exist."}
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between gap-3 flex-col sm:flex-row">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Questions
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Add as many questions as needed, then submit once.
                </p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={addQuestionRow}
                type="button"
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add another question</span>
              </Button>
            </div>

            <div className="space-y-4">
              {questionRows.map((row, index) => (
                <div
                  key={`${index}-${row.questionText || "row"}`}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-4 space-y-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      <Badge variant="neutral" size="xs">
                        Question {index + 1}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      type="button"
                      onClick={() => removeQuestionRow(index)}
                      className="gap-2 text-red-600 dark:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Remove</span>
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <Input
                      label="Question Text"
                      value={row.questionText}
                      onChange={(event) =>
                        updateQuestionRow(
                          index,
                          "questionText",
                          event.target.value,
                        )
                      }
                      placeholder="Describe a challenge you solved..."
                      error={singleErrors[index]?.questionText}
                    />
                    <Input
                      label="Topic Tags"
                      value={row.topicTags}
                      onChange={(event) =>
                        updateQuestionRow(
                          index,
                          "topicTags",
                          event.target.value,
                        )
                      }
                      placeholder="DSA, Arrays, DP"
                    />
                    <div>
                      <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1.5">
                        Difficulty
                      </label>
                      <select
                        value={row.difficulty}
                        onChange={(event) =>
                          updateQuestionRow(
                            index,
                            "difficulty",
                            event.target.value,
                          )
                        }
                        className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                      >
                        <option>Easy</option>
                        <option>Medium</option>
                        <option>Hard</option>
                      </select>
                    </div>
                    <Input
                      label="Year"
                      type="number"
                      value={row.year}
                      onChange={(event) =>
                        updateQuestionRow(index, "year", event.target.value)
                      }
                      placeholder="2026"
                    />
                  </div>

                  <Input
                    label="Round Title"
                    value={row.roundTitle}
                    onChange={(event) =>
                      updateQuestionRow(index, "roundTitle", event.target.value)
                    }
                    placeholder="Online Assessment, Technical Interview, HR..."
                  />
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 flex-wrap">
              <Button
                variant="secondary"
                size="sm"
                type="button"
                onClick={resetSingleForm}
                className="gap-2"
              >
                Reset
              </Button>
              <Button
                variant="primary"
                size="sm"
                type="submit"
                isLoading={isSubmitting}
                className="gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Submit Questions</span>
              </Button>
            </div>
          </div>
        </form>
      )}

      {mode === "bulk" && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Bulk CSV Mode
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Paste rows or upload a CSV with companyName, questionText,
                  topicTags, difficulty, year, roundTitle.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="info">Companies: {bulkSummary.total}</Badge>
                <Badge variant="success">Success: {bulkSummary.success}</Badge>
                <Badge variant="danger">Failed: {bulkSummary.failed}</Badge>
                <Badge variant="warning">Pending: {bulkSummary.pending}</Badge>
              </div>
            </div>

            <textarea
              value={bulkText}
              onChange={(event) => setBulkText(event.target.value)}
              placeholder={
                "companyName,questionText,topicTags,difficulty,year,roundTitle\nGoogle,Explain caching,DSA,Medium,2026,Technical Interview"
              }
              className="w-full min-h-56 px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 shadow-subtle outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-mono"
            />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-wrap">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleCsvUpload}
                  className="hidden"
                />
                <Button
                  variant="secondary"
                  size="sm"
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="gap-2"
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload CSV</span>
                </Button>
                {bulkFileName && (
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Loaded: {bulkFileName}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="secondary"
                  size="sm"
                  type="button"
                  onClick={handleParseBulkText}
                  className="gap-2"
                >
                  <DatabaseZap className="w-4 h-4" />
                  <span>Parse Rows</span>
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  type="button"
                  onClick={handleStartBulkImport}
                  className="gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Start Import</span>
                </Button>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Company Progress
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Each company runs independently, so one failure does not block
                  the rest.
                </p>
              </div>
              <Badge variant="neutral">Concurrency capped at 6 requests</Badge>
            </div>

            <div className="space-y-3">
              {bulkJobs.length === 0 && (
                <div className="flex items-center gap-3 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-5 text-sm text-slate-500 dark:text-slate-400">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  <span>
                    No parsed companies yet. Paste CSV rows or upload a file to
                    build the queue.
                  </span>
                </div>
              )}

              {bulkJobs.map((job) => (
                <div
                  key={job.slug}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {job.companyName}
                      </h3>
                      {job.status === "pending" && (
                        <Badge variant="neutral">Pending</Badge>
                      )}
                      {job.status === "running" && (
                        <Badge variant="info">Running</Badge>
                      )}
                      {job.status === "success" && (
                        <Badge variant="success">Success</Badge>
                      )}
                      {job.status === "failed" && (
                        <Badge variant="danger">Failed</Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {job.questions.length} question(s) queued for {job.slug}
                    </p>
                    {job.message && (
                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        {job.message}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="default">
                      Inserted: {job.insertedCount}
                    </Badge>
                    <Badge variant="default">Skipped: {job.skippedCount}</Badge>
                    {job.status === "failed" && (
                      <Button
                        variant="secondary"
                        size="sm"
                        type="button"
                        onClick={() => retryBulkJob(job.slug)}
                        className="gap-2"
                      >
                        <Loader2 className="w-4 h-4" />
                        <span>Retry</span>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
