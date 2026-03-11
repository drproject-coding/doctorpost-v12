"use client";
import React, { useState, useCallback, useRef } from "react";
import { Button } from "@doctorproject/react";

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

interface ConfirmState extends ConfirmOptions {
  resolve: (value: boolean) => void;
}

interface ConfirmContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

export const ConfirmContext = React.createContext<ConfirmContextValue>({
  confirm: () => Promise.resolve(false),
});

export function useConfirm() {
  return React.useContext(ConfirmContext).confirm;
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ConfirmState | null>(null);
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setState({ ...options, resolve });
    });
  }, []);

  const handleClose = (value: boolean) => {
    resolveRef.current?.(value);
    setState(null);
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {state && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.35)",
          }}
          onClick={() => handleClose(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "white",
              border: "1px solid #121212",
              padding: "24px",
              minWidth: 320,
              maxWidth: 480,
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            {state.title && (
              <p
                style={{
                  margin: 0,
                  fontFamily: "var(--drp-font-primary)",
                  fontWeight: "var(--drp-weight-heavy)",
                  fontSize: "var(--drp-text-base)",
                  color: "var(--drp-black)",
                }}
              >
                {state.title}
              </p>
            )}
            <p
              style={{
                margin: 0,
                fontFamily: "var(--drp-font-primary)",
                fontSize: "var(--drp-text-sm)",
                color: "var(--drp-muted, #555)",
                lineHeight: 1.5,
              }}
            >
              {state.message}
            </p>
            <div
              style={{
                display: "flex",
                gap: "8px",
                justifyContent: "flex-end",
              }}
            >
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleClose(false)}
              >
                {state.cancelLabel ?? "Cancel"}
              </Button>
              <Button
                variant={state.danger ? "danger" : "primary"}
                size="sm"
                onClick={() => handleClose(true)}
              >
                {state.confirmLabel ?? "Confirm"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
