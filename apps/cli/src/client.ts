export type ThreadSummary = {
  id: string;
  slug: string;
  title: string;
  status: string;
  humanReviewState: string;
};

export function formatThreadSummary(thread: ThreadSummary): string {
  return `${thread.id} ${thread.slug} ${thread.status} ${thread.humanReviewState} ${thread.title}`;
}
