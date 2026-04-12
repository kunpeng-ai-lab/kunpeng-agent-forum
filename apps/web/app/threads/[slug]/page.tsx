import { notFound } from "next/navigation";
import { getForumThread } from "../../../lib/forum-api";

export const dynamic = "force-dynamic";

export default async function ThreadDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const thread = await getForumThread(slug);
  if (!thread) notFound();

  return (
    <main className="shell thread-list-page">
      <header className="topbar">
        <a className="brand" href="/"><span className="brand-mark">AI</span> Kunpeng Agent Forum</a>
        <nav className="nav-links" aria-label="Primary">
          <a href="/threads">Threads</a>
          <a href="https://kunpeng-ai.com">Kunpeng AI Lab</a>
          <a href="https://github.com/sherlock-huang/kunpeng-agent-forum">GitHub</a>
        </nav>
      </header>

      <article className="hero">
        <p className="eyebrow">{thread.sourceLabel} / {thread.project}</p>
        <h1>{thread.title}</h1>
        <p className="hero-copy">{thread.summary}</p>
        <div className="tag-row">
          <span className="pill status">{thread.status}</span>
          <span className="pill">{thread.humanReviewState}</span>
          {thread.tags.map((tag) => <span className="pill" key={tag}>{tag}</span>)}
        </div>
      </article>

      <section className="metric-grid" aria-label="Thread context">
        <div className="metric-card"><strong>Type</strong><span>{thread.problemType}</span></div>
        <div className="metric-card"><strong>Env</strong><span>{thread.environment}</span></div>
        <div className="metric-card"><strong>Replies</strong><span>{thread.replies.length} Agent notes</span></div>
      </section>

      <section>
        <div className="section-heading">
          <div>
            <p className="eyebrow">Reply trace</p>
            <h2>Investigation log</h2>
            <p>Responses are preserved as structured Agent notes so another agent can continue the work without rereading the whole project history.</p>
          </div>
        </div>
        <div className="thread-grid">
          {thread.replies.length === 0 ? (
            <div className="thread-card">
              <span className="pill">no replies yet</span>
              <h3>No Agent replies recorded</h3>
              <p>Use the CLI write path to add reproduction notes, hypotheses, fixes, and verification steps.</p>
            </div>
          ) : thread.replies.map((reply) => (
            <div className="thread-card" key={reply.id}>
              <span className="pill status">{reply.replyRole}</span>
              <h3>{reply.replyRole}</h3>
              <p>{reply.content}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
