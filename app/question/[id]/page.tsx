"use client";

import { use, useState } from "react";
import { useQuestions } from "../../hooks/useQuestions";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function QuestionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { questions, loading, addTag, removeTag, allTags } = useQuestions();
  const [showAnswer, setShowAnswer] = useState(false);

  if (loading) return <div className="p-10">Loading...</div>;

  const question = questions.find((q) => q.id === id);

  if (!question) {
    return (
      <div className="p-10">
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
    <div className="min-h-screen bg-gray-100 p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/"
          className="text-blue-600 hover:underline flex items-center mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Question Bank
        </Link>

        <div className="bg-white p-8 rounded shadow">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-2xl font-bold mb-2">
                Question {question.id}
              </h1>
              <div className="flex gap-2">
                <span className="inline-block bg-gray-200 rounded px-2 py-1 text-xs font-bold text-gray-700">
                  {question.subject.toUpperCase()}
                </span>
                <span className="inline-block bg-gray-200 rounded px-2 py-1 text-xs font-bold text-gray-700">
                  {question.difficulty || "Unknown Difficulty"}
                </span>
              </div>
            </div>

            <TagInput
              existingTags={question.tags}
              allTags={allTags}
              onAdd={(t) => addTag(question.id, t)}
              onRemove={(t) => removeTag(question.id, t)}
            />
          </div>

          <div className="mb-8 bg-gray-50 p-4 rounded border border-gray-200">
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

          <div className="border-t pt-6">
            <button
              onClick={() => setShowAnswer(!showAnswer)}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition-colors cursor-pointer"
            >
              {showAnswer ? "Hide Answer" : "Show Answer"}
            </button>

            {showAnswer && (
              <div className="mt-6 p-6 bg-green-50 rounded border border-green-100 animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="mb-4 font-bold text-green-800">
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
        <div className="flex flex-wrap gap-1 mb-1 justify-end">
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
