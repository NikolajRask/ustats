import type { Metadata } from "next";

import { TopicPage, topicMetadata } from "@/components/seo/pages";
import { getTopic } from "@/lib/seo/content";

const SLUG = "self-hosted-analytics";

export const metadata: Metadata = topicMetadata(SLUG);

export default function Page() {
  const topic = getTopic(SLUG)!;
  return <TopicPage topic={topic} />;
}
