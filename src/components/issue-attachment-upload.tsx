import { useState } from "react";
import { addIssueAttachments, type Issue, type Space } from "@/lib/rool";
import { Paperclip, Loader2 } from "lucide-react";

interface IssueAttachmentUploadProps {
  issue: Issue;
  space: Space;
  onAdded: () => void;
}

export function IssueAttachmentUpload({ issue, space, onAdded }: IssueAttachmentUploadProps) {
  const [uploading, setUploading] = useState(false);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files?.length || !issue.id || !space) return;
    setUploading(true);
    try {
      const urls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith("image/")) continue;
        const url = await space.uploadMedia(file);
        urls.push(url);
      }
      if (urls.length > 0) {
        const result = await addIssueAttachments(space, issue.id, urls, issue);
        if (result.success) onAdded();
      }
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-sm text-muted-foreground hover:bg-muted/50">
      <input
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        disabled={uploading}
        className="hidden"
      />
      {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
      {uploading ? "Uploading..." : "Add screenshot"}
    </label>
  );
}
