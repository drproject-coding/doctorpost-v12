"use client";

import { useState, useEffect } from "react";

/**
 * Shape returned by GET /api/profile/creation-data.
 * Canonical source: app/api/profile/creation-data/route.ts
 */
export interface ProfileCreationData {
  audience: string[];
  tones: string[];
  offers: string[];
  industry: string;
  contentStrategy: string;
  definition: string;
  copyGuideline: string;
}

interface UseProfileDataReturn {
  data: ProfileCreationData | null;
  loading: boolean;
  error: string | null;
}

export function useProfileData(): UseProfileDataReturn {
  const [data, setData] = useState<ProfileCreationData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchProfileData() {
      try {
        const response = await fetch("/api/profile/creation-data");

        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as {
            error?: string;
          } | null;
          throw new Error(
            body?.error ?? `Failed to fetch profile data (${response.status})`,
          );
        }

        const result = (await response.json()) as ProfileCreationData;

        if (!cancelled) {
          setData(result);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "An unknown error occurred",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void fetchProfileData();

    return () => {
      cancelled = true;
    };
  }, []);

  return { data, loading, error };
}
