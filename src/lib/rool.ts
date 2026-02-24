import { RoolClient } from "@rool-dev/sdk";

export type FeedbackCategory = "bug" | "feature" | "general" | "improvement";

export interface FeedbackData {
  type: "feedback";
  category: FeedbackCategory;
  rating: number;
  message: string;
  email?: string;
  createdAt: number;
  summary?: string; // AI-generated summary
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
  data: Omit<FeedbackData, "type" | "createdAt" | "summary">
): Promise<{ success: boolean; error?: string }> {
  if (!space) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    await space.createObject({
      data: {
        type: "feedback",
        category: data.category,
        rating: data.rating,
        message: data.message,
        ...(data.email && { email: data.email }),
        createdAt: Date.now(),
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
