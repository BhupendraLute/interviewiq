"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils";

type ToastProps = {
  message: string;
  type?: "success" | "error" | "info";
  onDismiss: () => void;
};

export default function Toast({ message, type = "info", onDismiss }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 5000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const typeStyles = {
    success: "bg-green-100 text-green-800 border-green-400",
    error: "bg-red-100 text-red-800 border-red-400",
    info: "bg-blue-100 text-blue-800 border-blue-400",
  };

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 px-4 py-2 rounded-lg border-l-4",
        typeStyles[type]
      )}
    >
      <div className="flex items-center justify-between">
        <p>{message}</p>
        <button onClick={onDismiss} className="ml-4 text-xl font-bold">
          ×
        </button>
      </div>
    </div>
  );
}