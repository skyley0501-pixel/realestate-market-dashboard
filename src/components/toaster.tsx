"use client";

import { Toast } from "@base-ui/react/toast";
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import { toastManager } from "@/lib/toast-manager";
import { cn } from "@/lib/utils";

const TOAST_ICONS = {
  success: CheckCircle2,
  error: AlertTriangle,
  info: Info,
} as const;

const TOAST_ACCENT_BORDER: Record<string, string> = {
  success: "border-l-chart-5",
  error: "border-l-destructive",
  info: "border-l-primary",
};

const TOAST_ACCENT_TEXT: Record<string, string> = {
  success: "text-chart-5",
  error: "text-destructive",
  info: "text-primary",
};

function ToastList() {
  const { toasts } = Toast.useToastManager();

  return toasts.map((toast) => {
    const type = toast.type && toast.type in TOAST_ICONS ? (toast.type as keyof typeof TOAST_ICONS) : "info";
    const Icon = TOAST_ICONS[type];

    return (
      <Toast.Root
        key={toast.id}
        toast={toast}
        className={cn(
          "pointer-events-auto flex w-full items-start gap-2.5 rounded-lg border border-border border-l-4 bg-card p-3 text-card-foreground shadow-lg ring-1 ring-foreground/10 transition-all duration-200 data-[starting-style]:translate-y-2 data-[starting-style]:opacity-0 data-[ending-style]:translate-x-4 data-[ending-style]:opacity-0",
          TOAST_ACCENT_BORDER[type]
        )}
      >
        <Icon className={cn("mt-0.5 size-4 shrink-0", TOAST_ACCENT_TEXT[type])} aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <Toast.Title className="text-sm font-medium" />
          <Toast.Description className="mt-0.5 text-sm text-muted-foreground" />
        </div>
        <Toast.Close
          className="shrink-0 rounded-md p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="閉じる"
        >
          <X className="size-3.5" />
        </Toast.Close>
      </Toast.Root>
    );
  });
}

export function Toaster() {
  return (
    <Toast.Provider toastManager={toastManager}>
      <Toast.Portal>
        <Toast.Viewport className="fixed inset-x-0 bottom-0 z-100 flex flex-col-reverse gap-2 p-4 sm:right-4 sm:left-auto sm:w-96">
          <ToastList />
        </Toast.Viewport>
      </Toast.Portal>
    </Toast.Provider>
  );
}
