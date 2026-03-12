import { RoolClient } from "@rool-dev/sdk";
import type { RoolChannel } from "@rool-dev/sdk";
import { z } from "zod";

export const IssueStatusSchema = z.enum(["Open", "Solved", "Rejected"]);
export type IssueStatus = z.infer<typeof IssueStatusSchema>;

export const IssueSchema = z.object({
  id: z.string().optional(),
  type: z.literal("Issue"),
  title: z.string().min(1),
  content: z.string(),
  category: z.string().default("General"),
  status: IssueStatusSchema.default("Open"),
  createdBy: z.string().optional(),
  createdByName: z.string().optional(),
  createdAt: z.number(),
  dateKey: z.string(),
  attachments: z.array(z.string()).optional(),
  isBug: z.boolean().optional(),
  issueNumber: z.number().optional(),
});

export type Issue = z.infer<typeof IssueSchema>;

export const CommentSchema = z.object({
  id: z.string().optional(),
  type: z.literal("Comment"),
  issueId: z.string(),
  content: z.string().min(1),
  createdBy: z.string().optional(),
  createdByName: z.string().optional(),
  createdAt: z.number(),
});

export type Comment = z.infer<typeof CommentSchema>;

const SPACE_NAME = "Rool Feedback";
const CHANNEL_ID = "main";
const SHARED_SPACE_ID = "vYI49S";

let client: RoolClient | null = null;

export function getRoolClient(): RoolClient {
  if (!client) {
    client = new RoolClient();
  }
  return client;
}

async function ensureCollections(channel: RoolChannel): Promise<void> {
  const schema = channel.getSchema();
  if (!schema.Issue) {
    await channel.createCollection("Issue", [
      { name: "type", type: { kind: "string" } },
      { name: "title", type: { kind: "string" } },
      { name: "content", type: { kind: "string" } },
      { name: "category", type: { kind: "string" } },
      { name: "status", type: { kind: "enum", values: ["Open", "Solved", "Rejected"] } },
      { name: "createdBy", type: { kind: "maybe", inner: { kind: "string" } } },
      { name: "createdByName", type: { kind: "maybe", inner: { kind: "string" } } },
      { name: "createdAt", type: { kind: "number" } },
      { name: "dateKey", type: { kind: "string" } },
      { name: "attachments", type: { kind: "maybe", inner: { kind: "array", inner: { kind: "string" } } } },
      { name: "isBug", type: { kind: "maybe", inner: { kind: "boolean" } } },
      { name: "issueNumber", type: { kind: "maybe", inner: { kind: "number" } } },
    ]).catch(() => {});
  }
  if (!schema.Comment) {
    await channel.createCollection("Comment", [
      { name: "type", type: { kind: "string" } },
      { name: "issueId", type: { kind: "string" } },
      { name: "content", type: { kind: "string" } },
      { name: "createdBy", type: { kind: "maybe", inner: { kind: "string" } } },
      { name: "createdByName", type: { kind: "maybe", inner: { kind: "string" } } },
      { name: "createdAt", type: { kind: "number" } },
    ]).catch(() => {});
  }
}

export async function ensureChannel(): Promise<RoolChannel | null> {
  const rool = getRoolClient();
  const authenticated = await rool.initialize();

  if (!authenticated) {
    rool.login("Rool Feedback");
    return null;
  }

  let spaceId: string;

  if (SHARED_SPACE_ID?.trim()) {
    const space = await rool.openSpace(SHARED_SPACE_ID.trim());
    if (space.linkAccess !== "editor") {
      await space.setLinkAccess("editor").catch(() => {});
    }
    spaceId = space.id;
  } else {
    const spaces = await rool.listSpaces();
    const existing = spaces.find((s: { name: string }) => s.name === SPACE_NAME);
    if (existing) {
      spaceId = existing.id;
    } else {
      const space = await rool.createSpace(SPACE_NAME);
      spaceId = space.id;
    }
  }

  const channel = await rool.openChannel(spaceId, CHANNEL_ID);
  await ensureCollections(channel);
  return channel;
}

