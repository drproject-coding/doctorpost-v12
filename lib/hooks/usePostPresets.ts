"use client";

import { useState, useEffect } from "react";

export interface PostPreset {
  id: string;
  name: string;
  description: string;
  postType: string;
  hookPattern: string;
  contentPillar: string;
  tone: string;
}

interface UsePostPresetsResult {
  presets: PostPreset[];
  loading: boolean;
  error: string | null;
}

export function usePostPresets(): UsePostPresetsResult {
  const [presets, setPresets] = useState<PostPreset[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchPresets(): Promise<void> {
      try {
        const res = await fetch("/api/post-presets");
        if (!res.ok) {
          throw new Error(
            `Failed to fetch presets: ${res.status} ${res.statusText}`,
          );
        }
        const data = (await res.json()) as PostPreset[];
        if (!cancelled) {
          setPresets(data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to fetch presets",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void fetchPresets();

    return () => {
      cancelled = true;
    };
  }, []);

  return { presets, loading, error };
}
