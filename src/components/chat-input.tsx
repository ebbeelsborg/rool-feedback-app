import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send } from "lucide-react";

interface ChatInputProps {
  onSubmit: (message: string, email?: string) => Promise<void>;
  disabled?: boolean;
}

export function ChatInput({ onSubmit, disabled }: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [showEmail, setShowEmail] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = message.trim();
    if (!trimmed || submitting) return;

    setSubmitting(true);
    try {
      await onSubmit(trimmed, email.trim() || undefined);
      setMessage("");
      setEmail("");
      setShowEmail(false);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="relative">
        <Textarea
          placeholder="What's on your mind? Share your feedback..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          className="min-h-[80px] resize-none pr-12"
          disabled={disabled}
        />
        <Button
          type="submit"
          size="icon"
          disabled={!message.trim() || submitting || disabled}
          className="absolute bottom-2 right-2 h-8 w-8"
        >
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
      {showEmail ? (
        <div className="flex gap-2">
          <Input
            type="email"
            placeholder="Email (optional)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1"
            disabled={disabled}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setShowEmail(false);
              setEmail("");
            }}
          >
            Hide
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowEmail(true)}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          + Add email for follow-up
        </button>
      )}
    </form>
  );
}
