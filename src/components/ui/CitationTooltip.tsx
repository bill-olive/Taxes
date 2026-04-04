"use client";

import { useState, useRef, useEffect } from "react";
import type { Citation } from "@/lib/tax/constants";

interface CitationTooltipProps {
  citation: Citation;
}

export function CitationTooltip({ citation }: CitationTooltipProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  return (
    <span className="relative inline-block" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex items-center justify-center w-4 h-4 ml-1 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors cursor-pointer"
        aria-label={`View source: ${citation.rule}`}
        title="View tax rule citation"
      >
        i
      </button>
      {open && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 rounded-lg border border-gray-200 bg-white p-3 shadow-lg text-left">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full">
            <div className="w-2 h-2 bg-white border-r border-b border-gray-200 rotate-45 -mt-1" />
          </div>
          <p className="text-xs font-semibold text-gray-900 mb-1">
            {citation.rule}
          </p>
          <p className="text-xs text-gray-600">
            <span className="font-medium">Source:</span> {citation.source}
          </p>
          <p className="text-xs text-gray-600">
            <span className="font-medium">Section:</span> {citation.section}
          </p>
          {citation.note && (
            <p className="text-xs text-gray-500 mt-1 italic">{citation.note}</p>
          )}
          {citation.url && (
            <a
              href={citation.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-2 text-xs text-blue-600 hover:underline"
            >
              View source document
            </a>
          )}
        </div>
      )}
    </span>
  );
}
