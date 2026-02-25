import { useState, useEffect } from "react";
import { ThemeProvider } from "@/lib/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ensureSpace,
  getIssues,
  searchIssues,
  type Space,
  type Issue,
} from "@/lib/rool";
import { Chat } from "@/components/chat";
import { SidebarNav, type Section } from "@/components/sidebar-nav";
import { IssuesPage } from "@/components/issues-page";
import { SearchPage } from "@/components/search-page";
import { Loader2 } from "lucide-react";

function App() {
  const [space, setSpace] = useState<Space>(null);
  const [loading, setLoading] = useState(true);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Issue[]>([]);
  const [section, setSection] = useState<Section>("chat");
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const s = await ensureSpace();
      if (cancelled) return;

      if (s) {
        setSpace(s);
        const list = await getIssues(s);
        if (!cancelled) setIssues(list);

        s.on("objectCreated", async () => {
          const list = await getIssues(s);
          setIssues(list);
        });
        s.on("objectUpdated", async () => {
          const list = await getIssues(s);
          setIssues(list);
        });
      }
      setLoading(false);
    }

    init();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!space) return;
    if (section === "issues") {
      getIssues(space).then(setIssues);
    }
  }, [space, section]);

  async function refreshIssues() {
    if (!space) return;
    const list = await getIssues(space);
    setIssues(list);
  }

  async function handleSearch(query: string) {
    setSearchQuery(query);
    if (!space) return;
    const list = query.trim()
      ? await searchIssues(space, query)
      : [];
    setSearchResults(list);
  }

  return (
    <ThemeProvider>
      {loading ? (
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : !space ? (
        <div className="flex min-h-screen items-center justify-center p-4">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>Sign in required</CardTitle>
              <CardDescription>
                You'll be redirected to sign in with Rool to use the issue tracker.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      ) : (
        <div className="flex h-screen">
          <aside className="flex w-48 shrink-0 flex-col border-r border-border bg-muted/20">
            <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2.5">
              <h1 className="truncate text-base font-semibold">Rool <span className="text-orange-500">❤️</span> Feedback</h1>
              <ThemeToggle />
            </div>
            <SidebarNav section={section} onSectionChange={setSection} />
          </aside>

          <main className="flex min-w-0 flex-1 flex-col">
            {selectedIssue ? (
              <div className="flex flex-col p-6">
                <header className="mb-4 border-b border-border pb-3">
                  <h2 className="text-lg font-semibold">Issue</h2>
                </header>
                <button
                  type="button"
                  onClick={() => setSelectedIssue(null)}
                  className="mb-4 self-start rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-all hover:bg-primary/10 hover:text-primary"
                >
                  ← Back
                </button>
                <h1 className="text-xl font-semibold">{selectedIssue.title}</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  {new Date(selectedIssue.createdAt).toLocaleString()}
                  {selectedIssue.category && ` · ${selectedIssue.category}`}
                </p>
                <pre className="mt-4 whitespace-pre-wrap rounded-xl border border-border bg-card p-4 text-sm shadow-sm">
                  {selectedIssue.content}
                </pre>
              </div>
            ) : (
              <>
                <header className="shrink-0 border-b border-border px-4 py-3">
                  <h2 className="text-lg font-semibold">
                    {section === "chat" && "Chat"}
                    {section === "issues" && "Issues"}
                    {section === "search" && "Search"}
                  </h2>
                </header>
                <div className="flex-1 overflow-hidden">
                  {section === "chat" && (
                    <Chat space={space} onIssueSaved={refreshIssues} />
                  )}
                  {section === "issues" && (
                    <IssuesPage
                      issues={issues}
                      onSelectIssue={(i) => {
                        setSelectedIssue(i);
                      }}
                    />
                  )}
                  {section === "search" && (
                    <SearchPage
                      issues={searchResults}
                      searchQuery={searchQuery}
                      onSearch={handleSearch}
                      onSelectIssue={(i) => setSelectedIssue(i)}
                    />
                  )}
                </div>
              </>
            )}
          </main>
        </div>
      )}
    </ThemeProvider>
  );
}

export default App;
