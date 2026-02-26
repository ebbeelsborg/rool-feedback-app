import { useState, useEffect } from "react";
import type { Space } from "@/lib/rool";

interface AttachmentImageProps {
  space: Space;
  url: string;
  className?: string;
}

export function AttachmentImage({ space, url, className }: AttachmentImageProps) {
  const [src, setSrc] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let revoked = false;
    let objectUrl: string | null = null;
    space
      .fetchMedia(url)
      .then((res) => {
        if (revoked) return null;
        if (res.contentType.startsWith("image/")) return res.blob();
        setError(true);
        return null;
      })
      .then((blob) => {
        if (revoked || !blob) return;
        objectUrl = URL.createObjectURL(blob);
        setSrc(objectUrl);
      })
      .catch(() => setError(true));

    return () => {
      revoked = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [space, url]);

  if (error) return <span className="text-xs text-muted-foreground">[attachment]</span>;
  if (!src) return <div className={`animate-pulse bg-muted ${className ?? "h-24 w-24 rounded-lg"}`} />;
  return <img src={src} alt="Attachment" className={className ?? "max-h-48 rounded-lg border border-border object-contain"} />;
}
