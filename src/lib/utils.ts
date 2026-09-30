import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** shadcn's class combiner — Vengeance UI components import this. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
