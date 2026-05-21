// Phase-16 R3 — Toast primitive.
//
// Builds on @radix-ui/react-toast for the focus / keyboard / dismiss
// behaviour, but provides a tiny imperative API on top:
//
//   toast({ kind: "success", title: "ذخیره شد" });
//   toast.success("ذخیره شد");
//   toast.danger("خطا در ذخیره", { description: "..." });
//
// Internally a singleton store + <ToastProvider/> + <Toaster/> render
// the queue. The legacy `useToast()` shell hook in ui-shell.tsx stays
// untouched; new code uses this `toast(...)` directly.
//
// 4 semantic kinds: info / success / warn / danger — same OKLCh tokens
// as Badge.
import * as React from "react";
import * as ToastPrimitive from "@radix-ui/react-toast";
import { cn, tagDisplayName } from "./utils";

export type ToastKind = "info" | "success" | "warn" | "danger";

export interface ToastOptions {
  title: React.ReactNode;
  description?: React.ReactNode;
  kind?: ToastKind;
  /** ms before auto-dismiss. Default 5000. Pass 0 to stick. */
  duration?: number;
  /** Optional action button — e.g. "بازگردانی". */
  action?: { label: React.ReactNode; onClick: () => void };
}

interface ToastItem extends ToastOptions {
  id: string;
}

export interface ToastApi {
  (opts: ToastOptions): string;
  info: (title: React.ReactNode, opts?: Omit<ToastOptions, "title" | "kind">) => string;
  success: (title: React.ReactNode, opts?: Omit<ToastOptions, "title" | "kind">) => string;
  warn: (title: React.ReactNode, opts?: Omit<ToastOptions, "title" | "kind">) => string;
  danger: (title: React.ReactNode, opts?: Omit<ToastOptions, "title" | "kind">) => string;
  dismiss: (id: string) => void;
}

// ----- Internal singleton store ------------------------------------
// Module-scope so any module can call `toast(...)` without prop drilling.
type Listener = (items: ToastItem[]) => void;

const listeners = new Set<Listener>();
let items: ToastItem[] = [];

const emit = (): void => {
  for (const l of listeners) {
    try {
      l(items);
    } catch {
      // listener errors don't kill siblings
    }
  }
};

const enqueue = (opts: ToastOptions): string => {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : "toast-" + Math.random().toString(36).slice(2);
  items = [...items, { ...opts, id }];
  emit();
  return id;
};

const dismiss = (id: string): void => {
  items = items.filter((t) => t.id !== id);
  emit();
};

// ----- Public API ---------------------------------------------------
const _toast = ((opts: ToastOptions) => enqueue(opts)) as ToastApi;
_toast.info = (title, opts) => enqueue({ title, kind: "info", ...opts });
_toast.success = (title, opts) => enqueue({ title, kind: "success", ...opts });
_toast.warn = (title, opts) => enqueue({ title, kind: "warn", ...opts });
_toast.danger = (title, opts) => enqueue({ title, kind: "danger", ...opts });
_toast.dismiss = dismiss;

export const toast: ToastApi = _toast;

// ----- ToastProvider ------------------------------------------------
// A thin wrapper around Radix' ToastProvider that mounts in App so
// `toast(...)` works anywhere. Use ONCE near the root.
export interface ToastProviderProps {
  children?: React.ReactNode;
  /** Default duration for all toasts (ms). */
  duration?: number;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({
  children,
  duration = 5000,
}) => (
  <ToastPrimitive.Provider duration={duration} swipeDirection="left">
    {children}
    <Toaster />
  </ToastPrimitive.Provider>
);
ToastProvider.displayName = "ToastProvider";

// ----- Toaster (renders the queue) ----------------------------------
const KIND_STYLES: Record<ToastKind, string> = {
  info: "border-s-[3px] border-s-[color:var(--accent)]",
  success: "border-s-[3px] border-s-[color:var(--sage)]",
  warn: "border-s-[3px] border-s-[color:var(--navy)]",
  danger: "border-s-[3px] border-s-[color:var(--gold)]",
};

export const Toaster: React.FC = () => {
  const [queue, setQueue] = React.useState<ToastItem[]>(items);

  React.useEffect(() => {
    const l: Listener = (next) => setQueue(next);
    listeners.add(l);
    setQueue(items);
    return () => {
      listeners.delete(l);
    };
  }, []);

  return (
    <>
      {queue.map((t) => (
        <ToastPrimitive.Root
          key={t.id}
          duration={t.duration ?? 5000}
          onOpenChange={(open) => {
            if (!open) dismiss(t.id);
          }}
          className={cn(
            "grid grid-cols-[1fr_auto] gap-3 items-start",
            "p-3.5 rounded-[var(--r-lg)]",
            "bg-[color:var(--surface)] text-[color:var(--fg)]",
            "border border-[color:var(--line-2)] shadow-[var(--shadow-paper)]",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-80 data-[state=open]:fade-in-0",
            "data-[state=open]:slide-in-from-top-2",
            KIND_STYLES[t.kind ?? "info"],
          )}
        >
          <div className="min-w-0 flex flex-col gap-1">
            <ToastPrimitive.Title className="text-[14px] font-semibold leading-snug truncate">
              {t.title}
            </ToastPrimitive.Title>
            {t.description ? (
              <ToastPrimitive.Description className="text-[12px] text-[color:var(--fg-mute)] leading-relaxed">
                {t.description}
              </ToastPrimitive.Description>
            ) : null}
          </div>
          <div className="flex items-start gap-1.5">
            {t.action ? (
              <ToastPrimitive.Action
                altText={typeof t.action.label === "string" ? t.action.label : "Action"}
                onClick={t.action.onClick}
                className="btn btn-ghost btn-sm"
              >
                {t.action.label}
              </ToastPrimitive.Action>
            ) : null}
            <ToastPrimitive.Close
              aria-label="بستن"
              className={cn(
                "inline-flex items-center justify-center w-7 h-7 rounded-[var(--r)]",
                "text-[color:var(--fg-dim)] hover:text-[color:var(--fg)]",
                "hover:bg-[color:var(--surface-2)]",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/40",
              )}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
                <path
                  d="M3 3l6 6M9 3l-6 6"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            </ToastPrimitive.Close>
          </div>
        </ToastPrimitive.Root>
      ))}
      <ToastPrimitive.Viewport
        className={cn(
          "fixed z-[2000] flex flex-col gap-2 outline-none",
          // Desktop: top-start corner. Mobile: bottom + safe-area.
          "top-[84px] start-6 w-[380px] max-w-[calc(100vw-32px)]",
          "max-md:top-auto max-md:bottom-4 max-md:start-3 max-md:end-3 max-md:w-auto",
          "pb-[max(0px,env(safe-area-inset-bottom))]",
        )}
      />
    </>
  );
};
tagDisplayName(Toaster, "Toaster");
