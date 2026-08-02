import { signOut } from "@/app/actions";
import { PasswordChangeForm } from "@/components/dashboard/password-change-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function SettingsSecurityPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="font-display text-3xl font-semibold tracking-tight">
          Security
        </h2>
        <p className="text-sm text-muted-foreground">
          Manage your password and signed-in session.
        </p>
      </div>

      {params.error ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {params.error}
        </p>
      ) : null}
      {params.success ? (
        <p className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm text-foreground">
          {params.success}
        </p>
      ) : null}

      <PasswordChangeForm />

      <Card className="bg-background/80">
        <CardHeader>
          <CardTitle>Session</CardTitle>
          <CardDescription>
            Sign out of ustats on this device.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={signOut}>
            <Button type="submit" variant="destructive">
              Sign out
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
