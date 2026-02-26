/**
 * Persists chat state to sessionStorage so it survives unmounts, navigation, and refreshes.
 * Cleared only when the user explicitly approves and saves an issue.
 */

const STORAGE_KEY = "rool-feedback-chat-state";

export interface StoredChatState {
  messages: { role: "user" | "assistant"; content: string }[];
  input: string;
  summary: {
    title: string;
    summary: string;
    category: string;
    status: string;
    isBug?: boolean;
  } | null;
}

export function loadChatState(): StoredChatState | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredChatState;
    if (!parsed || typeof parsed !== "object") return null;
    return {
      messages: Array.isArray(parsed.messages) ? parsed.messages : [],
      input: typeof parsed.input === "string" ? parsed.input : "",
      summary: parsed.summary && typeof parsed.summary === "object" ? parsed.summary : null,
    };
  } catch {
    return null;
  }
}

export function saveChatState(state: StoredChatState): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage errors (quota, private mode, etc.)
  }
}

export function clearChatState(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore
  }
}
