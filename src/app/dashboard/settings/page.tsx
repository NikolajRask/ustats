import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { roleLabel } from "@/lib/roles";
import { getCurrentProfile } from "@/lib/roles.server";
import { createClient } from "@/lib/supabase/server";

export default async function SettingsAccountPage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const email = user?.email ?? "—";

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="font-display text-3xl font-semibold tracking-tight">
          Account
        </h2>
        <p className="text-sm text-muted-foreground">
          Your sign-in details for this ustats instance.
        </p>
      </div>

      <Card className="bg-background/80">
        <CardHeader>
          <CardTitle>Personal details</CardTitle>
          <CardDescription>
            Your email used for your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={email}
              readOnly
              className="bg-muted/40"
            />
            <p className="text-xs text-muted-foreground">
              Your email address cannot be changed here.
            </p>
          </div>
          {profile ? (
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Input
                id="role"
                value={roleLabel(profile.role)}
                readOnly
                className="bg-muted/40"
              />
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
