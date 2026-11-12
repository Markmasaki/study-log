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

export type Chapter = {
  id: string;
  course: string;
  chapter: string;
  videos: number;
  seconds: number;
  is_old: boolean;
  is_optional: boolean;
  sort: number;
  watched: number;
};

/** 視聴済み本数から、時間で重みを付けた視聴済み秒数を概算する */
export function watchedSeconds(c: Chapter): number {
  return c.videos > 0 ? Math.round((c.watched / c.videos) * c.seconds) : 0;
}

export function fmtHours(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.round((sec % 3600) / 60);
  return `${h}時間${String(m).padStart(2, "0")}分`;
}

export type QbRow = {
  id: string;
  subject: string;
  total: number;
  answered: number;
  correct: number | null;
  round: number;
  source: "manual" | "import";
  updated_at: string;
};

export type AnkiDaily = {
  id: string;
  day: string;
  reviews: number;
  correct: number | null;
  new_cards: number | null;
  minutes: number | null;
};

export type AnkiDeck = {
  id: string;
  deck: string;
  due_new: number;
  due_learn: number;
  due_review: number;
  total: number | null;
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
