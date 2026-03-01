"use client";

import { useState, useEffect, useMemo } from "react";
import { Question } from "../types";
import { supabase } from "../../lib/supabaseClient";

export function useQuestions() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Listen to auth state changes
  useEffect(() => {
    if (!supabase) return;

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id || null);
      setUserEmail(session?.user?.email || null);
    });

    // Subscribe to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id || null);
      setUserEmail(session?.user?.email || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load questions and tags
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

        // Load tags and notes based on auth state
        let tagMap: Record<string, string[]> = {};
        let notesMap: Record<string, string> = {};

        if (userId && supabase) {
          // Load tags from Supabase (paginated to avoid 1000-row server limit)
          const pageSize = 1000;
          let from = 0;
          let hasMore = true;
          while (hasMore) {
            const { data, error } = await supabase
              .from("tags")
              .select("question_id, tag")
              .eq("user_id", userId)
              .range(from, from + pageSize - 1);

            if (error || !data || data.length === 0) {
              hasMore = false;
            } else {
              data.forEach((row: { question_id: string; tag: string }) => {
                if (!tagMap[row.question_id]) {
                  tagMap[row.question_id] = [];
                }
                tagMap[row.question_id].push(row.tag);
              });
              if (data.length < pageSize) {
                hasMore = false;
              } else {
                from += pageSize;
              }
            }
          }

          // Load notes from Supabase
          const { data: notesData, error: notesError } = await supabase
            .from("notes")
            .select("question_id, note")
            .eq("user_id", userId);

          if (!notesError && notesData) {
            notesData.forEach((row: { question_id: string; note: string }) => {
              notesMap[row.question_id] = row.note;
            });
          }
        } else {
          // Load from localStorage
          const storedTags = localStorage.getItem("sat-app-tags");
          tagMap = storedTags ? JSON.parse(storedTags) : {};
          const storedNotes = localStorage.getItem("sat-app-notes");
          notesMap = storedNotes ? JSON.parse(storedNotes) : {};
        }

        // Merge tags and notes
        const merged = combined.map((q) => ({
          ...q,
          tags: tagMap[q.id] || [],
          notes: notesMap[q.id] || "",
        }));

        setQuestions(merged);
      } catch (e) {
        console.error("Failed to load data", e);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [userId]);

  const addTag = async (questionId: string, tag: string) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id === questionId) {
          if (q.tags.includes(tag)) return q;
          return { ...q, tags: [...q.tags, tag] };
        }
        return q;
      }),
    );

    if (userId && supabase) {
      await supabase.from("tags").insert({
        user_id: userId,
        question_id: questionId,
        tag: tag,
      });
    } else {
      const stored = localStorage.getItem("sat-app-tags");
      const tagMap: Record<string, string[]> = stored ? JSON.parse(stored) : {};
      if (!tagMap[questionId]) tagMap[questionId] = [];
      if (!tagMap[questionId].includes(tag)) tagMap[questionId].push(tag);
      localStorage.setItem("sat-app-tags", JSON.stringify(tagMap));
    }
  };

  const removeTag = async (questionId: string, tag: string) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id === questionId) {
          return { ...q, tags: q.tags.filter((t) => t !== tag) };
        }
        return q;
      }),
    );

    if (userId && supabase) {
      await supabase
        .from("tags")
        .delete()
        .eq("user_id", userId)
        .eq("question_id", questionId)
        .eq("tag", tag);
    } else {
      const stored = localStorage.getItem("sat-app-tags");
      const tagMap: Record<string, string[]> = stored ? JSON.parse(stored) : {};
      if (tagMap[questionId]) {
        tagMap[questionId] = tagMap[questionId].filter((t) => t !== tag);
        if (tagMap[questionId].length === 0) delete tagMap[questionId];
      }
      localStorage.setItem("sat-app-tags", JSON.stringify(tagMap));
    }
  };

  const updateNote = async (questionId: string, note: string) => {
    const newQuestions = questions.map((q) => {
      if (q.id === questionId) {
        return { ...q, notes: note };
      }
      return q;
    });
    setQuestions(newQuestions);

    // Persist
    if (userId && supabase) {
      // Upsert note in Supabase
      await supabase.from("notes").upsert(
        {
          user_id: userId,
          question_id: questionId,
          note: note,
        },
        { onConflict: "user_id,question_id" },
      );
    } else {
      updateNotesLocalStorage(newQuestions);
    }
  };

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    questions.forEach((q) => q.tags.forEach((t) => tags.add(t)));
    return Array.from(tags);
  }, [questions]);

  const updateNotesLocalStorage = (qs: Question[]) => {
    const notesMap: Record<string, string> = {};
    qs.forEach((q) => {
      if (q.notes) {
        notesMap[q.id] = q.notes;
      }
    });
    localStorage.setItem("sat-app-notes", JSON.stringify(notesMap));
  };

  return {
    questions,
    allTags,
    addTag,
    removeTag,
    updateNote,
    loading,
    userId,
    userEmail,
  };
}
