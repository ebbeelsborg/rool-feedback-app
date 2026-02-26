/**
 * Parses issue content to extract summary (after "---\nSummary: ") and the rest.
 */

export function parseIssueContent(content: string | undefined): {
  summary: string | null;
  body: string;
} {
  if (!content) return { summary: null, body: "" };
  const sep = "\n---\nSummary: ";
  const i = content.indexOf(sep);
  if (i >= 0) {
    const summary = content.slice(i + sep.length).trim();
    const body = content.slice(0, i).trim();
    return { summary: summary || null, body };
  }
  return { summary: null, body: content };
}
