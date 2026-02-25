import { useState, useRef, useEffect } from "react";
import { type Issue, type IssueStatus } from "@/lib/rool";
import { formatDate } from "@/lib/format";
import { MoreVertical } from "lucide-react";

const STATUS_STYLES: Record<IssueStatus, string> = {
  Open: "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400",
  Solved: "bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-400",
  Rejected: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/60 dark:text-yellow-400",
};

const STATUSES: IssueStatus[] = ["Open", "Solved", "Rejected"];

export function StatusTag({ status }: { status: IssueStatus }) {
  return (
    <span
      className={`inline-block rounded-md px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}
    >
      {status}
    </span>
  );
}

export function CategoryTag({ category }: { category: string }) {
  return (
    <span className="inline-block rounded-md bg-orange-50 px-2 py-0.5 text-xs text-orange-700 dark:bg-orange-950/50 dark:text-orange-400">
      {category}
    </span>
  );
}

const truncate = (s: string, max: number) =>
  s.length <= max ? s : s.slice(0, max - 1) + "…";

interface IssueCardProps {
  issue: Issue;
  onClick: () => void;
  onStatusChange?: (issue: Issue, newStatus: IssueStatus) => void;
  className?: string;
}

export function IssueCard({ issue, onClick, onStatusChange, className }: IssueCardProps) {
  const status = issue.status ?? "Open";
  const category = issue.category ?? "General";
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const canChangeStatus = issue.id && onStatusChange;

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={onClick}
        className="flex h-full w-full flex-col rounded-xl border border-border bg-card p-4 text-left shadow-sm transition-all duration-200 hover:shadow-md hover:border-border/80"
      >
        <p className="line-clamp-2 min-h-[2.5rem] max-w-[28ch] font-medium">
          {truncate(issue.title || "Untitled", 50)}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {formatDate(issue.createdAt)}
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <StatusTag status={status} />
          <CategoryTag category={category} />
        </div>
      </button>
      {canChangeStatus && (
        <div className="absolute right-2 top-2" ref={menuRef}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((o) => !o);
            }}
            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Change status"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full z-50 mt-1 min-w-[100px] rounded-lg border border-border bg-popover py-1 shadow-md">
              {STATUSES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onStatusChange(issue, s);
                    setMenuOpen(false);
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
      )}
    </div>
  );
}
