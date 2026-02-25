import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type FeedbackCategory, type FeedbackData } from "@/lib/rool";
import { Search, MessageSquare, ChevronDown, ChevronUp } from "lucide-react";

const CATEGORIES: { value: string; label: string }[] = [
  { value: "all", label: "All categories" },
  { value: "bug", label: "Bug" },
  { value: "feature", label: "Feature" },
  { value: "improvement", label: "Improvement" },
  { value: "general", label: "General" },
];

function normalizeCategory(c?: string): FeedbackCategory {
  const s = c?.toLowerCase()?.trim();
  if (s && ["bug", "feature", "improvement", "general"].includes(s)) {
    return s as FeedbackCategory;
  }
  return "general";
}

interface FeedbackArchiveProps {
  feedbackList: FeedbackData[];
}

export function FeedbackArchive({ feedbackList }: FeedbackArchiveProps) {
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return feedbackList.filter((f) => {
      const cat = normalizeCategory(f.category);
      if (categoryFilter !== "all" && cat !== categoryFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchMessage = f.message?.toLowerCase().includes(q);
        const matchSummary = f.summary?.toLowerCase().includes(q);
        const matchCategory = cat.includes(q);
        if (!matchMessage && !matchSummary && !matchCategory) return false;
      }
      return true;
    });
  }, [feedbackList, categoryFilter, searchQuery]);

  if (feedbackList.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        <MessageSquare className="mx-auto mb-2 h-10 w-10 opacity-50" />
        <p>No feedback yet. Share your thoughts above!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search feedback..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <ul className="space-y-2">
        {filtered.map((f, i) => {
          const id = f.id ?? `fb-${i}-${f.createdAt}`;
          const isExpanded = expandedId === id;
          const cat = normalizeCategory(f.category);

          return (
            <li
              key={id}
              className="rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted/30"
            >
              <button
                type="button"
                onClick={() => setExpandedId(isExpanded ? null : id)}
                className="w-full text-left"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <span className="inline-block rounded bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                      {cat}
                    </span>
                    <p
                      className={`mt-2 text-sm ${
                        isExpanded ? "" : "line-clamp-2"
                      }`}
                    >
                      {f.summary || f.message}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {f.createdAt
                        ? new Date(f.createdAt).toLocaleDateString()
                        : ""}
                    </p>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                </div>
              </button>
              {isExpanded && (
                <div className="mt-3 border-t border-border pt-3">
                  <p className="text-sm text-muted-foreground">{f.message}</p>
                  {f.summary && f.summary !== f.message && (
                    <p className="mt-2 text-xs italic text-muted-foreground">
                      Summary: {f.summary}
                    </p>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {filtered.length === 0 && (
        <p className="text-center text-sm text-muted-foreground">
          No feedback matches your filters.
        </p>
      )}
    </div>
  );
}
