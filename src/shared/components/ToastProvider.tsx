"use client";

import { CheckCircle2, Info, TriangleAlert, X } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";

type ToastVariant = "success" | "error" | "info";

type Toast = {
  id: number;
  message: string;
  variant: ToastVariant;
};

type ToastContextValue = {
  showToast: (message: string, variant?: ToastVariant) => void;
};

const TOAST_STORAGE_KEY = "petstore:toast";
const ToastContext = createContext<ToastContextValue | null>(null);

export function queueToast(message: string, variant: ToastVariant = "success") {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(
    TOAST_STORAGE_KEY,
    JSON.stringify({ message, variant })
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismissToast = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, variant: ToastVariant = "success") => {
      const id = Date.now() + Math.floor(Math.random() * 1000);
      setToasts((current) => [...current, { id, message, variant }].slice(-4));
      window.setTimeout(() => dismissToast(id), 2000);
    },
    [dismissToast]
  );

  useEffect(() => {
    const rawToast = window.sessionStorage.getItem(TOAST_STORAGE_KEY);
    if (!rawToast) {
      return;
    }

    window.sessionStorage.removeItem(TOAST_STORAGE_KEY);

    try {
      const parsed = JSON.parse(rawToast) as {
        message?: string;
        variant?: ToastVariant;
      };
      if (parsed.message) {
        showToast(parsed.message, parsed.variant ?? "success");
      }
    } catch {
      showToast(rawToast, "info");
    }
  }, [showToast]);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-viewport" aria-live="polite" aria-atomic="true">
        {toasts.map((toast) => {
          const Icon =
            toast.variant === "success"
              ? CheckCircle2
              : toast.variant === "error"
                ? TriangleAlert
                : Info;

          return (
            <div className={`toast-card toast-${toast.variant}`} key={toast.id}>
              <Icon size={19} />
              <span>{toast.message}</span>
              <button
                type="button"
                aria-label="Cerrar notificacion"
                onClick={() => dismissToast(toast.id)}
              >
                <X size={15} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast debe usarse dentro de ToastProvider");
  }

  return context;
}
