"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";

// Toast types
export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number; // ms, 0 = permanent
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => string;
  removeToast: (id: string) => void;
  success: (title: string, message?: string) => string;
  error: (title: string, message?: string) => string;
  warning: (title: string, message?: string) => string;
  info: (title: string, message?: string) => string;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  
  // Return stub functions if not within provider (graceful fallback)
  if (!context) {
    const noop = () => "";
    return {
      toasts: [],
      addToast: noop,
      removeToast: noop,
      success: noop,
      error: noop,
      warning: noop,
      info: noop,
    };
  }
  
  return context;
}
// Icons for each toast type
const ToastIcons: Record<ToastType, React.ReactNode> = {
  success: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  error: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  warning: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  info: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

// Color schemes for each type
const ToastColors: Record<ToastType, { bg: string; border: string; icon: string; title: string }> = {
  success: {
    bg: "bg-emerald-950/90",
    border: "border-emerald-500/40",
    icon: "text-emerald-400 bg-emerald-500/20",
    title: "text-emerald-200",
  },
  error: {
    bg: "bg-red-950/90",
    border: "border-red-500/40",
    icon: "text-red-400 bg-red-500/20",
    title: "text-red-200",
  },
  warning: {
    bg: "bg-amber-950/90",
    border: "border-amber-500/40",
    icon: "text-amber-400 bg-amber-500/20",
    title: "text-amber-200",
  },
  info: {
    bg: "bg-blue-950/90",
    border: "border-blue-500/40",
    icon: "text-blue-400 bg-blue-500/20",
    title: "text-blue-200",
  },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const addToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const newToast: Toast = { id, duration: 4000, ...toast };
    setToasts((prev) => [...prev, newToast]);
    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = useCallback(
    (title: string, message?: string) => addToast({ type: "success", title, message }),
    [addToast]
  );

  const error = useCallback(
    (title: string, message?: string) => addToast({ type: "error", title, message }),
    [addToast]
  );

  const warning = useCallback(
    (title: string, message?: string) => addToast({ type: "warning", title, message }),
    [addToast]
  );

  const info = useCallback(
    (title: string, message?: string) => addToast({ type: "info", title, message }),
    [addToast]
  );

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, success, error, warning, info }}>
      {children}
      {mounted &&
        createPortal(
          <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
            {toasts.map((toast) => (
              <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
            ))}
          </div>,
          document.body
        )}
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const [isExiting, setIsExiting] = useState(false);
  const [progress, setProgress] = useState(100);

  const handleRemove = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => onRemove(toast.id), 300);
  }, [onRemove, toast.id]);

  // Auto-dismiss timer with progress bar
  useEffect(() => {
    if (toast.duration === 0) return;

    const duration = toast.duration || 4000;
    const interval = 50;
    const steps = duration / interval;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      setProgress(100 - (currentStep / steps) * 100);
      if (currentStep >= steps) {
        handleRemove();
      }
    }, interval);

    return () => clearInterval(timer);
  }, [toast.duration, handleRemove]);

  const colors = ToastColors[toast.type];

  return (
    <div
      className={`
        pointer-events-auto
        w-80 overflow-hidden rounded-xl border backdrop-blur-xl
        shadow-2xl shadow-black/50
        ${colors.bg} ${colors.border}
        ${isExiting 
          ? "animate-out fade-out slide-out-to-right duration-300" 
          : "animate-in slide-in-from-right fade-in duration-300"
        }
      `}
    >
      <div className="p-4 flex items-start gap-3">
        {/* Icon */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${colors.icon}`}>
          {ToastIcons[toast.type]}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold ${colors.title}`}>{toast.title}</p>
          {toast.message && (
            <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{toast.message}</p>
          )}
          {toast.action && (
            <button
              onClick={() => {
                toast.action?.onClick();
                handleRemove();
              }}
              className="mt-2 text-xs font-medium text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              {toast.action.label} →
            </button>
          )}
        </div>

        {/* Close button */}
        <button
          onClick={handleRemove}
          className="flex-shrink-0 p-1 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Progress bar */}
      {toast.duration !== 0 && (
        <div className="h-0.5 bg-slate-800">
          <div
            className={`h-full transition-all duration-100 ease-linear ${
              toast.type === "success" ? "bg-emerald-500" :
              toast.type === "error" ? "bg-red-500" :
              toast.type === "warning" ? "bg-amber-500" :
              "bg-blue-500"
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}
