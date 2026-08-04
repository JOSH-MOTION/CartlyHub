"use client";

import { Loader2 } from "lucide-react";

/**
 * Small shared pieces for the vendor and admin dashboards.
 *
 * Kept deliberately plain — they exist so eleven screens look like one
 * product, not so they can be configured into anything.
 */

export const PageHeader = ({ eyebrow, title, description, actions }) => (
  <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
    <div className="space-y-1.5 min-w-0">
      {eyebrow && (
        <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-gray-400 block">
          {eyebrow}
        </span>
      )}
      <h1 className="text-xl sm:text-2xl font-black tracking-tight uppercase">{title}</h1>
      {description && (
        <p className="text-gray-500 text-sm max-w-2xl leading-relaxed">{description}</p>
      )}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
  </header>
);

export const StatCard = ({ label, value, hint, icon: Icon, tone = "light" }) => (
  <div
    className={`p-4 sm:p-5 rounded-2xl border ${
      tone === "dark"
        ? "bg-black text-white border-gray-800"
        : "bg-white border-gray-100 shadow-sm"
    }`}
  >
    <div className="flex items-start justify-between gap-3">
      <div className="space-y-1.5 min-w-0">
        <p
          className={`text-[10px] font-bold uppercase tracking-[0.15em] ${
            tone === "dark" ? "text-gray-400" : "text-gray-400"
          }`}
        >
          {label}
        </p>
        <p className="text-xl sm:text-2xl font-black tracking-tight truncate">{value}</p>
        {hint && (
          <p
            className={`text-[11px] leading-snug ${
              tone === "dark" ? "text-gray-500" : "text-gray-400"
            }`}
          >
            {hint}
          </p>
        )}
      </div>
      {Icon && (
        <div
          className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${
            tone === "dark" ? "bg-white/10 text-white" : "bg-gray-50 text-black"
          }`}
        >
          <Icon className="h-4 w-4" />
        </div>
      )}
    </div>
  </div>
);

export const Panel = ({ title, action, children, className = "" }) => (
  <section className={`bg-white border border-gray-100 rounded-2xl shadow-sm ${className}`}>
    {(title || action) && (
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-4 border-b border-gray-100">
        <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400">
          {title}
        </h2>
        {action}
      </div>
    )}
    <div className="p-4 sm:p-6">{children}</div>
  </section>
);

export const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div className="py-16 text-center space-y-4">
    {Icon && (
      <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto">
        <Icon className="h-6 w-6 text-gray-300" />
      </div>
    )}
    <div className="space-y-1.5">
      <p className="text-sm font-black uppercase tracking-tight">{title}</p>
      {description && (
        <p className="text-gray-400 text-xs max-w-sm mx-auto leading-relaxed">{description}</p>
      )}
    </div>
    {action}
  </div>
);

export const LoadingState = ({ label = "Loading" }) => (
  <div className="py-20 flex flex-col items-center justify-center gap-4">
    <Loader2 className="h-7 w-7 animate-spin text-black" />
    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
      {label}
    </span>
  </div>
);

const PILL_TONES = {
  neutral: "bg-gray-100 text-gray-500",
  black: "bg-black text-white",
  emerald: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600",
  blue: "bg-blue-50 text-blue-600",
  red: "bg-red-50 text-red-500",
  green: "bg-[#25D366]/10 text-[#128C7E]",
};

export const Pill = ({ label, tone = "neutral", icon }) => (
  <span
    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest whitespace-nowrap ${
      PILL_TONES[tone] || PILL_TONES.neutral
    }`}
  >
    {icon}
    {label}
  </span>
);

/** Horizontally scrollable table so wide data never breaks the layout. */
export const Table = ({ head, children }) => (
  <div className="overflow-x-auto -mx-4 px-4 sm:-mx-6 sm:px-6">
    <table className="w-full min-w-[640px] text-left">
      <thead>
        <tr className="border-b border-gray-50">
          {head.map((label) => (
            <th
              key={label}
              className="pb-3 text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 whitespace-nowrap pr-6 last:pr-0"
            >
              {label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-50">{children}</tbody>
    </table>
  </div>
);

export const Cell = ({ children, className = "" }) => (
  <td className={`py-4 pr-6 last:pr-0 text-sm font-bold text-gray-700 align-middle ${className}`}>
    {children}
  </td>
);
