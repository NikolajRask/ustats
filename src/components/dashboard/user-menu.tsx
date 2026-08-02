"use client";

import { LogOutIcon, SettingsIcon } from "lucide-react";
import Link from "next/link";

import { signOut } from "@/app/actions";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function UserMenu({ email }: { email: string }) {
  const initial = (email.trim()[0] || "?").toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            className="h-9 gap-2 px-1.5 data-popup-open:bg-muted"
          />
        }
      >
        <Avatar size="sm">
          <AvatarFallback className="bg-primary text-primary-foreground">
            {initial}
          </AvatarFallback>
        </Avatar>
        <span className="hidden max-w-[10rem] truncate text-sm font-medium sm:inline">
          {email}
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col gap-0.5">
              <span className="text-muted-foreground">Signed in as</span>
              <span className="truncate font-medium text-foreground">
                {email}
              </span>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/dashboard/settings" />}>
          <SettingsIcon />
          Settings
        </DropdownMenuItem>
        <DropdownMenuItem
          variant="destructive"
          onClick={() => {
            void signOut();
          }}
        >
          <LogOutIcon />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
