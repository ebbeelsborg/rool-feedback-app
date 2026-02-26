import { RoolClient } from "@rool-dev/sdk";

export type IssueStatus = "Open" | "Solved" | "Rejected";

export interface Issue {
  id?: string;
  type: "Issue";
  title: string;
  content: string;
  category?: string;
  status?: IssueStatus;
  createdBy?: string;
  createdByName?: string;
  createdAt: number;
  dateKey: string;
}

const SPACE_NAME = "Rool Feedback";

const SHARED_SPACE_ID = import.meta.env.VITE_ROOL_FEEDBACK_SPACE_ID as string | undefined;

let client: RoolClient | null = null;

export function getRoolClient(): RoolClient {
  if (!client) {
    client = new RoolClient();
  }
  return client;
}

export async function ensureSpace() {
  const rool = getRoolClient();
  const authenticated = await rool.initialize();

  if (!authenticated) {
    rool.login("Rool Feedback");
    return null;
  }

  if (SHARED_SPACE_ID?.trim()) {
    const space = await rool.openSpace(SHARED_SPACE_ID.trim());
    // Ensure anyone with the app link can access the space
    if (space && space.linkAccess !== "editor") {
      await space.setLinkAccess("editor").catch(() => {});
    }
    return space;
  }

  const spaces = await rool.listSpaces();
  const existing = spaces.find((s: { name: string }) => s.name === SPACE_NAME);

  if (existing) {
    return rool.openSpace(existing.id);
  }

  return rool.createSpace(SPACE_NAME);
}

export type Space = Awaited<ReturnType<typeof ensureSpace>>;

function getChatInstruction(): string {
  const base = import.meta.env.BASE_URL ?? "/rool-feedback-app/";
  const basePath = base.endsWith("/") ? base.slice(0, -1) : base;
  const issueUrlExample =
    typeof window !== "undefined"
      ? `${window.location.origin}${basePath}/#/issues/{id}`
      : `https://use.rool.app${basePath}/#/issues/{id}`;

  return `You help users clarify their feedback and condense it into a concrete issue. Be forthcoming and effective: ask brief, focused questions to fill gaps; suggest clearer wording when helpful. Thank the user for reporting, but stay to-the-point—no fluff.

CRITICAL - You CANNOT create, save, or log issues. You have no ability to do so. You can only chat. Every issue is created ONLY when the user clicks Summarize, then Approve & Save. NEVER say "I've created", "I created", "I saved", "I logged", "I've added", or similar—you cannot and did not. If the user wants to save the issue, tell them to click Summarize when ready, then Approve & Save.

Rules: Do NOT create, update, or save any objects. Only respond in chat. The user's Issues list is the source of truth—if the user says they don't see an issue, it does not exist. Never say an issue is "already there", "already saved", "already logged", or "in the list" unless the user has just confirmed they completed Approve & Save. If they repeat a request, suggest they click Summarize when ready. You may acknowledge that an issue was saved when the user confirms they approved it (e.g. "I just saved it").

When referencing an existing issue: use the "Current issues in the space" list provided below—it has id, title, category, and content for each issue. Match the user's request to the right issue and use its id for the URL. Format: [Issue title](URL) where URL is ${issueUrlExample} with the issue's id. Example: [GitHub login request](${issueUrlExample.replace("{id}", "abc123")}).

IMPORTANT: You have full access to the conversation history below. Always keep previous messages in mind when answering. Never say you don't have access to previous messages—you do.

`;
}

