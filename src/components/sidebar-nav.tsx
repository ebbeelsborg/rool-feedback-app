import { MessageSquare, FolderOpen, Search } from "lucide-react";

export type Section = "chat" | "issues" | "search";

interface SidebarNavProps {
  section: Section;
  onSectionChange: (section: Section) => void;
}

export function SidebarNav({ section, onSectionChange }: SidebarNavProps) {
  const items: { id: Section; label: string; icon: React.ReactNode }[] = [
    { id: "chat", label: "Chat", icon: <MessageSquare className="h-4 w-4" /> },
    { id: "issues", label: "Issues", icon: <FolderOpen className="h-4 w-4" /> },
    { id: "search", label: "Search", icon: <Search className="h-4 w-4" /> },
  ];

  return (
    <nav className="flex flex-col gap-1 p-3">
      {items.map(({ id, label, icon }) => {
        const isSelected = section === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onSectionChange(id)}
            className={`flex w-full items-center gap-2 rounded-lg border-l-4 px-3 py-2.5 text-left text-sm font-medium transition-all duration-200 ${
              isSelected
                ? "border-l-orange-500 bg-orange-50 text-orange-700 dark:border-l-orange-500 dark:bg-orange-950/40 dark:text-orange-400"
                : "border-l-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            }`}
          >
            {icon}
            {label}
          </button>
        );
      })}
    </nav>
  );
}
