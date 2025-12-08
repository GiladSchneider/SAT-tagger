"use client";

import { useState, useEffect } from "react";
import { Question } from "../types";

export function useQuestions() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Load initial data
  useEffect(() => {
    async function loadData() {
      try {
        const [mathRes, engRes] = await Promise.all([
          fetch("/data/questions_math.json"),
          fetch("/data/questions_english.json"),
        ]);

        const mathData: Question[] = await mathRes.json();
        const engData: Question[] = await engRes.json();

        const combined = [...mathData, ...engData];

        // Load tags from localStorage
        const storedTags = localStorage.getItem("sat-app-tags");
        const tagMap: Record<string, string[]> = storedTags
          ? JSON.parse(storedTags)
          : {};

        // Merge tags
        const merged = combined.map((q) => ({
          ...q,
          tags: tagMap[q.id] || [],
        }));

        setQuestions(merged);

        // Collect all unique tags
        const tags = new Set<string>();
        merged.forEach((q) => q.tags.forEach((t) => tags.add(t)));
        setAllTags(Array.from(tags));
      } catch (e) {
        console.error("Failed to load data", e);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const addTag = (questionId: string, tag: string) => {
    const newQuestions = questions.map((q) => {
      if (q.id === questionId) {
        if (q.tags.includes(tag)) return q;
        return { ...q, tags: [...q.tags, tag] };
      }
      return q;
    });

    setQuestions(newQuestions);
    updateLocalStorage(newQuestions);

    if (!allTags.includes(tag)) {
      setAllTags([...allTags, tag]);
    }
  };

  const removeTag = (questionId: string, tag: string) => {
    const newQuestions = questions.map((q) => {
      if (q.id === questionId) {
        return { ...q, tags: q.tags.filter((t) => t !== tag) };
      }
      return q;
    });
    setQuestions(newQuestions);
    updateLocalStorage(newQuestions);
  };

  const updateLocalStorage = (qs: Question[]) => {
    const tagMap: Record<string, string[]> = {};
    qs.forEach((q) => {
      if (q.tags.length > 0) {
        tagMap[q.id] = q.tags;
      }
    });
    localStorage.setItem("sat-app-tags", JSON.stringify(tagMap));
  };

  return { questions, allTags, addTag, removeTag, loading };
}
