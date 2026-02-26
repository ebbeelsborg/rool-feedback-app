import { useState, useRef, useEffect } from "react";
import { type Issue, type IssueStatus } from "@/lib/rool";
import { formatDate } from "@/lib/format";
import { MoreVertical, CircleDot, CheckCircle2, XCircle, Tag } from "lucide-react";

const STATUS_STYLES: Record<IssueStatus, string> = {
  Open: "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40",
  Solved: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40",
  Rejected: "bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-400 border border-red-200 dark:border-red-800/40",
};

const STATUS_ICONS: Record<IssueStatus, React.ReactNode> = {
  Open: <CircleDot className="h-3 w-3" />,
  Solved: <CheckCircle2 className="h-3 w-3" />,
  Rejected: <XCircle className="h-3 w-3" />,
};

const STATUSES: IssueStatus[] = ["Open", "Solved", "Rejected"];

export function StatusTag({ status }: { status: IssueStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}
    >
      {STATUS_ICONS[status]}
      {status}
    </span>
  );
}

export function CategoryTag({ category }: { category: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
      <Tag className="h-3 w-3" />
      {category}
    </span>
  );
}

const truncate = (s: string, max: number) =>
  s.length <= max ? s : s.slice(0, max - 1) + "\u2026";

interface IssueCardProps {
  issue: Issue;
  onClick: () => void;
  onStatusChange?: (issue: Issue, newStatus: IssueStatus) => void;
  onCategoryChange?: (issue: Issue, newCategory: string) => void;
  canEdit?: (issue: Issue) => boolean;
  className?: string;
}

export function IssueCard({ issue, onClick, onStatusChange, onCategoryChange, canEdit, className }: IssueCardProps) {
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

  const canChange = issue.id && (onStatusChange || onCategoryChange) && (!canEdit || canEdit(issue));

  return (
    <div className={`group relative ${className}`}>
      <button
        type="button"
        onClick={onClick}
        className="flex h-full w-full flex-col rounded-xl border-2 border-orange-500 bg-white p-4 text-left shadow-sm transition-shadow duration-200 hover:shadow-lg dark:border-orange-500 dark:bg-gray-900"
      >
        <p className="line-clamp-2 min-h-[2.5rem] max-w-[28ch] font-semibold leading-snug">
          {truncate(issue.title || "Untitled", 50)}
        </p>
        <p className="mt-1.5 flex flex-wrap items-center gap-x-1.5 text-xs text-muted-foreground">
          {issue.createdByHandle && (
            <span className="inline-flex items-center rounded-md bg-muted px-1.5 py-0.5 font-medium text-foreground">
              @{issue.createdByHandle}
            </span>
          )}
          {formatDate(issue.createdAt)}
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <StatusTag status={status} />
          <CategoryTag category={category} />
        </div>
      </button>
      {canChange && (
        <div className="absolute right-2 top-2" ref={menuRef}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((o) => !o);
            }}
            className="rounded-lg p-1.5 text-muted-foreground opacity-0 transition-all hover:bg-muted hover:text-foreground group-hover:opacity-100"
            aria-label="Issue menu"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
          {menuOpen && (
            <div className="menu-dropdown right-0 top-full mt-1">
              {onStatusChange && (
                <>
                  <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Status</p>
                  {STATUSES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onStatusChange(issue, s);
                        setMenuOpen(false);
                      }}
                      className={status === s ? "font-medium bg-muted" : ""}
                    >
                      {STATUS_ICONS[s]}
                      {s}
                    </button>
                  ))}
                </>
              )}
              {onCategoryChange && (
                <>
                  <div className="my-1 border-t border-border" />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const newCat = window.prompt("New category (one word):", category);
                      if (newCat != null && newCat.trim()) {
                        onCategoryChange(issue, newCat.trim());
                        setMenuOpen(false);
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
      )}
    </div>
  );
}
