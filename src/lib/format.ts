export function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
