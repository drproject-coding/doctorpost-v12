"use client";
import React, { useState, useCallback, useEffect, useRef } from "react";
import { Toast, Button } from "@doctorproject/react";

type ToastType = "success" | "error" | "info";

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

export const ToastContext = React.createContext<ToastContextValue>({
  showToast: () => {},
});

export function useToast() {
  return React.useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counterRef = useRef(0);

  const showToast = useCallback((message: string, type: ToastType = "info") => {
    const id = ++counterRef.current;
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        style={{
          position: "fixed",
          bottom: "var(--drp-space-6)",
          right: "var(--drp-space-6)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--drp-space-2)",
          zIndex: 9999,
          pointerEvents: "none",
        }}
      >
        {toasts.map((toast) => (
          <ToastItemComponent
            key={toast.id}
            toast={toast}
            onDismiss={dismiss}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItemComponent({
  toast,
  onDismiss,
}: {
  toast: ToastItem;
  onDismiss: (id: number) => void;
}) {
  useEffect(() => {
    const t = setTimeout(() => onDismiss(toast.id), 4000);
    return () => clearTimeout(t);
  }, [toast.id, onDismiss]);

  return (
    <div
      style={{
        pointerEvents: "auto",
        display: "flex",
        alignItems: "center",
        gap: "var(--drp-space-2)",
        animation: "drp-toast-in 0.15s ease-out",
      }}
    >
      <Toast variant={toast.type} message={toast.message} />
      <Button
        variant="ghost"
        icon
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss"
        style={{ flexShrink: 0 }}
      >
        ✕
      </Button>
      <style>{`
        @keyframes drp-toast-in {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
