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
    <nav className="flex flex-col gap-0.5 p-2">
      {items.map(({ id, label, icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => onSectionChange(id)}
          className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium transition-colors ${
            section === id
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          {icon}
          {label}
        </button>
      ))}
    </nav>
  );
}
