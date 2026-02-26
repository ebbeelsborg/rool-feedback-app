import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  chatPrompt,
  requestSummary,
  createIssue,
  type Space,
  type Issue,
  type IssueStatus,
} from "@/lib/rool";
import { loadChatState, saveChatState, clearChatState } from "@/lib/chat-storage";
import { StatusTag, CategoryTag } from "@/components/issue-card";
import { ChatContent } from "@/components/chat-content";
import { Loader2, Send, FileCheck, Check, Bot, User } from "lucide-react";

export interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatProps {
  space: Space;
  issues: Issue[];
  onIssueSaved: () => void;
}

export function Chat({ space, issues, onIssueSaved }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>(() => {
    const stored = loadChatState();
    return stored?.messages ?? [];
  });
  const [input, setInput] = useState(() => {
    const stored = loadChatState();
    return stored?.input ?? "";
  });
  const [sending, setSending] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const [summary, setSummary] = useState<{ title: string; summary: string; category: string; status: IssueStatus } | null>(() => {
    const stored = loadChatState();
    return stored?.summary ?? null;
  });
  const [approving, setApproving] = useState(false);
  const [editingSummary, setEditingSummary] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, summary]);

  useEffect(() => {
    saveChatState({ messages, input, summary });
  }, [messages, input, summary]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending || summarizing) return;

    setInput("");
    setMessages((m) => [...m, { role: "user", content: text }]);
    setSending(true);

    try {
      const { message } = await chatPrompt(space!, text, issues, messages);
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
      setEditingSummary(false);
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
        setInput("");
        setSummary(null);
        clearChatState();
        onIssueSaved();
      }
    } finally {
      setApproving(false);
    }
  }

  function handleClear() {
    setMessages([]);
    setInput("");
    setSummary(null);
    setEditingSummary(false);
    clearChatState();
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto p-5">
        {messages.length === 0 && !summary && (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="rounded-2xl bg-primary/10 p-4">
              <Bot className="h-8 w-8 text-primary" />
            </div>
            <p className="mt-4 text-sm font-medium text-foreground">Describe your issue</p>
            <p className="mt-1.5 max-w-xs text-xs text-muted-foreground leading-relaxed">
              Chat about your issue, then click Summarize when ready to save it.
            </p>
          </div>
        )}

        <div className="space-y-3">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex items-start gap-2.5 ${m.role === "user" ? "flex-row-reverse" : ""}`}
            >
              <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                m.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}>
                {m.role === "user" ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
              </div>
              <div className={`chat-bubble ${
                m.role === "user" ? "chat-bubble-user" : "chat-bubble-assistant"
              }`}>
                <ChatContent content={m.content} />
              </div>
            </div>
          ))}

          {sending && (
            <div className="flex items-start gap-2.5">
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Bot className="h-3.5 w-3.5" />
              </div>
              <div className="chat-bubble chat-bubble-assistant flex items-center gap-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Thinking...
              </div>
            </div>
          )}

          {summary && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">Summary for approval</p>
              {editingSummary ? (
                <>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">Title</label>
                    <Input
                      value={summary.title}
                      onChange={(e) => setSummary((s) => s && { ...s, title: e.target.value.slice(0, 50) })}
                      className="rounded-lg"
                      maxLength={50}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">Summary</label>
                    <Textarea
                      value={summary.summary}
                      onChange={(e) => setSummary((s) => s && { ...s, summary: e.target.value })}
                      className="min-h-[80px] rounded-lg resize-none"
                      rows={3}
                    />
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground block">Category</label>
                      <Input
                        value={summary.category}
                        onChange={(e) => setSummary((s) => s && { ...s, category: e.target.value.trim().split(/\s+/)[0] || "General" })}
                        className="rounded-lg w-32"
                        placeholder="General"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground block">Status</label>
                      <select
                        value={summary.status}
                        onChange={(e) => setSummary((s) => s && { ...s, status: e.target.value as IssueStatus })}
                        className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
                      >
                        <option value="Open">Open</option>
                        <option value="Solved">Solved</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" onClick={handleApprove} disabled={approving}>
                      {approving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      Approve & Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingSummary(false)}>
                      Done
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-base font-semibold text-foreground">{summary.title}</p>
                  <div className="flex flex-wrap gap-1.5">
                    <StatusTag status={summary.status} />
                    <CategoryTag category={summary.category} />
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">{summary.summary}</p>
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" onClick={handleApprove} disabled={approving}>
                      {approving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      Approve & Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingSummary(true)}>
                      Edit
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <div ref={scrollRef} />
      </div>

      <div className="shrink-0 border-t border-border bg-card/50 p-4">
        <form ref={formRef} onSubmit={handleSend} className="flex flex-col gap-3">
          <Textarea
            placeholder="Describe your issue..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (input.trim() && !sending && !summarizing) {
                  formRef.current?.requestSubmit();
                }
              }
            }}
            rows={3}
            className="min-h-[80px] resize-none rounded-xl border-2 border-orange-500 bg-background focus-visible:border-orange-500 focus-visible:ring-orange-500/20"
            disabled={sending || summarizing}
          />
          <div className="flex gap-2">
            <Button type="submit" disabled={!input.trim() || sending || summarizing} className="rounded-xl">
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Send
            </Button>
            <Button
              variant="outline"
              onClick={handleSummarize}
              disabled={messages.length === 0 || sending || summarizing}
              className="rounded-xl"
            >
              {summarizing ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileCheck className="h-4 w-4" />}
              Summarize
            </Button>
            <Button
              variant="ghost"
              onClick={handleClear}
              disabled={messages.length === 0 && !summary && !input.trim()}
              className="rounded-xl text-muted-foreground hover:text-foreground"
            >
              Clear
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
