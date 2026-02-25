import { useState } from "react";
import { type Issue } from "@/lib/rool";
import { IssueCard } from "@/components/issue-card";

const PAGE_SIZE = 10;

interface IssuesPageProps {
  issues: Issue[];
  onSelectIssue: (issue: Issue) => void;
}

const CARD_CLASS =
  "group flex min-h-[100px] flex-col rounded-xl border border-border bg-[hsl(var(--pastel-lavender))] p-4 text-left shadow-sm transition-all duration-200 hover:shadow-md hover:border-orange-300/50 dark:bg-[hsl(var(--pastel-lavender))]/40 dark:hover:border-orange-500/40";

export function IssuesPage({ issues, onSelectIssue }: IssuesPageProps) {
  const [page, setPage] = useState(0);

  const totalPages = Math.ceil(issues.length / PAGE_SIZE) || 1;
  const currentPage = Math.min(page, totalPages - 1);
  const paginated = issues.slice(
    currentPage * PAGE_SIZE,
    (currentPage + 1) * PAGE_SIZE
  );

  return (
    <div className="flex h-full flex-col bg-[hsl(var(--pastel-sky))] dark:bg-[hsl(var(--pastel-sky))]/30">
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid gap-3 sm:grid-cols-2">
          {paginated.map((issue) => (
            <IssueCard
              key={issue.id ?? issue.createdAt}
              issue={issue}
              onClick={() => onSelectIssue(issue)}
              className={CARD_CLASS}
            />
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
