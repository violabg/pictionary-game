import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getInitials = (name?: string | null) => {
  return (
    name
      ?.split(" ")
      ?.map((word) => word[0])
      ?.join("")
      ?.toUpperCase() || "U"
  );
};

export const LLM_MODEL = "moonshotai/kimi-k2-instruct-0905";

export const categories = [
  { label: "Animali", value: "Animali" },
  { label: "Cibo", value: "Cibo" },
  { label: "Film", value: "Film" },
  { label: "Sport", value: "Sport" },
  { label: "Tecnologia", value: "Tecnologia" },
  { label: "Geografia", value: "Geografia" },
  { label: "Musica", value: "Musica" },
  { label: "Arte", value: "Arte" },
];
