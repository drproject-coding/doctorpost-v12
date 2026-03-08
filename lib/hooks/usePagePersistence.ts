"use client";

import { useEffect, useRef } from "react";

/**
 * Persist a single value to localStorage on every change.
 * Restores the value on mount via the provided setter.
 */
export function useLocalStorageField(
  key: string,
  value: string,
  setValue: (v: string) => void,
) {
  const mounted = useRef(false);

  // Restore on mount
  useEffect(() => {
    if (mounted.current) return;
    mounted.current = true;
    const saved = localStorage.getItem(key);
    if (saved !== null) setValue(saved);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist on change (skip first render before restore)
  useEffect(() => {
    if (!mounted.current) return;
    if (value === "") {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, value);
    }
  }, [key, value]);
}

/**
 * Warn the user before closing/refreshing the tab while a process is active.
 */
export function useBeforeUnloadWarning(isActive: boolean) {
  useEffect(() => {
    if (!isActive) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isActive]);
}

/**
 * Save a string value to localStorage when the component unmounts
 * (e.g. partial generated content so it isn't lost on navigation).
 */
export function useSaveOnUnmount(key: string, getValue: () => string) {
  const getValueRef = useRef(getValue);
  getValueRef.current = getValue;

  useEffect(() => {
    return () => {
      const value = getValueRef.current();
      if (value) {
        localStorage.setItem(key, value);
      }
    };
  }, [key]);
}
