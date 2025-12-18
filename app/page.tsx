"use client";

import { useState, useMemo, useEffect } from "react";
import { useQuestions } from "./hooks/useQuestions";
import Link from "next/link";
import { Menu, X, Check } from "lucide-react";

const PAGE_SIZE_OPTIONS = [5, 10, 25, 50, 100];

export default function Home() {
  const {
    questions,
    allTags,
    addTag,
    removeTag,
    updateNote,
    loading,
    userId,
    userEmail,
  } = useQuestions();

  // Filters
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([
    "math",
    "english",
  ]);
  const [selectedDifficulties, setSelectedDifficulties] = useState<string[]>(
    []
  );
  const [showAnswerFor, setShowAnswerFor] = useState<Record<string, boolean>>(
    {}
  );
  const [showNotesFor, setShowNotesFor] = useState<Record<string, boolean>>({});

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Mobile sidebar toggle
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // PDF export selection
  const [selectedForExport, setSelectedForExport] = useState<Set<string>>(
    new Set()
  );

  // Filter logic
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      if (selectedSubjects.length > 0 && !selectedSubjects.includes(q.subject))
        return false;
      if (selectedDifficulties.length > 0) {
        if (!selectedDifficulties.includes(q.difficulty || "")) return false;
      }
      if (selectedTags.length > 0) {
        // AND logic
        const hasAll = selectedTags.every((t) => q.tags.includes(t));
        if (!hasAll) return false;
      }
      return true;
    });
  }, [questions, selectedSubjects, selectedTags, selectedDifficulties]);

  // Pagination logic
  const totalPages = Math.ceil(filteredQuestions.length / itemsPerPage);
  const currentQuestions = filteredQuestions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset page when filters change
  useMemo(() => {
    setCurrentPage(1);
  }, [selectedTags, selectedSubjects, selectedDifficulties, itemsPerPage]);

  // Scroll to top when page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [currentPage]);

  const toggleTagFilter = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const toggleAnswer = (id: string) => {
    setShowAnswerFor((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const toggleExportSelection = (id: string) => {
    setSelectedForExport((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAllForExport = () => {
    setSelectedForExport(new Set(filteredQuestions.map((q) => q.id)));
  };

  const deselectAllForExport = () => {
    setSelectedForExport(new Set());
  };

  const handlePrint = () => {
    window.print();
  };

  // Questions to display for print (all selected across all pages)
  const questionsForPrint =
    selectedForExport.size > 0
      ? filteredQuestions.filter((q) => selectedForExport.has(q.id))
      : currentQuestions;

  if (loading) return <div className="p-4 md:p-10">Loading questions...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8 font-sans">
      {/* Header */}
      <header className="mb-6 md:mb-8 print:hidden">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
            SAT Question Bank
          </h1>
          <div className="flex items-center gap-2 md:gap-4 flex-wrap">
            {userId ? (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-600 hidden sm:inline">
                  {userEmail}
                </span>
                <Link href="/auth" className="text-blue-600 hover:underline">
                  Account
                </Link>
              </div>
            ) : (
              <Link
                href="/auth"
                className="bg-gray-200 text-gray-700 px-3 py-1.5 md:px-4 md:py-2 rounded hover:bg-gray-300 cursor-pointer text-sm md:text-base"
              >
                Sign In
              </Link>
            )}
            <div className="hidden sm:flex items-center gap-2">
              {selectedForExport.size > 0 && (
                <span className="text-sm text-gray-600">
                  {selectedForExport.size} selected
                </span>
              )}
              <button
                onClick={handlePrint}
                className="bg-blue-600 text-white px-3 py-1.5 md:px-4 md:py-2 rounded hover:bg-blue-700 cursor-pointer text-sm md:text-base"
              >
                {selectedForExport.size > 0
                  ? `Export ${selectedForExport.size} to PDF`
                  : "Export to PDF"}
              </button>
            </div>
            {/* Mobile filter toggle */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden bg-gray-200 text-gray-700 p-2 rounded hover:bg-gray-300 cursor-pointer"
            >
              {sidebarOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row gap-4 lg:gap-8 print:block">
        {/* Sidebar Filters - Mobile overlay or desktop sidebar */}
        <div
          className={`
            ${sidebarOpen ? "block" : "hidden"} lg:block
            lg:w-64 lg:shrink-0 print:hidden
            fixed lg:static inset-0 top-[120px] z-40 lg:z-auto
            bg-gray-100 lg:bg-transparent p-4 lg:p-0
            overflow-y-auto
          `}
        >
          <div className="bg-white p-4 rounded shadow mb-4">
            <h3 className="font-bold mb-2">Subject</h3>
            <div className="flex flex-wrap gap-2">
              {[
                { value: "math", label: "Math" },
                { value: "english", label: "English" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setSelectedSubjects((prev) =>
                      prev.includes(opt.value)
                        ? prev.filter((s) => s !== opt.value)
                        : [...prev, opt.value]
                    );
                  }}
                  className={`px-3 py-1.5 rounded text-sm border cursor-pointer ${
                    selectedSubjects.includes(opt.value)
                      ? "bg-blue-100 border-blue-500 text-blue-700"
                      : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <h3 className="font-bold mb-2 mt-4">Difficulty</h3>
            <div className="flex flex-wrap gap-2">
              {["Easy", "Medium", "Hard"].map((diff) => (
                <button
                  key={diff}
                  onClick={() => {
                    setSelectedDifficulties((prev) =>
                      prev.includes(diff)
                        ? prev.filter((d) => d !== diff)
                        : [...prev, diff]
                    );
                  }}
                  className={`px-3 py-1.5 rounded text-sm border cursor-pointer ${
                    selectedDifficulties.includes(diff)
                      ? "bg-blue-100 border-blue-500 text-blue-700"
                      : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>

            <h3 className="font-bold mb-2 mt-4">Questions per Page</h3>
            <div className="flex flex-wrap gap-2">
              {PAGE_SIZE_OPTIONS.map((size) => (
                <button
                  key={size}
                  onClick={() => setItemsPerPage(size)}
                  className={`px-3 py-1.5 rounded text-sm border cursor-pointer ${
                    itemsPerPage === size
                      ? "bg-blue-100 border-blue-500 text-blue-700"
                      : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white p-4 rounded shadow">
            <h3 className="font-bold mb-2">Filter by Tags</h3>
            {allTags.length === 0 && (
              <p className="text-gray-500 text-sm">No tags created yet.</p>
            )}
            <div className="flex flex-wrap gap-2">
              {allTags.map((tag) => {
                const tagCount = questions.filter((q) =>
                  q.tags.includes(tag)
                ).length;
                const percentage = (
                  (tagCount / questions.length) *
                  100
                ).toFixed(1);
                return (
                  <button
                    key={tag}
                    onClick={() => {
                      toggleTagFilter(tag);
                      setSidebarOpen(false);
                    }}
                    className={`px-2 py-1 rounded text-sm border cursor-pointer ${
                      selectedTags.includes(tag)
                        ? "bg-blue-100 border-blue-500 text-blue-700"
                        : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                    }`}
                    title={`${tagCount} questions (${percentage}%)`}
                  >
                    {tag}{" "}
                    <span className="text-xs opacity-60">({percentage}%)</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Close button for mobile */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden mt-4 w-full bg-gray-800 text-white py-2 rounded cursor-pointer"
          >
            Apply Filters
          </button>
        </div>

        {/* Overlay backdrop for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/30 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div className="mb-4 text-gray-600 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 print:hidden">
            <div className="flex items-center gap-3">
              <span className="text-sm md:text-base">
                Total {filteredQuestions.length} problems
              </span>
              <div className="flex gap-1">
                <button
                  onClick={selectAllForExport}
                  className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 cursor-pointer transition-colors"
                >
                  Select All
                </button>
                {selectedForExport.size > 0 && (
                  <button
                    onClick={deselectAllForExport}
                    className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-red-100 text-gray-500 hover:text-red-600 cursor-pointer transition-colors"
                  >
                    Clear ({selectedForExport.size})
                  </button>
                )}
              </div>
            </div>

            {/* Pagination Controls Top */}
            {totalPages > 1 && (
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            )}
          </div>

          <div className="space-y-6 md:space-y-8">
            {currentQuestions.map((q) => (
              <div
                key={q.id}
                className={`bg-white p-4 md:p-6 rounded shadow break-inside-avoid print:shadow-none print:border transition-all ${
                  selectedForExport.has(q.id)
                    ? "ring-2 ring-blue-500 ring-offset-2"
                    : ""
                } ${
                  selectedForExport.size > 0 && !selectedForExport.has(q.id)
                    ? "print:hidden"
                    : ""
                }`}
              >
                {/* Question header - stacks on mobile */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-4">
                  <div className="flex flex-wrap gap-1 items-center">
                    {/* Export selection button */}
                    <button
                      onClick={() => toggleExportSelection(q.id)}
                      className={`w-5 h-5 mr-2 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all print:hidden ${
                        selectedForExport.has(q.id)
                          ? "bg-blue-600 border-blue-600 text-white"
                          : "border-gray-300 hover:border-blue-400"
                      }`}
                      title="Select for PDF export"
                    >
                      {selectedForExport.has(q.id) && (
                        <Check className="w-3 h-3" strokeWidth={3} />
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setSelectedSubjects((prev) =>
                          prev.includes(q.subject)
                            ? prev.filter((s) => s !== q.subject)
                            : [...prev, q.subject]
                        );
                      }}
                      className="inline-block bg-gray-200 rounded px-2 py-1 text-xs font-bold text-gray-700 hover:bg-gray-300 cursor-pointer"
                    >
                      {q.subject.toUpperCase()}
                    </button>
                    <button
                      onClick={() => {
                        const diff = q.difficulty || "";
                        setSelectedDifficulties((prev) =>
                          prev.includes(diff)
                            ? prev.filter((d) => d !== diff)
                            : [...prev, diff]
                        );
                      }}
                      className="inline-block bg-gray-200 rounded px-2 py-1 text-xs font-bold text-gray-700 hover:bg-gray-300 cursor-pointer"
                    >
                      {q.difficulty}
                    </button>
                    <Link
                      href={`/question/${q.id}`}
                      className="inline-block bg-blue-100 text-blue-700 rounded px-2 py-1 text-xs font-bold hover:bg-blue-200 transition-colors"
                    >
                      ID: {q.id}
                    </Link>
                  </div>
                  <div className="print:hidden w-full sm:w-auto">
                    <TagInput
                      existingTags={q.tags}
                      allTags={allTags}
                      onAdd={(t) => addTag(q.id, t)}
                      onRemove={(t) => removeTag(q.id, t)}
                    />
                  </div>
                </div>

                {/* Question Image */}
                <div className="mb-4 bg-gray-50 p-2 md:p-4 rounded border border-gray-200 overflow-x-auto">
                  {q.question_image ? (
                    <img
                      src={`/${q.question_image}`}
                      alt="Question"
                      className="max-w-full md:max-w-2xl max-h-[60vh] w-auto h-auto object-contain"
                    />
                  ) : (
                    <div className="p-4 text-red-500">
                      Question image missing
                    </div>
                  )}
                </div>

                {/* Answer Section */}
                <div className="mt-4">
                  <button
                    onClick={() => toggleAnswer(q.id)}
                    className="bg-blue-600 text-white px-4 md:px-6 py-2 rounded hover:bg-blue-700 transition-colors cursor-pointer text-sm md:text-base"
                  >
                    {showAnswerFor[q.id] ? "Hide Answer" : "Show Answer"}
                  </button>

                  {showAnswerFor[q.id] && (
                    <div className="mt-4 p-3 md:p-4 bg-green-50 rounded border border-green-100 overflow-x-auto">
                      <div className="mb-2 font-bold text-green-800 text-sm md:text-base">
                        Correct Answer: {q.correct_answer || "See details"}
                      </div>
                      {q.answer_image && (
                        <img
                          src={`/${q.answer_image}`}
                          alt="Answer Explanation"
                          className="max-w-full md:max-w-2xl max-h-[60vh] w-auto h-auto object-contain"
                        />
                      )}
                    </div>
                  )}
                </div>

                {/* Notes Section */}
                <div className="mt-4 print:hidden">
                  <button
                    onClick={() =>
                      setShowNotesFor((prev) => ({
                        ...prev,
                        [q.id]: !prev[q.id],
                      }))
                    }
                    className="text-sm text-gray-600 hover:text-gray-800 cursor-pointer flex items-center gap-1"
                  >
                    {showNotesFor[q.id] ? "▼" : "▶"} Notes
                    {q.notes && (
                      <span className="text-xs text-green-600 ml-1">
                        (has notes)
                      </span>
                    )}
                  </button>

                  {showNotesFor[q.id] && (
                    <NoteEditor
                      initialNote={q.notes || ""}
                      onSave={(note) => updateNote(q.id, note)}
                    />
                  )}
                </div>

                {/* Print-only tags and notes display */}
                <div className="hidden print:block mt-2">
                  <p className="text-xs text-gray-500">
                    Tags: {q.tags.join(", ")}
                  </p>
                  {q.notes && (
                    <p className="text-xs text-gray-600 mt-1 whitespace-pre-wrap">
                      Notes: {q.notes}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls Bottom */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6 md:mt-8 print:hidden">
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}

          {/* Print-only section: render all selected questions from all pages */}
          {selectedForExport.size > 0 && (
            <div className="hidden print:block space-y-6">
              {questionsForPrint
                .filter((q) => !currentQuestions.some((cq) => cq.id === q.id))
                .map((q) => (
                  <div
                    key={`print-${q.id}`}
                    className="bg-white p-4 md:p-6 rounded break-inside-avoid print:shadow-none print:border"
                  >
                    <div className="flex flex-wrap gap-1 mb-4">
                      <span className="inline-block bg-gray-200 rounded px-2 py-1 text-xs font-bold text-gray-700">
                        {q.subject.toUpperCase()}
                      </span>
                      <span className="inline-block bg-gray-200 rounded px-2 py-1 text-xs font-bold text-gray-700">
                        {q.difficulty}
                      </span>
                      <span className="inline-block bg-blue-100 text-blue-700 rounded px-2 py-1 text-xs font-bold">
                        ID: {q.id}
                      </span>
                    </div>

                    <div className="mb-4 bg-gray-50 p-2 md:p-4 rounded border border-gray-200">
                      {q.question_image && (
                        <img
                          src={`/${q.question_image}`}
                          alt="Question"
                          className="max-w-full md:max-w-2xl max-h-[60vh] w-auto h-auto object-contain"
                        />
                      )}
                    </div>

                    <div className="mt-2">
                      <p className="text-xs text-gray-500">
                        Tags: {q.tags.join(", ") || "None"}
                      </p>
                      {q.notes && (
                        <p className="text-xs text-gray-600 mt-1 whitespace-pre-wrap">
                          Notes: {q.notes}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TagInput({
  existingTags,
  allTags,
  onAdd,
  onRemove,
}: {
  existingTags: string[];
  allTags: string[];
  onAdd: (t: string) => void;
  onRemove: (t: string) => void;
}) {
  const [input, setInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onAdd(input.trim());
      setInput("");
    }
  };

  const filteredSuggestions = allTags.filter(
    (t) =>
      t.toLowerCase().includes(input.toLowerCase()) && !existingTags.includes(t)
  );

  return (
    <div className="relative w-full sm:w-64 flex flex-col gap-2">
      {/* Tags displayed ABOVE input */}
      {existingTags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-1">
          {existingTags.map((tag) => (
            <span
              key={tag}
              className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded flex items-center"
            >
              {tag}
              <button
                onClick={() => onRemove(tag)}
                className="ml-1 hover:text-red-600 cursor-pointer"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="relative">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder="+ Add tag"
          className="text-sm border rounded px-2 py-1.5 w-full"
        />
        {showSuggestions && input && filteredSuggestions.length > 0 && (
          <div className="absolute top-full left-0 w-full bg-white border rounded shadow mt-1 z-10 max-h-32 overflow-y-auto">
            {filteredSuggestions.map((tag) => (
              <button
                key={tag}
                type="button"
                className="block w-full text-left px-2 py-2 text-sm hover:bg-gray-100 cursor-pointer"
                onClick={() => {
                  onAdd(tag);
                  setInput("");
                }}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </form>
    </div>
  );
}

function PaginationControls({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  const [inputPage, setInputPage] = useState(currentPage.toString());

  // Update input when currentPage changes externally (e.g. filter reset)
  useEffect(() => {
    setInputPage(currentPage.toString());
  }, [currentPage]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const page = parseInt(inputPage);
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      onPageChange(page);
    } else {
      // Reset to current valid page if invalid
      setInputPage(currentPage.toString());
    }
  };

  return (
    <div className="flex gap-1 sm:gap-2 items-center flex-wrap justify-center">
      <button
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="px-2 sm:px-3 py-1 border rounded disabled:opacity-50 bg-white cursor-pointer disabled:cursor-not-allowed text-sm"
      >
        Prev
      </button>

      <form onSubmit={handleSubmit} className="flex items-center gap-1">
        <span className="text-xs sm:text-sm text-gray-600">Page</span>
        <input
          type="text"
          value={inputPage}
          onChange={(e) => setInputPage(e.target.value)}
          onBlur={handleSubmit}
          className="w-10 sm:w-12 border rounded px-1 py-0.5 text-center text-sm"
        />
        <span className="text-xs sm:text-sm text-gray-600">
          of {totalPages}
        </span>
      </form>

      <button
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="px-2 sm:px-3 py-1 border rounded disabled:opacity-50 bg-white cursor-pointer disabled:cursor-not-allowed text-sm"
      >
        Next
      </button>
    </div>
  );
}

function NoteEditor({
  initialNote,
  onSave,
}: {
  initialNote: string;
  onSave: (note: string) => void;
}) {
  const [note, setNote] = useState(initialNote);
  const [saved, setSaved] = useState(true);

  const hasChanges = note !== initialNote;

  const handleSave = () => {
    onSave(note);
    setSaved(true);
  };

  return (
    <div className="mt-2">
      <textarea
        value={note}
        onChange={(e) => {
          setNote(e.target.value);
          setSaved(false);
        }}
        placeholder="Add notes about how to solve this problem..."
        className={`w-full p-2 border rounded text-sm min-h-[80px] resize-y ${
          hasChanges ? "border-yellow-400" : ""
        }`}
      />
      <div className="flex items-center gap-2 mt-2">
        <button
          onClick={handleSave}
          disabled={!hasChanges}
          className={`px-3 py-1 rounded text-sm cursor-pointer transition-colors ${
            hasChanges
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
        >
          Save Note
        </button>
        {hasChanges && (
          <span className="text-xs text-yellow-600">Unsaved changes</span>
        )}
        {!hasChanges && note && (
          <span className="text-xs text-green-600">✓ Saved</span>
        )}
      </div>
    </div>
  );
}
