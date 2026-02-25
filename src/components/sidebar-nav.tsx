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
    <nav className="flex flex-col gap-1 p-2">
      {items.map(({ id, label, icon }) => {
        const isSelected = section === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onSectionChange(id)}
            className={`flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-all duration-200 ${
              isSelected
                ? "bg-primary/20 text-primary shadow-sm ring-1 ring-primary/30"
                : "text-muted-foreground hover:bg-primary/10 hover:text-primary/80"
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