/** Alias for backward compatibility. */
export type Space = RoolChannel;

function getChatInstruction(): string {
  const base = import.meta.env.BASE_URL ?? "/";
  const basePath = (base === "." || base === "./" ? "" : base.endsWith("/") ? base.slice(0, -1) : base) || "";
  const issueUrlExample =
    typeof window !== "undefined"
      ? `${window.location.origin}${basePath ? basePath + "/" : ""}#/issues/{id}`
      : `https://use.rool.app${basePath ? basePath + "/" : ""}#/issues/{id}`;

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
  channel: RoolChannel,
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
  const { message } = await channel.prompt(fullPrompt, {
    readOnly: true,
    effort: "QUICK",
  });
  return { message };
}

const MAX_TITLE_LENGTH = 50;

export async function requestSummary(channel: RoolChannel): Promise<{
  title: string;
  summary: string;
  category: string;
  status: IssueStatus;
}> {
  const { message } = await channel.prompt(
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
  channel: RoolChannel,
  data: {
    title: string;
    content: string;
    category: string;
    status?: IssueStatus;
    attachments?: string[];
    isBug?: boolean;
  }
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

  const issueNumber = await getNextIssueNumber(channel);

  try {
    await channel.createObject({
      data: {
        type: "Issue",
        title,
        content: data.content,
        category: data.category,
        status,
        createdBy: channel.userId,
        createdByName,
        createdAt: now,
        dateKey,
        issueNumber,
        ...(data.attachments?.length ? { attachments: data.attachments } : {}),
        ...(data.isBug ? { isBug: true } : {}),
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
  const raw = (obj.data as Record<string, unknown>) ?? obj;

  const transformed = {
    ...raw,
    id: (raw.id ?? obj.id) as string,
    type: "Issue",
    title: (raw.title ?? "Untitled") as string,
    content: (raw.content ?? raw.description ?? "") as string,
    category: (raw.category ?? "General") as string,
    status: (raw.status === "Solved" || raw.status === "Rejected" ? raw.status : "Open"),
    createdAt: (raw.createdAt as number) ?? Date.now(),
    dateKey: (raw.dateKey ?? new Date((raw.createdAt as number) ?? Date.now()).toISOString().slice(0, 10)) as string,
  };

  const result = IssueSchema.safeParse(transformed);

  if (!result.success) {
    console.warn(`[Rool] Issue validation failed for ${transformed.id}:`, result.error.format());
    return transformed as Issue;
  }

  return result.data;
}

export async function getIssues(channel: RoolChannel): Promise<Issue[]> {
  try {
    const [byLower, byUpper] = await Promise.all([
      channel.findObjects({ where: { type: "issue" }, limit: 200 }),
      channel.findObjects({ where: { type: "Issue" }, limit: 200 }),
    ]);
    const objects = [...(byLower.objects ?? []), ...(byUpper.objects ?? [])];
    const seen = new Set<string>();
    const deduped = objects.filter((o) => {
      const id = (o as { id?: string }).id;
      if (!id || seen.has(id)) return false;
      seen.add(id);
      return true;
    });
    const issues = deduped
      .map((o) => normalizeToIssue(o as Record<string, unknown>))
      .sort((a, b) => b.createdAt - a.createdAt);
    await ensureIssueNumbers(channel, issues);
    return issues;
  } catch {
    return [];
  }
}

async function getNextIssueNumber(channel: RoolChannel): Promise<number> {
  const [byLower, byUpper] = await Promise.all([
    channel.findObjects({ where: { type: "issue" }, limit: 500 }),
    channel.findObjects({ where: { type: "Issue" }, limit: 500 }),
  ]);
  const objects = [...(byLower.objects ?? []), ...(byUpper.objects ?? [])];
  const getNum = (o: unknown) => {
    const raw = (o as { data?: { issueNumber?: number } }).data ?? o;
    const n = (raw as { issueNumber?: number }).issueNumber;
    return typeof n === "number" ? n : 0;
  };
  const max = objects.length ? Math.max(0, ...objects.map(getNum)) : 0;
  return max + 1;
}

async function ensureIssueNumbers(channel: RoolChannel, issues: Issue[]): Promise<void> {
  const needNumber = issues.filter((i) => i.issueNumber == null && i.id);
  if (needNumber.length === 0) return;
  const used = new Set(issues.map((i) => i.issueNumber).filter((n): n is number => typeof n === "number"));
  const sorted = [...needNumber].sort((a, b) => a.createdAt - b.createdAt);
  let next = 1;
  for (const issue of sorted) {
    while (used.has(next)) next++;
    try {
      await channel.updateObject(issue.id!, { data: { issueNumber: next } });
      issue.issueNumber = next;
      used.add(next);
      next++;
    } catch {
      /* skip on error */
    }
  }
}

export function canEditIssue(channel: RoolChannel, issue: Issue | null): boolean {
  if (!issue || !issue.createdBy) return false;
  return issue.createdBy === channel.userId;
}

export async function updateIssueStatus(
  channel: RoolChannel,
  objectId: string,
  status: IssueStatus,
  issue?: Issue
): Promise<{ success: boolean; error?: string }> {
  if (issue && !canEditIssue(channel, issue)) {
    return { success: false, error: "You can only edit your own issues" };
  }
  try {
    await channel.updateObject(objectId, { data: { status } });
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update",
    };
  }
}

export async function updateIssueCategory(
  channel: RoolChannel,
  objectId: string,
  category: string,
  issue?: Issue
): Promise<{ success: boolean; error?: string }> {
  if (issue && !canEditIssue(channel, issue)) {
    return { success: false, error: "You can only edit your own issues" };
  }
  try {
    await channel.updateObject(objectId, { data: { category: category.trim() } });
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update",
    };
  }
}

export async function addIssueAttachments(
  channel: RoolChannel,
  objectId: string,
  newUrls: string[],
  issue?: Issue
): Promise<{ success: boolean; error?: string }> {
  if (issue && !canEditIssue(channel, issue)) {
    return { success: false, error: "You can only edit your own issues" };
  }
  if (newUrls.length === 0) return { success: true };
  try {
    const existing = (issue?.attachments ?? []) as string[];
    const combined = [...existing, ...newUrls];
    await channel.updateObject(objectId, { data: { attachments: combined } });
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to add attachments",
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

export async function addComment(
  channel: RoolChannel,
  issueId: string,
  content: string
): Promise<{ success: boolean; error?: string }> {
  let createdByName: string | undefined;
  try {
    const user = await getRoolClient().getCurrentUser();
    createdByName = user.name || user.slug || user.email?.split("@")[0] || undefined;
  } catch {
    const auth = getRoolClient().getAuthUser();
    createdByName = auth.name || auth.email?.split("@")[0] || undefined;
  }

  try {
    await channel.createObject({
      data: {
        type: "Comment",
        issueId,
        content,
        createdBy: channel.userId,
        createdByName,
        createdAt: Date.now(),
      },
    });
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to save comment",
    };
  }
}

export async function getComments(
  channel: RoolChannel,
  issueId: string
): Promise<Comment[]> {
  try {
    const { objects } = await channel.findObjects({
      where: {
        type: "Comment",
        issueId,
      },
      limit: 100,
    });

    return (objects ?? [])
      .map((obj) => {
        const raw = (obj.data as Record<string, unknown>) ?? obj;
        return {
          ...raw,
          id: (raw.id ?? obj.id) as string,
          type: "Comment",
        } as Comment;
      })
      .sort((a, b) => a.createdAt - b.createdAt);
  } catch {
    return [];
  }
}
