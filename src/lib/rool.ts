import { RoolClient } from "@rool-dev/sdk";

export interface Issue {
  id?: string;
  type: "issue";
  title: string;
  content: string;
  category?: string;
  createdAt: number;
  dateKey: string;
}

const SPACE_NAME = "Rool Issues";

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
    rool.login("Rool Issues");
    return null;
  }

  if (SHARED_SPACE_ID?.trim()) {
    return rool.openSpace(SHARED_SPACE_ID.trim());
  }

  const spaces = await rool.listSpaces();
  const existing = spaces.find((s: { name: string }) => s.name === SPACE_NAME);

  if (existing) {
    return rool.openSpace(existing.id);
  }

  return rool.createSpace(SPACE_NAME);
}

export type Space = Awaited<ReturnType<typeof ensureSpace>>;

export async function chatPrompt(
  space: NonNullable<Space>,
  userMessage: string
): Promise<{ message: string }> {
  const { message } = await space.prompt(userMessage);
  return { message };
}

export async function requestSummary(space: NonNullable<Space>): Promise<{
  title: string;
  summary: string;
  category: string;
}> {
  const { message } = await space.prompt(
    "Based on our conversation, provide a short title (3-6 words), a 2-3 sentence summary, and a category (1-3 words, e.g. Bug, Feature, UX). Reply in this exact JSON format only, no other text: {\"title\": \"...\", \"summary\": \"...\", \"category\": \"...\"}"
  );
  const raw = message.trim();
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]) as { title?: string; summary?: string; category?: string };
      return {
        title: parsed.title ?? "Untitled",
        summary: parsed.summary ?? "",
        category: parsed.category ?? "General",
      };
    } catch {
      /* fall through */
    }
  }
  return { title: "Untitled", summary: raw, category: "General" };
}

export async function createIssue(
  space: NonNullable<Space>,
  data: { title: string; content: string; category: string }
): Promise<{ success: boolean; error?: string }> {
  const now = Date.now();
  const dateKey = new Date(now).toISOString().slice(0, 10);

  try {
    await space.createObject({
      data: {
        type: "issue",
        title: data.title,
        content: data.content,
        category: data.category,
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

export async function getIssues(space: NonNullable<Space>): Promise<Issue[]> {
  try {
    const { objects } = await space.findObjects({
      where: { type: "issue" },
      limit: 200,
    });

    return (objects as unknown as Issue[])
      .filter((d) => d?.type === "issue")
      .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
  } catch {
    return [];
  }
}

export async function searchIssues(
  space: NonNullable<Space>,
  query: string
): Promise<Issue[]> {
  if (!query.trim()) return getIssues(space);

  try {
    const { objects } = await space.findObjects({
      where: { type: "issue" },
      prompt: query.trim(),
      limit: 50,
    });

    return (objects as unknown as Issue[])
      .filter((d) => d?.type === "issue")
      .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
  } catch {
    return getIssues(space);
  }
}
