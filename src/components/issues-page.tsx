import { useState } from "react";
import { type Issue } from "@/lib/rool";
import { IssueCard } from "@/components/issue-card";
import { FolderOpen } from "lucide-react";

const PAGE_SIZE = 10;

interface IssuesPageProps {
  issues: Issue[];
  onSelectIssue: (issue: Issue) => void;
  onStatusChange?: (issue: Issue, newStatus: import("@/lib/rool").IssueStatus) => void;
  onCategoryChange?: (issue: Issue, newCategory: string) => void;
}

export function IssuesPage({ issues, onSelectIssue, onStatusChange, onCategoryChange }: IssuesPageProps) {
  const [page, setPage] = useState(0);

  const totalPages = Math.ceil(issues.length / PAGE_SIZE) || 1;
  const currentPage = Math.min(page, totalPages - 1);
  const paginated = issues.slice(
    currentPage * PAGE_SIZE,
    (currentPage + 1) * PAGE_SIZE
  );

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" style={{ maxWidth: "min(100%, 960px)" }}>
          {paginated.map((issue) => (
            <IssueCard
              key={issue.id ?? issue.createdAt}
              issue={issue}
              onClick={() => onSelectIssue(issue)}
              onStatusChange={onStatusChange}
              onCategoryChange={onCategoryChange}
            />
          ))}
        </div>

        {issues.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-2xl bg-muted p-4">
              <FolderOpen className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="mt-4 text-sm font-medium text-foreground">No issues yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Chat about your issue, then summarize and save.
            </p>
          </div>
        )}

        {issues.length > PAGE_SIZE && (
          <div className="mt-6 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={currentPage === 0}
              className="rounded-xl border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-2 text-sm text-muted-foreground">
              {currentPage + 1} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={currentPage >= totalPages - 1}
              className="rounded-xl border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
