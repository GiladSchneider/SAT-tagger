"use client";

import { useState, useEffect } from "react";
import { Question } from "../types";
import { supabase } from "../../lib/supabaseClient";

export function useQuestions() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
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

        // Load tags based on auth state
        let tagMap: Record<string, string[]> = {};

        if (userId && supabase) {
          // Load from Supabase
          const { data, error } = await supabase
            .from("tags")
            .select("question_id, tag")
            .eq("user_id", userId);

          if (!error && data) {
            data.forEach((row: { question_id: string; tag: string }) => {
              if (!tagMap[row.question_id]) {
                tagMap[row.question_id] = [];
              }
              tagMap[row.question_id].push(row.tag);
            });
          }
        } else {
          // Load from localStorage
          const storedTags = localStorage.getItem("sat-app-tags");
          tagMap = storedTags ? JSON.parse(storedTags) : {};
        }

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
  }, [userId]);

  const addTag = async (questionId: string, tag: string) => {
    // Update local state immediately
    const newQuestions = questions.map((q) => {
      if (q.id === questionId) {
        if (q.tags.includes(tag)) return q;
        return { ...q, tags: [...q.tags, tag] };
      }
      return q;
    });

    setQuestions(newQuestions);

    if (!allTags.includes(tag)) {
      setAllTags([...allTags, tag]);
    }

    // Persist
    if (userId && supabase) {
      await supabase.from("tags").insert({
        user_id: userId,
        question_id: questionId,
        tag: tag,
      });
    } else {
      updateLocalStorage(newQuestions);
    }
  };

  const removeTag = async (questionId: string, tag: string) => {
    const newQuestions = questions.map((q) => {
      if (q.id === questionId) {
        return { ...q, tags: q.tags.filter((t) => t !== tag) };
      }
      return q;
    });
    setQuestions(newQuestions);

    // Recalculate allTags to remove orphaned tags
    const remainingTags = new Set<string>();
    newQuestions.forEach((q) => q.tags.forEach((t) => remainingTags.add(t)));
    setAllTags(Array.from(remainingTags));

    // Persist
    if (userId && supabase) {
      await supabase
        .from("tags")
        .delete()
        .eq("user_id", userId)
        .eq("question_id", questionId)
        .eq("tag", tag);
    } else {
      updateLocalStorage(newQuestions);
    }
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

  return { questions, allTags, addTag, removeTag, loading, userId, userEmail };
}
