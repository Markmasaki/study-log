"use client";

import { useEffect, useState } from "react";
import { supabase, today, fmtMinutes, fmtHours, watchedSeconds, pct, type StudySession, type Chapter, type QbRow, type AnkiDaily } from "@/lib/supabase";

export default function Home() {
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [qb, setQb] = useState<QbRow[]>([]);
  const [anki, setAnki] = useState<AnkiDaily[]>([]);

  useEffect(() => {
    supabase.from("sl_study_sessions").select("*").gte("studied_on", today(-6)).then(({ data }) => setSessions(data ?? []));
    supabase.from("sl_qassist_chapters").select("*").then(({ data }) => setChapters(data ?? []));
    supabase.from("sl_qb_progress").select("*").then(({ data }) => setQb(data ?? []));
    supabase.from("sl_anki_daily").select("*").eq("day", today()).then(({ data }) => setAnki(data ?? []));
  }, []);

  const days = Array.from({ length: 7 }, (_, i) => today(i - 6));
  const perDay = days.map((d) => sessions.filter((s) => s.studied_on === d).reduce((a, s) => a + s.minutes, 0));
  const max = Math.max(60, ...perDay);
  const week = perDay.reduce((a, b) => a + b, 0);
  const target = chapters.filter((c) => !c.is_old && !c.is_optional);
  const qaTotal = target.reduce((a, c) => a + c.seconds, 0);
  const qaDone = target.reduce((a, c) => a + watchedSeconds(c), 0);
  const answered = qb.reduce((a, r) => a + r.answered, 0);
  const total = qb.reduce((a, r) => a + r.total, 0);
  const graded = qb.filter((r) => r.correct != null);
  const correct = graded.reduce((a, r) => a + (r.correct ?? 0), 0);
  const gradedAnswered = graded.reduce((a, r) => a + r.answered, 0);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">ホーム</h1>

      <section className="card">
        <p className="label">今日の勉強時間</p>
        <p className="text-3xl font-semibold">{fmtMinutes(perDay[6])}</p>
        <p className="mt-1 text-sm text-muted">直近7日間 {fmtMinutes(week)}</p>
        <div className="mt-4 flex h-24 items-end gap-2">
          {perDay.map((m, i) => (
            <div key={days[i]} className="flex flex-1 flex-col items-center gap-1">
              <div className="w-full rounded-t bg-accent" style={{ height: `${(m / max) * 100}%`, minHeight: m ? 2 : 0 }} />
              <span className="text-[10px] text-muted">{Number(days[i].slice(8))}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <p className="label">Q-Assist 視聴</p>
        <p className="text-lg font-semibold">{fmtHours(qaDone)} / {fmtHours(qaTotal)}（{pct(qaDone, qaTotal)}%）</p>
        <div className="bar mt-2"><span style={{ width: `${pct(qaDone, qaTotal)}%` }} /></div>
      </section>

      <section className="card">
        <p className="label">QB 演習</p>
        <p className="text-lg font-semibold">{answered} / {total} 問（{pct(answered, total)}%）</p>
        <div className="bar mt-2"><span style={{ width: `${pct(answered, total)}%` }} /></div>
        <p className="mt-2 text-sm text-muted">正答率 {graded.length ? `${pct(correct, gradedAnswered)}%` : "未取得"}</p>
      </section>

      <section className="card">
        <p className="label">Anki 今日の復習</p>
        <p className="text-lg font-semibold">{anki[0]?.reviews ?? 0} 枚</p>
        {anki[0]?.minutes != null && <p className="mt-1 text-sm text-muted">{fmtMinutes(anki[0].minutes)}</p>}
      </section>

      <button className="btn-ghost" onClick={() => supabase.auth.signOut()}>ログアウト</button>
    </div>
  );
}
