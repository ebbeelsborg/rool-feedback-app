import { useState, useEffect } from "react";
import { Space, getComments, addComment, Comment } from "@/lib/rool";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2, MessageSquare } from "lucide-react";
import { toast } from "sonner";

interface CommentSectionProps {
  space: NonNullable<Space>;
  issueId: string;
  hideButton?: boolean;
  onPostRef?: React.MutableRefObject<(() => Promise<void>) | null>;
}

export function CommentSection({ space, issueId, hideButton, onPostRef }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function loadComments() {
    setIsLoading(true);
    try {
      const data = await getComments(space, issueId);
      setComments(data);
    } catch {
      toast.error("Failed to load comments");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadComments();
  }, [issueId, space]);

  async function handleSubmit() {
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await addComment(space, issueId, newComment.trim());
      if (res.success) {
        setNewComment("");
        await loadComments();
        toast.success("Comment added");
      } else {
        toast.error(res.error || "Failed to add comment");
      }
    } catch {
      toast.error("Failed to add comment");
    } finally {
      setIsSubmitting(false);
    }
  }

  useEffect(() => {
    if (onPostRef) {
      onPostRef.current = handleSubmit;
    }
  }, [onPostRef, handleSubmit]);

  function formatTimestamp(ts: number) {
    const date = new Date(ts);
    const day = date.getDate().toString().padStart(2, "0");
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    const hh = date.getHours().toString().padStart(2, "0");
    const mm = date.getMinutes().toString().padStart(2, "0");
    const ss = date.getSeconds().toString().padStart(2, "0");

    return `${day} ${month} ${year} ${hh}:${mm}:${ss}`;
  }

  return (
    <div className="mt-8 space-y-6 pt-6 border-t">
      <div className="flex items-center gap-2 text-muted-foreground">
        <MessageSquare className="w-4 h-4" />
        <h3 className="font-semibold text-sm">Discussion</h3>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : comments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4 italic">
            No comments yet. Start the discussion!
          </p>
        ) : (
          <div className="grid gap-4">
            {comments.map((comment) => (
              <div
                key={comment.id}
                className="p-4 rounded-xl bg-muted/30 border border-muted-foreground/10 space-y-2"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-sm font-semibold text-foreground">
                      {comment.createdByName?.replace(/^@+/, "") || "Unknown User"}
                    </span>
                    {comment.createdBy && (
                      <span className="text-[10px] text-muted-foreground/60 font-mono">
                        ({comment.createdBy})
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground/70 font-medium whitespace-nowrap">
                    {formatTimestamp(comment.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
                  {comment.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <Textarea
          placeholder="Add a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="min-h-[100px] resize-none bg-background/50 focus-visible:ring-primary/20"
        />
        {!hideButton && (
          <div className="flex justify-end">
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !newComment.trim()}
              size="sm"
              className="gap-1.5"
            >
              {isSubmitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              Post Comment
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
