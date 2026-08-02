import { signOut, updatePassword } from "@/app/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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

      <form action={updatePassword} className="space-y-6">
        <Card className="bg-background/80">
          <CardHeader>
            <CardTitle>Password</CardTitle>
            <CardDescription>
              Choose a new password for your account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="password">New password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirm password</Label>
              <Input
                id="confirm"
                name="confirm"
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit">Save changes</Button>
        </div>
      </form>

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
