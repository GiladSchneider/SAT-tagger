"use client";

import { use, useState, useEffect } from "react";
import { useQuestions } from "../../hooks/useQuestions";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";

export default function QuestionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { questions, loading, addTag, removeTag, allTags, updateNote } =
    useQuestions();
  const [showAnswer, setShowAnswer] = useState(false);
  const router = useRouter();

  // Find navigation info early for keyboard handler
  const currentIndex = questions.findIndex((q) => q.id === id);
  const prevQuestion = currentIndex > 0 ? questions[currentIndex - 1] : null;
  const nextQuestion =
    currentIndex < questions.length - 1 ? questions[currentIndex + 1] : null;

  // Keyboard navigation (left/right arrows)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't navigate if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;

      if (e.key === "ArrowLeft" && prevQuestion) {
        router.push(`/question/${prevQuestion.id}`);
      } else if (e.key === "ArrowRight" && nextQuestion) {
        router.push(`/question/${nextQuestion.id}`);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [prevQuestion, nextQuestion, router]);

  if (loading) return <div className="p-4 md:p-10">Loading...</div>;

  const question = questions.find((q) => q.id === id);

  if (!question) {
    return (
      <div className="p-4 md:p-10">
        <Link
          href="/"
          className="text-blue-600 hover:underline flex items-center mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to List
        </Link>
        <div className="text-red-500">Question not found (ID: {id})</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        {/* Navigation bar */}
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <Link
            href="/"
            className="text-blue-600 hover:underline flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Question Bank
          </Link>

          <div className="flex items-center gap-2">
            {prevQuestion ? (
              <Link
                href={`/question/${prevQuestion.id}`}
                className="flex items-center gap-1 px-3 py-1.5 bg-gray-200 hover:bg-gray-300 rounded text-sm text-gray-700 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" /> Prev
              </Link>
            ) : (
              <span className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 rounded text-sm text-gray-400 cursor-not-allowed">
                <ChevronLeft className="w-4 h-4" /> Prev
              </span>
            )}

            <span className="text-sm text-gray-500 px-2">
              {currentIndex + 1} / {questions.length}
            </span>

            {nextQuestion ? (
              <Link
                href={`/question/${nextQuestion.id}`}
                className="flex items-center gap-1 px-3 py-1.5 bg-gray-200 hover:bg-gray-300 rounded text-sm text-gray-700 transition-colors"
              >
                Next <ChevronRight className="w-4 h-4" />
              </Link>
            ) : (
              <span className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 rounded text-sm text-gray-400 cursor-not-allowed">
                Next <ChevronRight className="w-4 h-4" />
              </span>
            )}
          </div>
        </div>

        <div className="bg-white p-4 md:p-8 rounded shadow">
          {/* Header - stacks on mobile */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6">
            <div>
              <h1 className="text-xl md:text-2xl font-bold mb-2">
                Question {question.id}
              </h1>
              <div className="flex flex-wrap gap-2">
                <span className="inline-block bg-gray-200 rounded px-2 py-1 text-xs font-bold text-gray-700">
                  {question.subject.toUpperCase()}
                </span>
                <span className="inline-block bg-gray-200 rounded px-2 py-1 text-xs font-bold text-gray-700">
                  {question.difficulty}
                </span>
              </div>
            </div>

            <div className="w-full sm:w-auto">
              <TagInput
                existingTags={question.tags}
                allTags={allTags}
                onAdd={(t) => addTag(question.id, t)}
                onRemove={(t) => removeTag(question.id, t)}
              />
            </div>
          </div>

          <div className="mb-6 md:mb-8 bg-gray-50 p-2 md:p-4 rounded border border-gray-200 overflow-x-auto">
            {question.question_image ? (
              <img
                src={`/${question.question_image}`}
                alt="Question"
                className="max-w-full h-auto"
              />
            ) : (
              <div className="p-4 text-red-500">Question image missing</div>
            )}
          </div>

          <div className="border-t pt-4 md:pt-6">
            <button
              onClick={() => setShowAnswer(!showAnswer)}
              className="bg-blue-600 text-white px-4 md:px-6 py-2 rounded hover:bg-blue-700 transition-colors cursor-pointer text-sm md:text-base"
            >
              {showAnswer ? "Hide Answer" : "Show Answer"}
            </button>

            {showAnswer && (
              <div className="mt-4 md:mt-6 p-3 md:p-6 bg-green-50 rounded border border-green-100 overflow-x-auto">
                <div className="mb-3 md:mb-4 font-bold text-green-800 text-sm md:text-base">
                  Correct Answer: {question.correct_answer || "See details"}
                </div>
                {question.answer_image && (
                  <img
                    src={`/${question.answer_image}`}
                    alt="Answer Explanation"
                    className="max-w-full h-auto rounded shadow-sm"
                  />
                )}
              </div>
            )}
          </div>

          {/* Notes Section */}
          <div className="mt-6 border-t pt-4">
            <h3 className="font-bold text-gray-700 mb-2">Notes</h3>
            <NoteEditor
              initialNote={question.notes || ""}
              onSave={(note) => updateNote(question.id, note)}
            />
          </div>
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

function NoteEditor({
  initialNote,
  onSave,
}: {
  initialNote: string;
  onSave: (note: string) => void;
}) {
  const [note, setNote] = useState(initialNote);
  const hasChanges = note !== initialNote;

  const handleSave = () => {
    onSave(note);
  };

  return (
    <div>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Add notes about how to solve this problem, key insights, formulas to use, etc..."
        className={`w-full p-3 border rounded text-sm min-h-[120px] resize-y ${
          hasChanges ? "border-yellow-400" : ""
        }`}
      />
      <div className="flex items-center gap-2 mt-2">
        <button
          onClick={handleSave}
          disabled={!hasChanges}
          className={`px-4 py-1.5 rounded text-sm cursor-pointer transition-colors ${
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
