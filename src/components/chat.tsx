import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  chatPrompt,
  requestSummary,
  createIssue,
  type Space,
  type IssueStatus,
} from "@/lib/rool";
import { StatusTag, CategoryTag } from "@/components/issue-card";
import { Loader2, Send, FileCheck, Check } from "lucide-react";

export interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatProps {
  space: Space;
  onIssueSaved: () => void;
}

export function Chat({ space, onIssueSaved }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const [summary, setSummary] = useState<{ title: string; summary: string; category: string; status: IssueStatus } | null>(null);
  const [approving, setApproving] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, summary]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending || summarizing) return;

    setInput("");
    setMessages((m) => [...m, { role: "user", content: text }]);
    setSending(true);

    try {
      const { message } = await chatPrompt(space!, text);
      setMessages((m) => [...m, { role: "assistant", content: message }]);
    } catch (err) {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: `Error: ${err instanceof Error ? err.message : "Failed to get response"}` },
      ]);
    } finally {
      setSending(false);
    }
  }

  async function handleSummarize() {
    if (!space || messages.length === 0 || summarizing) return;

    setSummarizing(true);
    setSummary(null);

    try {
      const result = await requestSummary(space);
      setSummary(result);
    } catch (err) {
      setSummary({
        title: "Untitled",
        summary: err instanceof Error ? err.message : "Failed to generate summary",
        category: "General",
        status: "Open",
      });
    } finally {
      setSummarizing(false);
    }
  }

  async function handleApprove() {
    if (!space || !summary) return;

    const content = messages
      .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
      .join("\n\n");

    setApproving(true);
    try {
      const result = await createIssue(space, {
        title: summary.title,
        content: content + `\n\n---\nSummary: ${summary.summary}`,
        category: summary.category,
        status: summary.status,
      });
      if (result.success) {
        setMessages([]);
        setSummary(null);
        onIssueSaved();
      }
    } finally {
      setApproving(false);
    }
  }

  return (
    <div className="flex h-full flex-col bg-[hsl(var(--pastel-mint))] dark:bg-[hsl(var(--pastel-mint))]/20">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && !summary && (
          <p className="text-sm text-muted-foreground">
            Chat about your issue, then summarize and save.
          </p>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            className={`text-sm ${
              m.role === "user"
                ? "text-orange-600 dark:text-orange-400"
                : "text-gray-700 dark:text-gray-300"
            }`}
          >
            <div className="whitespace-pre-wrap">{m.content}</div>
          </div>
        ))}

        {sending && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Thinking...
          </div>
        )}

        {summary && (
          <div className="rounded-lg border border-border bg-[hsl(var(--pastel-lavender))] p-4 space-y-3 dark:bg-[hsl(var(--pastel-lavender))]/40">
            <p className="text-sm font-medium">Summary for approval</p>
            <p className="text-sm font-medium text-foreground">{summary.title}</p>
            <div className="flex flex-wrap gap-1.5">
              <StatusTag status={summary.status} />
              <CategoryTag category={summary.category} />
            </div>
            <p className="text-sm text-muted-foreground">{summary.summary}</p>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleApprove}
                disabled={approving}
              >
                {approving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Approve & Save
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSummary(null)}
              >
                Edit more
              </Button>
            </div>
          </div>
        )}

        <div ref={scrollRef} />
      </div>

      <div className="border-t border-border p-4">
        <div className="flex gap-2">
          <form onSubmit={handleSend} className="flex-1 flex gap-2">
            <Textarea
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e);
                }
              }}
              rows={2}
              className="min-h-[60px] resize-none border-2 border-orange-500 focus-visible:border-orange-500 focus-visible:ring-orange-500"
              disabled={sending || summarizing}
            />
            <Button type="submit" disabled={!input.trim() || sending || summarizing}>
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
          <Button
            variant="outline"
            onClick={handleSummarize}
            disabled={messages.length === 0 || sending || summarizing}
          >
            {summarizing ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileCheck className="h-4 w-4" />}
            Summarize
          </Button>
        </div>
      </div>
    </div>
  );
}