function formatIssuesForPrompt(issues: Issue[]): string {
  if (issues.length === 0) return "No issues in the space yet.";
  return issues
    .map((i) => {
      const snippet = (i.content ?? "").slice(0, 200);
      return `- id: ${i.id ?? "?"} | title: ${i.title ?? "Untitled"} | category: ${i.category ?? "General"} | content: ${snippet}${snippet.length >= 200 ? "..." : ""}`;
    })
    .join("\n");
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function chatPrompt(
  space: NonNullable<Space>,
  userMessage: string,
  issues: Issue[] = [],
  history: ChatMessage[] = []
): Promise<{ message: string }> {
  const issuesBlock = `\n\nCurrent issues in the space (use these when referencing existing issues):\n${formatIssuesForPrompt(issues)}\n`;
  const historyBlock =
    history.length > 0
      ? `\n\nConversation so far:\n${history.map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`).join("\n\n")}\n`
      : "";
  const fullPrompt =
    getChatInstruction() + issuesBlock + historyBlock + `\nUser message: ${userMessage}`;
  const { message } = await space.prompt(fullPrompt, {
    readOnly: true,
    effort: "QUICK",
  });
  return { message };
}

const MAX_TITLE_LENGTH = 50;

export async function requestSummary(space: NonNullable<Space>): Promise<{
  title: string;
  summary: string;
  category: string;
  status: IssueStatus;
}> {
  const { message } = await space.prompt(
    "Based on our conversation, provide: a short title (max 50 characters), a 2-3 sentence summary, a category (one word, e.g. Bug, Feature, UX), and a status (exactly one of: Open, Solved, Rejected). New issues are usually Open. When writing the summary, refer to the reporter as 'The user' (e.g. 'The user is...') not 'Users' (e.g. 'Users are...'). Reply in this exact JSON format only, no other text: {\"title\": \"...\", \"summary\": \"...\", \"category\": \"...\", \"status\": \"Open\"}"
  );
  const raw = message.trim();
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]) as { title?: string; summary?: string; category?: string; status?: string };
      const title = (parsed.title ?? "Untitled").slice(0, MAX_TITLE_LENGTH);
      const status = parsed.status === "Solved" || parsed.status === "Rejected" ? parsed.status : "Open";
      return {
        title,
        summary: parsed.summary ?? "",
        category: (parsed.category ?? "General").split(/\s+/)[0] ?? "General",
        status,
      };
    } catch {
      /* fall through */
    }
  }
  return { title: "Untitled", summary: raw, category: "General", status: "Open" };
}

export async function createIssue(
  space: NonNullable<Space>,
  data: { title: string; content: string; category: string; status?: IssueStatus }
): Promise<{ success: boolean; error?: string }> {
  const now = Date.now();
  const dateKey = new Date(now).toISOString().slice(0, 10);
  const title = data.title.slice(0, MAX_TITLE_LENGTH);
  const status = data.status ?? "Open";

  let createdByName: string | undefined;
  try {
    const user = await getRoolClient().getCurrentUser();
    createdByName = user.name || user.slug || user.email?.split("@")[0] || undefined;
  } catch {
    const auth = getRoolClient().getAuthUser();
    createdByName = auth.name || auth.email?.split("@")[0] || undefined;
  }

  try {
    await space.createObject({
      data: {
        type: "Issue",
        title,
        content: data.content,
        category: data.category,
        status,
        createdBy: space.userId,
        createdByName,
        createdAt: now,
        dateKey,
      },
    });
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to save",
    };
  }
}

function normalizeToIssue(obj: Record<string, unknown>): Issue {
  // Support both flat objects and nested data (RoolObjectEntry)
  const raw = (obj.data as Record<string, unknown>) ?? obj;
  const status =
    raw.status === "Solved" || raw.status === "Rejected"
      ? (raw.status as IssueStatus)
      : "Open";
  const content = (raw.content ?? raw.description ?? "") as string;
  const createdAt = (raw.createdAt as number) ?? 0;
  const id = (raw.id ?? obj.id) as string;
  return {
    id,
    type: "Issue",
    title: (raw.title ?? "Untitled") as string,
    content,
    category: (raw.category ?? "General") as string,
    status,
    createdBy: raw.createdBy as string | undefined,
    createdByName: (raw.createdByName ?? raw.createdByHandle ?? raw.reportedBy ?? undefined) as string | undefined,
    createdAt,
    dateKey: (raw.dateKey ?? new Date(createdAt).toISOString().slice(0, 10)) as string,
  };
}

export async function getIssues(space: NonNullable<Space>): Promise<Issue[]> {
  try {
    const [byLower, byUpper] = await Promise.all([
      space.findObjects({ where: { type: "issue" }, limit: 200 }),
      space.findObjects({ where: { type: "Issue" }, limit: 200 }),
    ]);
    const objects = [...(byLower.objects ?? []), ...(byUpper.objects ?? [])];
    const seen = new Set<string>();
    const deduped = objects.filter((o) => {
      const id = (o as { id?: string }).id;
      if (!id || seen.has(id)) return false;
      seen.add(id);
      return true;
    });
    return deduped
      .map((o) => normalizeToIssue(o as Record<string, unknown>))
      .sort((a, b) => b.createdAt - a.createdAt);
  } catch {
    return [];
  }
}

export function canEditIssue(space: NonNullable<Space>, issue: Issue): boolean {
  if (!issue.createdBy) return true;
  return issue.createdBy === space.userId;
}

export async function updateIssueStatus(
  space: NonNullable<Space>,
  objectId: string,
  status: IssueStatus,
  issue?: Issue
): Promise<{ success: boolean; error?: string }> {
  if (issue && !canEditIssue(space, issue)) {
    return { success: false, error: "You can only edit your own issues" };
  }
  try {
    await space.updateObject(objectId, { data: { status } });
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update",
    };
  }
}

export async function updateIssueCategory(
  space: NonNullable<Space>,
  objectId: string,
  category: string,
  issue?: Issue
): Promise<{ success: boolean; error?: string }> {
  if (issue && !canEditIssue(space, issue)) {
    return { success: false, error: "You can only edit your own issues" };
  }
  const trimmed = category.trim().split(/\s+/)[0] ?? "General";
  try {
    await space.updateObject(objectId, { data: { category: trimmed } });
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update",
    };
  }
}

/** Client-side search over issues in memory. Instant, no backend calls. */
export function searchIssuesInMemory(issues: Issue[], query: string): Issue[] {
  const q = query.trim();
  if (!q) return [];

  const words = q
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 0);

  return issues
    .filter((issue) => {
      const text = [
        issue.title ?? "",
        issue.content ?? "",
        issue.category ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return words.every((w) => text.includes(w));
    })
    .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
}
