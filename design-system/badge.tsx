import * as React from "react";
import { cn } from "./cn";

export function Badge({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-[var(--accent)] px-2.5 py-1 text-xs font-semibold text-[var(--accent-foreground)]",
        className,
      )}
      {...props}
    />
  );
}

export function Shell({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  return <main className={cn("min-h-full bg-[image:var(--shell)] text-[var(--foreground)]", className)} {...props} />;
}

export function Page({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mx-auto flex w-full max-w-5xl flex-col gap-5 p-4 sm:p-6", className)} {...props} />;
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col">
      <span className="mb-1.5 text-sm font-medium">{label}</span>
      {children}
    </div>
  );
}
