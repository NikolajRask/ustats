import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: "Test",
  robots: { index: false, follow: false },
};

export default async function TestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Dev-only playground — never expose site keys via service role in production.
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "http://localhost:3000";

  let publicKey: string | null = null;
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("sites")
      .select("public_key")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    publicKey = data?.public_key ?? null;
  } catch {
    publicKey = null;
  }

  return (
    <>
      {publicKey ? (
        <script defer data-key={publicKey} src={`${appUrl}/script.js`} />
      ) : null}
      {children}
    </>
  );
}
