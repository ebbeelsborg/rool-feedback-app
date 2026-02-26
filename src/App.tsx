import { useState, useEffect } from "react";
import { ThemeProvider } from "@/lib/theme-provider";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ensureSpace,
  getIssues,
  searchIssuesInMemory,
  updateIssueStatus,
  updateIssueCategory,
  addIssueAttachments,
  canEditIssue,
  type Space,
  type Issue,
  type IssueStatus,
} from "@/lib/rool";
import { parseUrl, pushUrl, type Section as UrlSection } from "@/lib/url-sync";
import { parseIssueContent } from "@/lib/issue-content";
import { Chat } from "@/components/chat";
import { SidebarNav, type Section } from "@/components/sidebar-nav";
import { IssuesPage } from "@/components/issues-page";
import { SearchPage } from "@/components/search-page";
import { Heart, Loader2, MessageSquare, FolderOpen, Search, ArrowLeft, Bug } from "lucide-react";
import { StatusTag, CategoryTag } from "@/components/issue-card";
import { AttachmentImage } from "@/components/attachment-image";
import { IssueAttachmentUpload } from "@/components/issue-attachment-upload";
import { IssueStatusMenu } from "@/components/issue-status-menu";

function App() {
  const [space, setSpace] = useState<Space>(null);
  const [loading, setLoading] = useState(true);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const searchResults =
    searchQuery.trim() === ""
      ? []
      : searchIssuesInMemory(issues, searchQuery);
  const [section, setSection] = useState<Section>("chat");
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);

  useEffect(() => {
    const { section: urlSection, issueId } = parseUrl();
    setSection(urlSection);
    setSelectedIssue(issueId ? ({ id: issueId } as Issue) : null);
  }, []);

  useEffect(() => {
    if (!space || loading) return;
    pushUrl(section as UrlSection, selectedIssue?.id ?? null);
  }, [section, selectedIssue?.id, space, loading]);

  useEffect(() => {
    const onHashChange = () => {
      const { section: urlSection, issueId } = parseUrl();
      setSection(urlSection);
      if (issueId) {
        const issue = issues.find((i) => i.id === issueId);
        setSelectedIssue(issue ?? ({ id: issueId } as Issue));
      } else {
        setSelectedIssue(null);
      }
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, [issues]);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const s = await ensureSpace();
      if (cancelled) return;

      if (s) {
        setSpace(s);
        const list = await getIssues(s);
        if (!cancelled) {
          setIssues(list);
          const { issueId } = parseUrl();
          if (issueId) {
            const issue = list.find((i) => i.id === issueId);
            setSelectedIssue(issue ?? ({ id: issueId } as Issue));
          }
        }

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

  function handleSearch(query: string) {
    setSearchQuery(query);
  }

  function handleSectionChange(newSection: Section) {
    setSection(newSection);
    if (newSection !== "issues") {
      setSelectedIssue(null);
    }
  }

  const displayIssue =
    selectedIssue && issues.length > 0
      ? issues.find((i) => i.id === selectedIssue.id) ?? selectedIssue
      : selectedIssue;

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
            <SidebarNav section={section} onSectionChange={handleSectionChange} />
          </aside>

          <main className="flex min-w-0 flex-1 flex-col overflow-hidden p-3">
            <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <header className="shrink-0 border-b border-border bg-card/95 px-6 py-4 backdrop-blur supports-[backdrop-filter]:bg-card/80">
                {displayIssue ? (
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-semibold">Issue Details</h2>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedIssue(null);
                        setSection("issues");
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-medium text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      Back
                    </button>
                  </div>
                ) : (
                  <h2 className="flex items-center gap-2 text-base font-semibold">
                    {section === "chat" && <><MessageSquare className="h-4.5 w-4.5 text-primary" /> Chat</>}
                    {section === "issues" && <><FolderOpen className="h-4.5 w-4.5 text-primary" /> Issues</>}
                    {section === "search" && <><Search className="h-4.5 w-4.5 text-primary" /> Search</>}
                  </h2>
                )}
              </header>
              <div className="relative flex-1 overflow-hidden">
                <div
                  className={`absolute inset-0 flex flex-col ${
                    !displayIssue && section === "chat" ? "z-10" : "pointer-events-none invisible"
                  }`}
                >
                  <Chat space={space} issues={issues} onIssueSaved={refreshIssues} />
                </div>
                <div
                  className={`absolute inset-0 overflow-hidden ${
                    !displayIssue && section === "issues" ? "z-10" : "pointer-events-none invisible"
                  }`}
                >
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
                  </div>
                  <div
                    className={`absolute inset-0 overflow-hidden ${
                      !displayIssue && section === "search" ? "z-10" : "pointer-events-none invisible"
                    }`}
                  >
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
                  </div>
                {displayIssue && (
                  <div className="absolute inset-0 z-20 flex flex-col overflow-y-auto bg-card">
                    <div className="p-6">
                      <h1 className="text-xl font-bold flex items-center gap-2">
                        {(displayIssue.isBug || displayIssue.category === "Bug") && (
                          <Bug className="h-5 w-5 text-amber-600 shrink-0" aria-label="Bug" />
                        )}
                        {displayIssue.title ?? "Issue"}
                      </h1>
                      {(() => {
                        const { summary, body } = parseIssueContent(displayIssue.content);
                        return (
                          <>
                            {summary && (
                              <p className="mt-3 font-bold text-foreground">{summary}</p>
                            )}
                            {(displayIssue.createdByName || displayIssue.createdAt) && (
                              <p className="mt-2 flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
                                {displayIssue.createdByName && (
                                  <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 font-medium text-foreground">
                                    {displayIssue.createdByName.replace(/^@+/, "")}
                                  </span>
                                )}
                                {displayIssue.createdAt &&
                                  new Date(displayIssue.createdAt).toLocaleDateString("en-GB", {
                                    day: "numeric",
                                    month: "long",
                                    year: "numeric",
                                  })}
                              </p>
                            )}
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              <StatusTag status={displayIssue.status ?? "Open"} />
                              <CategoryTag category={displayIssue.category ?? "General"} />
                              {displayIssue.id && space && canEditIssue(space, displayIssue) && (
                                <IssueStatusMenu
                                  issue={displayIssue}
                                  onStatusUpdate={async (newStatus) => {
                                    await updateIssueStatus(space, displayIssue.id!, newStatus, displayIssue);
                                    setSelectedIssue({ ...displayIssue, status: newStatus });
                                    refreshIssues();
                                  }}
                                  onCategoryUpdate={async (newCategory) => {
                                    await updateIssueCategory(space, displayIssue.id!, newCategory, displayIssue);
                                    setSelectedIssue({ ...displayIssue, category: newCategory });
                                    refreshIssues();
                                  }}
                                />
                              )}
                            </div>
                            {(displayIssue.attachments?.length ?? 0) > 0 && space && (
                              <div className="mt-4 flex flex-wrap gap-3">
                                {displayIssue.attachments!.map((url) => (
                                  <AttachmentImage
                                    key={url}
                                    space={space}
                                    url={url}
                                    className="max-h-48 rounded-lg border border-border object-contain"
                                  />
                                ))}
                              </div>
                            )}
                            {displayIssue.id && space && canEditIssue(space, displayIssue) && (
                              <IssueAttachmentUpload
                                issue={displayIssue}
                                space={space}
                                onAdded={refreshIssues}
                              />
                            )}
                            <pre className="mt-6 whitespace-pre-wrap rounded-xl border border-border bg-muted/30 p-5 text-sm leading-relaxed">
                              {body || (displayIssue.id ? "Loading..." : "")}
                            </pre>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                )}
                </div>
            </div>
          </main>
        </div>
      )}
    </ThemeProvider>
  );
}

export default App;
