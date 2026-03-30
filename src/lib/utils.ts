import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

// Une classes condicionais sem duplicar utilitarios do Tailwind.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
