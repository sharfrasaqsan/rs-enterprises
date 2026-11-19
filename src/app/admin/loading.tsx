import React from "react";

export default function AdminLoading() {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-4">
      <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent animate-spin rounded-full" />
      <div className="text-center space-y-1">
        <p className="font-serif text-lg tracking-wide text-[var(--text-primary)]">
          RS Enterprises Showroom CRM
        </p>
        <p className="text-[10px] uppercase tracking-widest font-mono text-[var(--text-secondary)]">
          Syncing Showroom Workspace...
        </p>
      </div>
    </div>
  );
}

