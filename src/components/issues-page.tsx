import { useState, useMemo } from "react";
import { type Issue } from "@/lib/rool";
import { ChevronRight, ChevronDown } from "lucide-react";

const PAGE_SIZE = 10;

interface IssuesPageProps {
  issues: Issue[];
  onSelectIssue: (issue: Issue) => void;
}

export function IssuesPage({ issues, onSelectIssue }: IssuesPageProps) {
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(0);

  const grouped = useMemo(() => {
    const byDate = new Map<string, Issue[]>();
    for (const issue of issues) {
      const key = issue.dateKey ?? new Date(issue.createdAt).toISOString().slice(0, 10);
      if (!byDate.has(key)) byDate.set(key, []);
      byDate.get(key)!.push(issue);
    }
    return Array.from(byDate.entries())
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, items]) => ({ date, items }));
  }, [issues]);

  const toggleDate = (date: string) => {
    setExpandedDates((prev) => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });
    setPage(0);
  };

  const flatIssues = useMemo(() => {
    const result: { date: string; issue: Issue }[] = [];
    const showAll = expandedDates.size === 0;
    for (const { date, items } of grouped) {
      if (showAll || expandedDates.has(date)) {
        for (const issue of items) {
          result.push({ date, issue });
        }
      }
    }
    return result;
  }, [grouped, expandedDates]);

  const totalPages = Math.ceil(flatIssues.length / PAGE_SIZE) || 1;
  const currentPage = Math.min(page, totalPages - 1);
  const paginatedIssues = flatIssues.slice(
    currentPage * PAGE_SIZE,
    (currentPage + 1) * PAGE_SIZE
  );

  const truncate = (s: string, max: number) =>
    s.length <= max ? s : s.slice(0, max - 1) + "…";

  const usePagination = flatIssues.length > PAGE_SIZE;

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mb-4 space-y-2">
          {grouped.map(({ date, items }) => {
            const isExpanded = expandedDates.has(date) || expandedDates.size === 0;
            return (
              <button
                key={date}
                type="button"
                onClick={() => toggleDate(date)}
                className="flex w-full items-center gap-2 rounded-lg border border-border bg-muted/30 px-4 py-2 text-left text-sm font-medium hover:bg-muted/50"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 shrink-0" />
                ) : (
                  <ChevronRight className="h-4 w-4 shrink-0" />
                )}
                {date}
                <span className="text-muted-foreground">({items.length})</span>
              </button>
            );
          })}
        </div>

        {usePagination ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              {paginatedIssues.map(({ issue }) => (
                <button
                  key={issue.id ?? issue.createdAt}
                  type="button"
                  onClick={() => onSelectIssue(issue)}
                  className="rounded-lg border border-border bg-card p-4 text-left transition-colors hover:bg-muted/30"
                >
                  <p className="font-medium">
                    {truncate(issue.title || "Untitled", 40)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(issue.createdAt).toLocaleString()}
                  </p>
                  {issue.category && (
                    <span className="mt-2 inline-block rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      {issue.category}
                    </span>
                  )}
                </button>
              ))}
            </div>
            <div className="mt-6 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={currentPage === 0}
                className="rounded border border-border px-3 py-1 text-sm disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-muted-foreground">
                {currentPage + 1} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={currentPage >= totalPages - 1}
                className="rounded border border-border px-3 py-1 text-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {flatIssues.map(({ issue }) => (
              <button
                key={issue.id ?? issue.createdAt}
                type="button"
                onClick={() => onSelectIssue(issue)}
                className="rounded-lg border border-border bg-card p-4 text-left transition-colors hover:bg-muted/30"
              >
                <p className="font-medium">
                  {truncate(issue.title || "Untitled", 40)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(issue.createdAt).toLocaleString()}
                </p>
                {issue.category && (
                  <span className="mt-2 inline-block rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {issue.category}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
