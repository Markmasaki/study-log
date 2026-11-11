import { createClient } from "@supabase/supabase-js";

// 公開してよい値のみ（データは RLS で本人に限定）。
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://localhost",
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "missing",
);

export type StudySession = {
  id: string;
  studied_on: string;
  minutes: number;
  category: "qassist" | "qb" | "other";
  subject: string | null;
  note: string | null;
};

export type Lecture = {
  id: string;
  subject: string;
  title: string;
  sort: number;
  watched_on: string | null;
};

export type QbRow = {
  id: string;
  subject: string;
  total: number;
  answered: number;
  correct: number;
  round: number;
  source: "manual" | "import";
  updated_at: string;
};

export const CATEGORY_LABEL = { qassist: "Q-Assist", qb: "QB", other: "その他" } as const;

/** 端末のローカル日付を YYYY-MM-DD で返す */
export function today(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function fmtMinutes(m: number): string {
  const h = Math.floor(m / 60);
  return h ? `${h}時間${m % 60}分` : `${m}分`;
}

export function pct(part: number, whole: number): number {
  return whole > 0 ? Math.round((part / whole) * 100) : 0;
}
