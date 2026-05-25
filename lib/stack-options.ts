export type StackCategory =
  | "builder"
  | "frontend"
  | "backend"
  | "database"
  | "authentication"
  | "apis";

export const STACK_OPTIONS = {
  builder: ["Lovable", "Bolt", "Replit", "Cursor", "Claude Code"],
  frontend: ["React", "Next.js", "Vue", "Typescript", "Tailwind"],
  backend: ["Convex", "Supabase", "Firebase"],
  database: ["Convex", "Supabase", "Firebase"],
  authentication: ["Supabase", "Convex", "Clerk", "Better Auth", "WorkOS"],
  apis: ["OpenAI", "Claude", "Google Gemini"],
} as const satisfies Record<StackCategory, ReadonlyArray<string>>;

export const STACK_CATEGORY_LABELS: Record<StackCategory, string> = {
  builder: "Builder",
  frontend: "Frontend",
  backend: "Backend",
  database: "Database",
  authentication: "Authentication",
  apis: "APIs",
};

/** Builder is single-select; everything else is multi-select. */
export const STACK_MULTI_SELECT: Record<StackCategory, boolean> = {
  builder: false,
  frontend: true,
  backend: true,
  database: true,
  authentication: true,
  apis: true,
};

export type StackSelection = {
  builder?: string;
  frontend: string[];
  backend: string[];
  database: string[];
  authentication: string[];
  apis: string[];
};

export const emptyStack: StackSelection = {
  builder: undefined,
  frontend: [],
  backend: [],
  database: [],
  authentication: [],
  apis: [],
};

export const APP_TYPES = [
  { value: "web", label: "Web app", description: "Browser-based product" },
  { value: "mobile", label: "Mobile app", description: "iOS or Android" },
  { value: "desktop", label: "Desktop app", description: "macOS, Windows, Linux" },
] as const;

export type AppType = (typeof APP_TYPES)[number]["value"];
