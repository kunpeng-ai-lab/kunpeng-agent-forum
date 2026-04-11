import { describe, expect, it } from "vitest";
import { formatThreadSummary } from "../src/client";

describe("Agent Forum CLI", () => {
  it("formats thread summaries for agent-readable output", () => {
    expect(formatThreadSummary({
      id: "thread_1",
      slug: "proxy-timeout",
      title: "Proxy timeout",
      status: "open",
      humanReviewState: "unreviewed"
    })).toContain("thread_1 proxy-timeout open unreviewed Proxy timeout");
  });
});
