import { RoolClient } from "@rool-dev/sdk";

export type FeedbackCategory = "bug" | "feature" | "general" | "improvement";

export interface FeedbackData {
  id?: string;
  type: "feedback";
  category?: FeedbackCategory; // AI-generated
  rating?: number; // legacy, optional
  message: string;
  email?: string;
  createdAt: number;
  summary?: string; // AI-generated
}

const SPACE_NAME = "Rool Feedback";

let client: RoolClient | null = null;

export function getRoolClient(): RoolClient {
  if (!client) {
    client = new RoolClient();
  }
  return client;
}

export async function ensureFeedbackSpace() {
  const rool = getRoolClient();
  const authenticated = await rool.initialize();

  if (!authenticated) {
    rool.login("Rool Feedback");
    return null;
  }

  const spaces = await rool.listSpaces();
  const existing = spaces.find((s: { name: string }) => s.name === SPACE_NAME);

  if (existing) {
    return rool.openSpace(existing.id);
  }

  return rool.createSpace(SPACE_NAME);
}

export async function submitFeedback(
  space: Awaited<ReturnType<typeof ensureFeedbackSpace>>,
  data: { message: string; email?: string }
): Promise<{ success: boolean; error?: string }> {
  if (!space) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    await space.createObject({
      data: {
        type: "feedback",
        message: data.message,
        ...(data.email && { email: data.email }),
        createdAt: Date.now(),
        category:
          "{{one of: bug, feature, improvement, general - which best describes this feedback?}}",
        summary: "{{one-sentence summary of this feedback}}",
      },
    });
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to submit feedback",
    };
  }
}

export async function getFeedback(
  space: Awaited<ReturnType<typeof ensureFeedbackSpace>>
): Promise<FeedbackData[]> {
  if (!space) return [];

  try {
    const { objects } = await space.findObjects({
      where: { type: "feedback" },
      limit: 100,
    });

    return objects
      .map((o) => o as unknown as FeedbackData)
      .filter((d) => d?.type === "feedback")
      .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
  } catch {
    return [];
  }
}
