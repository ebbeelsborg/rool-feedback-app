import { useState, useRef, useEffect } from "react";
import { type Issue, type IssueStatus } from "@/lib/rool";
import { ChevronDown } from "lucide-react";

const STATUSES: IssueStatus[] = ["Open", "Solved", "Rejected"];

interface IssueStatusMenuProps {
  issue: Issue;
  onStatusUpdate: (status: IssueStatus) => Promise<void>;
  onCategoryUpdate?: (category: string) => Promise<void>;
}

export function IssueStatusMenu({ issue, onStatusUpdate, onCategoryUpdate }: IssueStatusMenuProps) {
  const [open, setOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const status = issue.status ?? "Open";

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={updating}
        className="flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs hover:bg-muted disabled:opacity-50"
      >
        Menu <ChevronDown className="h-3 w-3" />
      </button>
      {open && (
        <div className="absolute left-0 bottom-full z-50 mb-1 min-w-[120px] rounded-lg border border-border bg-popover py-1 shadow-lg">
          {STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={async () => {
                setUpdating(true);
                try {
                  await onStatusUpdate(s);
                  setOpen(false);
                } finally {
                  setUpdating(false);
                }
              }}
              className={`flex w-full px-3 py-2 text-left text-sm hover:bg-muted ${
                status === s ? "font-medium" : ""
              }`}
            >
              {s}
            </button>
          ))}
          {onCategoryUpdate && (
            <>
              <div className="my-1 border-t border-border" />
              <button
                type="button"
                onClick={async () => {
                  const newCat = window.prompt("New category (one word):", issue.category ?? "General");
                  if (newCat != null && newCat.trim()) {
                    setUpdating(true);
                    try {
                      await onCategoryUpdate(newCat.trim());
                      setOpen(false);
                    } finally {
                      setUpdating(false);
                    }
                  }
                }}
                className="flex w-full px-3 py-2 text-left text-sm hover:bg-muted"
              >
                Recategorize…
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
