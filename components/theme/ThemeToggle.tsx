"use client";

import { useTheme } from "./ThemeProvider";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { MoonIcon, SunIcon } from "lucide-react";
import { useSyncExternalStore } from "react";

function getSnapshot() {
  return typeof document === "undefined" ? false : document.documentElement.classList.contains("dark");
}

function subscribe(callback: () => void) {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
}

export function ThemeToggle() {
  const isDark = useSyncExternalStore(subscribe, getSnapshot, () => false);
  const { toggleTheme } = useTheme();

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            className={cn(
              "flex size-8 items-center justify-center rounded-lg transition-colors",
              "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          />
        }
      >
        {isDark ? <SunIcon className="size-4" /> : <MoonIcon className="size-4" />}
      </TooltipTrigger>
      <TooltipContent>
        {isDark ? "Light mode" : "Dark mode"}
      </TooltipContent>
    </Tooltip>
  );
}
