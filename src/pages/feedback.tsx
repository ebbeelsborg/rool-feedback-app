import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ensureFeedbackSpace,
  submitFeedback,
  getFeedback,
  type FeedbackCategory,
  type FeedbackData,
} from "@/lib/rool";
import { Loader2, Send, Star, MessageSquare } from "lucide-react";

const CATEGORIES: { value: FeedbackCategory; label: string }[] = [
  { value: "bug", label: "Bug Report" },
  { value: "feature", label: "Feature Request" },
  { value: "improvement", label: "Improvement" },
  { value: "general", label: "General Feedback" },
];

export function FeedbackPage() {
  const [space, setSpace] = useState<Awaited<ReturnType<typeof ensureFeedbackSpace>>>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedbackList, setFeedbackList] = useState<FeedbackData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [category, setCategory] = useState<FeedbackCategory>("general");
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!space || !message.trim()) return;

    setSubmitting(true);
    setError(null);
    setSuccess(false);

    const result = await submitFeedback(space, {
      category,
      rating: rating || 3,
      message: message.trim(),
      email: email.trim() || undefined,
    });

    setSubmitting(false);

    if (result.success) {
      setSuccess(true);
      setMessage("");
      setEmail("");
      setRating(0);
      setCategory("general");
    } else {
      setError(result.error ?? "Failed to submit");
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
            You'll be redirected to sign in with Rool. After signing in, you can submit feedback about the product.
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
            Help us improve Rool. Your feedback is processed by AI to generate a summary.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as FeedbackCategory)}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Rating (1–5)</Label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRating(n)}
                    className={`rounded-md p-2 transition-colors ${
                      rating >= n
                        ? "text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Star
                      className={`h-6 w-6 ${rating >= n ? "fill-current" : ""}`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message *</Label>
              <Textarea
                id="message"
                placeholder="Tell us what you think..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email (optional)</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            {success && (
              <p className="text-sm text-green-600 dark:text-green-400">
                Thank you! Your feedback has been submitted.
              </p>
            )}

            <Button type="submit" disabled={submitting || !message.trim()}>
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {submitting ? "Submitting..." : "Submit feedback"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {feedbackList.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent feedback</CardTitle>
            <CardDescription>
              Feedback you've submitted (stored in your Rool space)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {feedbackList.map((f, i) => (
                <li
                  key={i}
                  className="rounded-lg border border-border bg-muted/30 p-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium uppercase text-muted-foreground">
                      {f.category}
                    </span>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star
                          key={n}
                          className={`h-4 w-4 ${
                            (f.rating ?? 0) >= n ? "fill-current text-primary" : "text-muted-foreground"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="mt-2 text-sm">{f.message}</p>
                  {f.summary && (
                    <p className="mt-2 text-xs text-muted-foreground italic">
                      AI summary: {f.summary}
                    </p>
                  )}
                  {f.createdAt && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      {new Date(f.createdAt).toLocaleString()}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
