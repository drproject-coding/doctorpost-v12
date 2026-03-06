"use client";
import React, { useState, useCallback, useEffect, useRef } from "react";
import { CheckCircle, XCircle, X } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface Toast {
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
  const [toasts, setToasts] = useState<Toast[]>([]);
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
          bottom: "var(--bru-space-6)",
          right: "var(--bru-space-6)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--bru-space-2)",
          zIndex: 9999,
          pointerEvents: "none",
        }}
      >
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: number) => void;
}) {
  useEffect(() => {
    const t = setTimeout(() => onDismiss(toast.id), 4000);
    return () => clearTimeout(t);
  }, [toast.id, onDismiss]);

  const colors: Record<ToastType, { bg: string; icon: React.ReactNode }> = {
    success: {
      bg: "#e6f9ec",
      icon: <CheckCircle size={16} color="#00aa00" />,
    },
    error: {
      bg: "#fde8e8",
      icon: <XCircle size={16} color="#cc0000" />,
    },
    info: {
      bg: "var(--bru-cream, #fffdf4)",
      icon: null,
    },
  };

  const { bg, icon } = colors[toast.type];

  return (
    <div
      style={{
        pointerEvents: "auto",
        display: "flex",
        alignItems: "center",
        gap: "var(--bru-space-2)",
        padding: "var(--bru-space-3) var(--bru-space-4)",
        background: bg,
        border: "2px solid black",
        boxShadow: "3px 3px 0 black",
        minWidth: 260,
        maxWidth: 380,
        fontSize: "var(--bru-text-sm)",
        fontWeight: 600,
        animation: "bru-toast-in 0.15s ease-out",
      }}
    >
      {icon}
      <span style={{ flex: 1 }}>{toast.message}</span>
      <button
        onClick={() => onDismiss(toast.id)}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 0,
          lineHeight: 1,
          color: "var(--bru-grey)",
          flexShrink: 0,
        }}
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
      <style>{`
        @keyframes bru-toast-in {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
