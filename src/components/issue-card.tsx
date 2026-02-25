import { type Issue, type IssueStatus } from "@/lib/rool";

const STATUS_STYLES: Record<IssueStatus, string> = {
  Open: "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400",
  Solved: "bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-400",
  Rejected: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/60 dark:text-yellow-400",
};

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
  className?: string;
}

export function IssueCard({ issue, onClick, className }: IssueCardProps) {
  const status = issue.status ?? "Open";
  const category = issue.category ?? "General";

  return (
    <button
      type="button"
      onClick={onClick}
      className={className}
    >
      <p className="line-clamp-2 min-h-[2.5rem] font-medium">
        {truncate(issue.title || "Untitled", 50)}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        {new Date(issue.createdAt).toLocaleString()}
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <StatusTag status={status} />
        <CategoryTag category={category} />
      </div>
    </button>
  );
}
