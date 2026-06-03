export function stripHtml(value: string): string {
  return value
    .replace(/<[^>]*>/g, "")
    .replace(/&lt;[^>]*&gt;/g, "")
    .trim()
}
