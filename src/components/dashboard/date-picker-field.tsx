"use client";

import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export function DatePickerField({
  id,
  value,
  onChange,
  disabled,
  placeholder,
}: {
  id: string;
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
  disabled?: (date: Date) => boolean;
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            id={id}
            type="button"
            variant="outline"
            size="sm"
            className={cn(
              "w-full justify-start gap-2 font-normal sm:w-36",
              !value && "text-muted-foreground",
            )}
          />
        }
      >
        <CalendarIcon className="size-3.5 opacity-60" />
        <span className="truncate">
          {value ? format(value, "MMM d, yyyy") : placeholder}
        </span>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="single"
          selected={value}
          onSelect={(date) => {
            onChange(date);
            setOpen(false);
          }}
          disabled={disabled}
          defaultMonth={value}
        />
      </PopoverContent>
    </Popover>
  );
}
