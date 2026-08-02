import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { signInWithPassword, signUpWithPassword } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your ustats instance.",
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  const params = await searchParams;

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-12">
      <Button
        nativeButton={false}
        variant="ghost"
        className="-ml-2 w-fit font-display text-base font-semibold tracking-tight"
        render={<Link href="/" />}
      >
        ustats
      </Button>
      <h1 className="mt-8 font-display text-3xl font-semibold tracking-tight">
        Sign in to your instance
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Uses Supabase Auth on your project. Create an account if this is a fresh
        install.
      </p>

      {params.error ? (
        <p className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {params.error}
        </p>
      ) : null}

      <form className="mt-8 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
          />
        </div>
        <Button type="submit" className="w-full" formAction={signInWithPassword}>
          Log in
        </Button>
        <Button
          type="submit"
          variant="outline"
          className="w-full"
          formAction={signUpWithPassword}
        >
          Create account
        </Button>
      </form>
    </div>
  );
}
