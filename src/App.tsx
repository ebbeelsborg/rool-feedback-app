import { useState, useEffect } from "react";
import { ThemeProvider } from "@/lib/theme-provider";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ensureSpace,
  getIssues,
  searchIssues,
  updateIssueStatus,
  updateIssueCategory,
  canEditIssue,
  type Space,
  type Issue,
  type IssueStatus,
} from "@/lib/rool";
import { Chat } from "@/components/chat";
import { SidebarNav, type Section } from "@/components/sidebar-nav";
import { IssuesPage } from "@/components/issues-page";
import { SearchPage } from "@/components/search-page";
import { Heart, Loader2, MessageSquare, FolderOpen, Search, ArrowLeft } from "lucide-react";
import { StatusTag, CategoryTag } from "@/components/issue-card";
import { IssueStatusMenu } from "@/components/issue-status-menu";

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
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-3">
            <div className="rounded-2xl bg-primary/10 p-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </div>
      ) : !space ? (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
          <Card className="max-w-md shadow-lg">
            <CardHeader>
              <CardTitle>Sign in required</CardTitle>
              <CardDescription>
                You'll be redirected to sign in with Rool to use the issue tracker.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      ) : (
        <div className="flex h-screen bg-background">
          <aside className="my-3 ml-3 flex w-60 shrink-0 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="border-b border-border px-4 py-3.5">
              <h1 className="flex items-center gap-1.5 truncate text-sm font-bold tracking-tight">
                Rool <Heart className="h-3.5 w-3.5 fill-orange-500 text-orange-500" /> Feedback
              </h1>
            </div>
            <SidebarNav section={section} onSectionChange={setSection} />
          </aside>

          <main className="flex min-w-0 flex-1 flex-col overflow-hidden p-3">
            <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            {selectedIssue ? (
              <div className="flex flex-col overflow-y-auto">
                <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card/95 px-6 py-4 backdrop-blur supports-[backdrop-filter]:bg-card/80">
                  <h2 className="text-base font-semibold">Issue Details</h2>
                  <button
                    type="button"
                    onClick={() => setSelectedIssue(null)}
                    className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-medium text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back
                  </button>
                </header>
                <div className="p-6">
                  <h1 className="text-xl font-bold">{selectedIssue.title}</h1>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {new Date(selectedIssue.createdAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <StatusTag status={selectedIssue.status ?? "Open"} />
                    <CategoryTag category={selectedIssue.category ?? "General"} />
                    {selectedIssue.id && space && canEditIssue(space, selectedIssue) && (
                      <IssueStatusMenu
                        issue={selectedIssue}
                        onStatusUpdate={async (newStatus) => {
                          await updateIssueStatus(space, selectedIssue.id!, newStatus, selectedIssue);
                          setSelectedIssue({ ...selectedIssue, status: newStatus });
                          refreshIssues();
                        }}
                        onCategoryUpdate={async (newCategory) => {
                          await updateIssueCategory(space, selectedIssue.id!, newCategory, selectedIssue);
                          setSelectedIssue({ ...selectedIssue, category: newCategory });
                          refreshIssues();
                        }}
                      />
                    )}
                  </div>
                  <pre className="mt-6 whitespace-pre-wrap rounded-xl border border-border bg-muted/30 p-5 text-sm leading-relaxed">
                    {selectedIssue.content}
                  </pre>
                </div>
              </div>
            ) : (
              <>
                <header className="shrink-0 border-b border-border bg-card/95 px-6 py-4 backdrop-blur supports-[backdrop-filter]:bg-card/80">
                  <h2 className="flex items-center gap-2 text-base font-semibold">
                    {section === "chat" && <><MessageSquare className="h-4.5 w-4.5 text-primary" /> Chat</>}
                    {section === "issues" && <><FolderOpen className="h-4.5 w-4.5 text-primary" /> Issues</>}
                    {section === "search" && <><Search className="h-4.5 w-4.5 text-primary" /> Search</>}
                  </h2>
                </header>
                <div className="flex-1 overflow-hidden">
                  {section === "chat" && (
                    <Chat space={space} onIssueSaved={refreshIssues} />
                  )}
                  {section === "issues" && (
                    <IssuesPage
                      issues={issues}
                      onSelectIssue={(i) => setSelectedIssue(i)}
                      canEdit={space ? (i) => canEditIssue(space, i) : undefined}
                      onStatusChange={
                        space
                          ? async (issue: Issue, newStatus: IssueStatus) => {
                              if (issue.id) {
                                await updateIssueStatus(space, issue.id, newStatus, issue);
                                refreshIssues();
                              }
                            }
                          : undefined
                      }
                      onCategoryChange={
                        space
                          ? async (issue: Issue, newCategory: string) => {
                              if (issue.id) {
                                await updateIssueCategory(space, issue.id, newCategory, issue);
                                refreshIssues();
                              }
                            }
                          : undefined
                      }
                    />
                  )}
                  {section === "search" && (
                    <SearchPage
                      issues={searchResults}
                      searchQuery={searchQuery}
                      onSearch={handleSearch}
                      onSelectIssue={(i) => setSelectedIssue(i)}
                      canEdit={space ? (i) => canEditIssue(space, i) : undefined}
                      onStatusChange={
                        space
                          ? async (issue: Issue, newStatus: IssueStatus) => {
                              if (issue.id) {
                                await updateIssueStatus(space, issue.id, newStatus, issue);
                                refreshIssues();
                                handleSearch(searchQuery);
                              }
                            }
                          : undefined
                      }
                      onCategoryChange={
                        space
                          ? async (issue: Issue, newCategory: string) => {
                              if (issue.id) {
                                await updateIssueCategory(space, issue.id, newCategory, issue);
                                refreshIssues();
                                handleSearch(searchQuery);
                              }
                            }
                          : undefined
                      }
                    />
                  )}
                </div>
              </>
            )}
            </div>
          </main>
        </div>
      )}
    </ThemeProvider>
  );
}

export default App;
