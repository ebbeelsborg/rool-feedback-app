import { useState } from "react";
import { type Issue } from "@/lib/rool";

const PAGE_SIZE = 10;

interface IssuesPageProps {
  issues: Issue[];
  onSelectIssue: (issue: Issue) => void;
}

export function IssuesPage({ issues, onSelectIssue }: IssuesPageProps) {
  const [page, setPage] = useState(0);

  const totalPages = Math.ceil(issues.length / PAGE_SIZE) || 1;
  const currentPage = Math.min(page, totalPages - 1);
  const paginated = issues.slice(
    currentPage * PAGE_SIZE,
    (currentPage + 1) * PAGE_SIZE
  );

  const truncate = (s: string, max: number) =>
    s.length <= max ? s : s.slice(0, max - 1) + "…";

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid gap-3 sm:grid-cols-2">
          {paginated.map((issue) => (
            <button
              key={issue.id ?? issue.createdAt}
              type="button"
              onClick={() => onSelectIssue(issue)}
              className="group rounded-xl border border-border bg-card p-4 text-left transition-all duration-200 hover:scale-[1.02] hover:shadow-md hover:shadow-primary/10 hover:border-primary/30"
            >
              <p className="font-medium">
                {truncate(issue.title || "Untitled", 40)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {new Date(issue.createdAt).toLocaleString()}
              </p>
              {issue.category && (
                <span className="mt-2 inline-block rounded-lg bg-primary/10 px-2 py-0.5 text-xs text-primary">
                  {issue.category}
                </span>
              )}
            </button>
          ))}
        </div>

        {issues.length === 0 && (
          <p className="py-12 text-center text-sm text-muted-foreground">
            No issues yet. Chat about your issue, then summarize and save.
          </p>
        )}

        {issues.length > PAGE_SIZE && (
          <div className="mt-6 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={currentPage === 0}
              className="rounded-lg border border-border px-3 py-1.5 text-sm transition-colors hover:bg-muted disabled:opacity-50"
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
              className="rounded-lg border border-border px-3 py-1.5 text-sm transition-colors hover:bg-muted disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
