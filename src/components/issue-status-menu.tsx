import { useState, useRef, useEffect } from "react";
import { type Issue, type IssueStatus } from "@/lib/rool";
import { ChevronDown } from "lucide-react";

const STATUSES: IssueStatus[] = ["Open", "Solved", "Rejected"];

interface IssueStatusMenuProps {
  issue: Issue;
  onUpdate: (status: IssueStatus) => Promise<void>;
}

export function IssueStatusMenu({ issue, onUpdate }: IssueStatusMenuProps) {
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
        Set status <ChevronDown className="h-3 w-3" />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 min-w-[100px] rounded-lg border border-border bg-popover py-1 shadow-md">
          {STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={async () => {
                setUpdating(true);
                try {
                  await onUpdate(s);
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
        </div>
      )}
    </div>
  );
}
