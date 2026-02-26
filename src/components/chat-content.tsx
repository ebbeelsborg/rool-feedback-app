/**
 * Renders chat message content with markdown links [text](url) as clickable links.
 */

const LINK_RE = /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g;

function isSafeUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export function ChatContent({ content }: { content: string }) {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  const re = new RegExp(LINK_RE.source, "g");
  while ((match = re.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push(
        <span key={key++}>{content.slice(lastIndex, match.index)}</span>
      );
    }
    const [, text, url] = match;
    if (text && url && isSafeUrl(url)) {
      parts.push(
        <a
          key={key++}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline underline-offset-2 hover:text-primary/80"
        >
          {text}
        </a>
      );
    } else {
      parts.push(<span key={key++}>{match[0]}</span>);
    }
    lastIndex = re.lastIndex;
  }

  if (lastIndex < content.length) {
    parts.push(<span key={key++}>{content.slice(lastIndex)}</span>);
  }

  return (
    <div className="whitespace-pre-wrap">
      {parts.length > 0 ? parts : content}
    </div>
  );
}
