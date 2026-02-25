import { useState } from "react";
import { Input } from "@/components/ui/input";
import { type Issue } from "@/lib/rool";
import { IssueCard } from "@/components/issue-card";
import { Search } from "lucide-react";

const PAGE_SIZE = 10;

interface SearchPageProps {
  issues: Issue[];
  searchQuery: string;
  onSearch: (query: string) => void;
  onSelectIssue: (issue: Issue) => void;
  onStatusChange?: (issue: Issue, newStatus: import("@/lib/rool").IssueStatus) => void;
  onCategoryChange?: (issue: Issue, newCategory: string) => void;
}

export function SearchPage({
  issues,
  searchQuery,
  onSearch,
  onSelectIssue,
  onStatusChange,
  onCategoryChange,
}: SearchPageProps) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query.trim());
    setPage(0);
  };

  const totalPages = Math.ceil(issues.length / PAGE_SIZE) || 1;
  const currentPage = Math.min(page, totalPages - 1);
  const paginated = issues.slice(
    currentPage * PAGE_SIZE,
    (currentPage + 1) * PAGE_SIZE
  );

  return (
    <div className="flex h-full flex-col p-6">
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search issues... (press Enter)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </form>

      <div className="flex-1 overflow-y-auto">
        <div className="grid gap-3 sm:grid-cols-2" style={{ maxWidth: "min(100%, 720px)" }}>
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
          <p className="py-8 text-center text-sm text-muted-foreground">
            {searchQuery ? "No matching issues." : "Enter a search and press Enter."}
          </p>
        )}

        {issues.length > PAGE_SIZE && (
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
        )}
      </div>
    </div>
  );
}
