import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  ComparisonPage,
  comparisonMetadata,
} from "@/components/seo/pages";
import { SEO_COMPARISONS, getComparison } from "@/lib/seo/content";

type Props = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return SEO_COMPARISONS.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return comparisonMetadata(slug);
}

export default async function CompareSlugPage({ params }: Props) {
  const { slug } = await params;
  const item = getComparison(slug);
  if (!item) notFound();
  return <ComparisonPage item={item} />;
}
