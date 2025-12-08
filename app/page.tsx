"use client";

import { useState, useMemo, useEffect } from "react";
import { useQuestions } from "./hooks/useQuestions";
import Link from "next/link";
import { Search } from "lucide-react";

const ITEMS_PER_PAGE = 10;

export default function Home() {
  const { questions, allTags, addTag, removeTag, loading, userId, userEmail } =
    useQuestions();

  // Filters
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  const [showAnswerFor, setShowAnswerFor] = useState<Record<string, boolean>>(
    {}
  );

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Filter logic
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      if (selectedSubject !== "all" && q.subject !== selectedSubject)
        return false;
      if (selectedDifficulty !== "all" && q.difficulty !== selectedDifficulty)
        return false;
      if (selectedTags.length > 0) {
        // AND logic
        const hasAll = selectedTags.every((t) => q.tags.includes(t));
        if (!hasAll) return false;
      }
      return true;
    });
  }, [questions, selectedSubject, selectedTags, selectedDifficulty]);

  // Pagination logic
  const totalPages = Math.ceil(filteredQuestions.length / ITEMS_PER_PAGE);
  const currentQuestions = filteredQuestions.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Reset page when filters change
  useMemo(() => {
    setCurrentPage(1);
  }, [selectedTags, selectedSubject, selectedDifficulty]);

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

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <div className="p-10">Loading questions...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-8 font-sans">
      <header className="mb-8 flex justify-between items-center print:hidden">
        <h1 className="text-3xl font-bold text-gray-800">SAT Question Bank</h1>
        <div className="flex items-center gap-4">
          {userId ? (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-600">{userEmail}</span>
              <Link href="/auth" className="text-blue-600 hover:underline">
                Account
              </Link>
            </div>
          ) : (
            <Link
              href="/auth"
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300 cursor-pointer"
            >
              Sign In
            </Link>
          )}
          <button
            onClick={handlePrint}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 cursor-pointer"
          >
            Export to PDF / Print
          </button>
        </div>
      </header>

      <div className="flex gap-8 print:block">
        {/* Sidebar Filters */}
        <div className="w-64 flex-shrink-0 print:hidden">
          <div className="bg-white p-4 rounded shadow mb-4">
            <h3 className="font-bold mb-2">Subject</h3>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full p-2 border rounded mb-2"
            >
              <option value="all">All Subjects</option>
              <option value="math">Math</option>
              <option value="english">English</option>
            </select>

            <h3 className="font-bold mb-2 mt-4">Difficulty</h3>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="all">All Difficulties</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>

          <div className="bg-white p-4 rounded shadow">
            <h3 className="font-bold mb-2">Filter by Tags</h3>
            {allTags.length === 0 && (
              <p className="text-gray-500 text-sm">No tags created yet.</p>
            )}
            <div className="flex flex-wrap gap-2">
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTagFilter(tag)}
                  className={`px-2 py-1 rounded text-sm border cursor-pointer ${
                    selectedTags.includes(tag)
                      ? "bg-blue-100 border-blue-500 text-blue-700"
                      : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <div className="mb-4 text-gray-600 flex justify-between items-center">
            <span>Showing {filteredQuestions.length} problems</span>

            {/* Pagination Controls Top */}
            {totalPages > 1 && (
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            )}
          </div>

          <div className="space-y-8">
            {currentQuestions.map((q) => (
              <div
                key={q.id}
                className="bg-white p-6 rounded shadow break-inside-avoid print:shadow-none print:border"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <button
                      onClick={() => setSelectedSubject(q.subject)}
                      className="inline-block bg-gray-200 rounded px-2 py-1 text-xs font-bold text-gray-700 mr-2 hover:bg-gray-300 cursor-pointer"
                    >
                      {q.subject.toUpperCase()}
                    </button>
                    {/* Difficulty Filter */}
                    {q.difficulty && (
                      <button
                        onClick={() =>
                          setSelectedDifficulty(q.difficulty || "all")
                        }
                        className="inline-block bg-gray-200 rounded px-2 py-1 text-xs font-bold text-gray-700 mr-2 hover:bg-gray-300 cursor-pointer"
                      >
                        {q.difficulty}
                      </button>
                    )}
                    <Link
                      href={`/question/${q.id}`}
                      className="inline-block bg-blue-100 text-blue-700 rounded px-2 py-1 text-xs font-bold hover:bg-blue-200 transition-colors"
                    >
                      ID: {q.id}
                    </Link>
                  </div>
                  <div className="print:hidden">
                    {/* Tag Input */}
                    <TagInput
                      existingTags={q.tags}
                      allTags={allTags}
                      onAdd={(t) => addTag(q.id, t)}
                      onRemove={(t) => removeTag(q.id, t)}
                    />
                  </div>
                </div>

                {/* Question Image */}
                <div className="mb-4 bg-gray-50 p-4 rounded border border-gray-200">
                  {q.question_image ? (
                    <img
                      src={`/${q.question_image}`}
                      alt="Question"
                      className="max-w-2xl max-h-[60vh] w-auto h-auto object-contain"
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
                    className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition-colors cursor-pointer"
                  >
                    {showAnswerFor[q.id] ? "Hide Answer" : "Show Answer"}
                  </button>

                  {showAnswerFor[q.id] && (
                    <div className="mt-4 p-4 bg-green-50 rounded border border-green-100">
                      <div className="mb-2 font-bold text-green-800">
                        Correct Answer: {q.correct_answer || "See details"}
                      </div>
                      {q.answer_image && (
                        <img
                          src={`/${q.answer_image}`}
                          alt="Answer Explanation"
                          className="max-w-2xl max-h-[60vh] w-auto h-auto object-contain"
                        />
                      )}
                    </div>
                  )}
                </div>

                {/* Print-only tags display */}
                <div className="hidden print:block mt-2">
                  <p className="text-xs text-gray-500">
                    Tags: {q.tags.join(", ")}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls Bottom */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8 print:hidden">
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
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
    <div className="relative w-64 flex flex-col gap-2">
      {/* Tags displayed ABOVE input (or separate from it) */}
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
          className="text-sm border rounded px-2 py-1 w-full"
        />
        {showSuggestions && input && filteredSuggestions.length > 0 && (
          <div className="absolute top-full left-0 w-full bg-white border rounded shadow mt-1 z-10 max-h-32 overflow-y-auto">
            {filteredSuggestions.map((tag) => (
              <button
                key={tag}
                type="button"
                className="block w-full text-left px-2 py-1 text-sm hover:bg-gray-100 cursor-pointer"
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
    <div className="flex gap-2 items-center">
      <button
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="px-3 py-1 border rounded disabled:opacity-50 bg-white cursor-pointer disabled:cursor-not-allowed"
      >
        Prev
      </button>

      <form onSubmit={handleSubmit} className="flex items-center gap-1">
        <span className="text-sm text-gray-600">Page</span>
        <input
          type="text"
          value={inputPage}
          onChange={(e) => setInputPage(e.target.value)}
          onBlur={handleSubmit}
          className="w-12 border rounded px-1 py-0.5 text-center text-sm"
        />
        <span className="text-sm text-gray-600">of {totalPages}</span>
      </form>

      <button
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="px-3 py-1 border rounded disabled:opacity-50 bg-white cursor-pointer disabled:cursor-not-allowed"
      >
        Next
      </button>
    </div>
  );
}
