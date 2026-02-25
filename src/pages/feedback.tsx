import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ensureFeedbackSpace,
  submitFeedback,
  getFeedback,
  type FeedbackData,
} from "@/lib/rool";
import { ChatInput } from "@/components/chat-input";
import { FeedbackArchive } from "@/components/feedback-archive";
import { Loader2, MessageSquare, Inbox } from "lucide-react";

export function FeedbackPage() {
  const [space, setSpace] = useState<Awaited<ReturnType<typeof ensureFeedbackSpace>>>(null);
  const [loading, setLoading] = useState(true);
  const [feedbackList, setFeedbackList] = useState<FeedbackData[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const s = await ensureFeedbackSpace();
      if (cancelled) return;

      if (s) {
        setSpace(s);
        const list = await getFeedback(s);
        if (!cancelled) setFeedbackList(list);

        s.on("objectCreated", async () => {
          const list = await getFeedback(s);
          setFeedbackList(list);
        });
        s.on("objectUpdated", async () => {
          const list = await getFeedback(s);
          setFeedbackList(list);
        });
      }
      setLoading(false);
    }

    init();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(message: string, email?: string) {
    if (!space) return;
    setError(null);
    const result = await submitFeedback(space, { message, email });
    if (!result.success) {
      setError(result.error ?? "Failed to submit");
      throw new Error(result.error);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!space) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sign in required</CardTitle>
          <CardDescription>
            You'll be redirected to sign in with Rool. After signing in, you can
            share feedback.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Share your feedback
          </CardTitle>
          <CardDescription>
            What's on your mind? Your feedback is categorized and summarized by
            AI.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <p className="mb-4 text-sm text-destructive">{error}</p>
          )}
          <ChatInput onSubmit={handleSubmit} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Inbox className="h-5 w-5" />
            Feedback archive
          </CardTitle>
          <CardDescription>
            Browse and search your submitted feedback by category.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FeedbackArchive feedbackList={feedbackList} />
        </CardContent>
      </Card>
    </div>
  );
}
