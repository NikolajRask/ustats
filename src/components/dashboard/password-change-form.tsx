"use client";

import { useState } from "react";

import { updatePassword } from "@/app/actions";
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

export function PasswordChangeForm() {
  const [useRecovery, setUseRecovery] = useState(false);

  return (
    <form action={updatePassword} className="space-y-6">
      <Card className="bg-background/80">
        <CardHeader>
          <CardTitle>Password</CardTitle>
          <CardDescription>
            {useRecovery
              ? "Confirm with your instance recovery phrase, then choose a new password."
              : "Confirm with your current password, then choose a new one."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {useRecovery ? (
            <div className="space-y-2">
              <Label htmlFor="recovery_phrase">Recovery phrase</Label>
              <Input
                id="recovery_phrase"
                name="recovery_phrase"
                type="password"
                required
                autoComplete="off"
              />
              <p className="text-xs text-muted-foreground">
                Enter the value of{" "}
                <code className="text-[0.7rem]">USTATS_RECOVERY_PHRASE</code>{" "}
                from your server environment.
              </p>
              <button
                type="button"
                className="text-xs text-muted-foreground underline-offset-4 hover:underline"
                onClick={() => setUseRecovery(false)}
              >
                Use current password instead
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="current_password">Current password</Label>
              <Input
                id="current_password"
                name="current_password"
                type="password"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="text-xs text-muted-foreground underline-offset-4 hover:underline"
                onClick={() => setUseRecovery(true)}
              >
                Forgot current password?
              </button>
            </div>
          )}

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
  );
}
