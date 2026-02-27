import { useState, useEffect } from "react";
import { type Space } from "@/lib/rool";
import { Loader2, FileWarning } from "lucide-react";

interface AttachmentImageProps {
  space: Space;
  url: string;
  className?: string;
}

export function AttachmentImage({ space, url, className }: AttachmentImageProps) {
  const [src, setSrc] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let revoked = false;
    let objectUrl: string | null = null;

    if (!space) {
      setLoading(false);
      setError(true);
      return;
    }

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
      .catch(() => setError(true))
      .finally(() => setLoading(false));

    return () => {
      revoked = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [space, url]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center bg-muted/30 ${className}`}>
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !src) {
    return (
      <div className={`flex items-center justify-center bg-muted/30 text-muted-foreground ${className}`}>
        <FileWarning className="h-5 w-5" />
      </div>
    );
  }

  return <img src={src} alt="Attachment" className={className} />;
}
