import { useState, useRef, useEffect } from "react";
import { type Issue, type IssueStatus } from "@/lib/rool";
import { ChevronDown, CircleDot, CheckCircle2, XCircle, Tag, Settings2 } from "lucide-react";

const STATUSES: IssueStatus[] = ["Open", "Solved", "Rejected"];

const STATUS_ICONS: Record<IssueStatus, React.ReactNode> = {
  Open: <CircleDot className="h-3.5 w-3.5" />,
  Solved: <CheckCircle2 className="h-3.5 w-3.5" />,
  Rejected: <XCircle className="h-3.5 w-3.5" />,
};

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
        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium shadow-sm transition-all hover:bg-muted hover:shadow disabled:opacity-50"
      >
        <Settings2 className="h-3.5 w-3.5 text-muted-foreground" />
        Actions
        <ChevronDown className={`h-3 w-3 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="menu-dropdown left-0 top-full mt-1.5">
          <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Status</p>
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
              className={status === s ? "font-medium bg-muted" : ""}
            >
              {STATUS_ICONS[s]}
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
              >
                <Tag className="h-3.5 w-3.5" />
                Recategorize...
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
