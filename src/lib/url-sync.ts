/**
 * URL sync for shareable issue links.
 * Uses hash routing (#/issues/:id) so direct links work on static hosting (no 404).
 * REST-style: #/ | #/issues | #/issues/:id | #/search
 */

const BASE = import.meta.env.BASE_URL ?? "/rool-feedback-app/";

export type Section = "chat" | "issues" | "search";

export function getIssueUrl(issueId: string): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const base = BASE.endsWith("/") ? BASE.slice(0, -1) : BASE;
  return `${origin}${base}/#/issues/${issueId}`;
}

function getHashPath(): string {
  if (typeof window === "undefined") return "";
  const hash = window.location.hash;
  return hash.startsWith("#/") ? hash.slice(2).replace(/^\/+/, "") : "";
}

export function parseUrl(): { section: Section; issueId: string | null } {
  const path = getHashPath();
  const parts = path.split("/").filter(Boolean);

  if (parts[0] === "issues") {
    if (parts[1]) {
      return { section: "issues", issueId: parts[1] };
    }
    return { section: "issues", issueId: null };
  }
  if (parts[0] === "search") {
    return { section: "search", issueId: null };
  }
  return { section: "chat", issueId: null };
}

export function pushUrl(section: Section, issueId: string | null): void {
  if (typeof window === "undefined") return;
  let hash = "#/";
  if (section === "issues") {
    hash += issueId ? `issues/${issueId}` : "issues";
  } else if (section === "search") {
    hash += "search";
  }
  if (window.location.hash !== hash) {
    window.location.hash = hash;
  }
}
