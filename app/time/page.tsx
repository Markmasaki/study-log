"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase, today, fmtMinutes, CATEGORY_LABEL, type StudySession } from "@/lib/supabase";

const TIMER_KEY = "sl_timer_started_at";

export default function TimePage() {
  const [rows, setRows] = useState<StudySession[]>([]);
  const [category, setCategory] = useState<StudySession["category"]>("qassist");
  const [subject, setSubject] = useState("");
  const [minutes, setMinutes] = useState("");
  const [date, setDate] = useState(today());
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("sl_study_sessions").select("*")
      .order("studied_on", { ascending: false }).order("created_at", { ascending: false }).limit(30);
    setRows(data ?? []);
  }, []);

  useEffect(() => {
    load();
    // タイマーは開始時刻だけを端末に保存する（画面を閉じても継続）
    try {
      const v = localStorage.getItem(TIMER_KEY);
      if (v) setStartedAt(Number(v));
    } catch {}
  }, [load]);

  useEffect(() => {
    if (!startedAt) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  const add = async (mins: number, on: string) => {
    setError("");
    const { error } = await supabase.from("sl_study_sessions").insert({
      minutes: mins, studied_on: on, category, subject: subject.trim() || null,
    });
    if (error) setError(error.message);
    await load();
  };

  const start = () => {
    const t = Date.now();
    setStartedAt(t);
    setNow(t);
    try { localStorage.setItem(TIMER_KEY, String(t)); } catch {}
  };

  const stop = async () => {
    if (!startedAt) return;
    const mins = Math.max(1, Math.round((Date.now() - startedAt) / 60000));
    setStartedAt(null);
    try { localStorage.removeItem(TIMER_KEY); } catch {}
    await add(mins, today());
  };

  const remove = async (id: string) => {
    await supabase.from("sl_study_sessions").delete().eq("id", id);
    await load();
  };

  const elapsed = startedAt ? Math.floor((now - startedAt) / 1000) : 0;
  const clock = [Math.floor(elapsed / 3600), Math.floor(elapsed / 60) % 60, elapsed % 60]
    .map((n) => String(n).padStart(2, "0")).join(":");

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">勉強時間</h1>

      <section className="card space-y-3">
        <div className="flex gap-2">
          {(Object.keys(CATEGORY_LABEL) as StudySession["category"][]).map((c) => (
            <button key={c} className={c === category ? "btn" : "btn-ghost"} onClick={() => setCategory(c)}>
              {CATEGORY_LABEL[c]}
            </button>
          ))}
        </div>
        <div>
          <label className="label">科目（任意）</label>
          <input className="input" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="例：循環器" />
        </div>
        <p className="text-center font-mono text-4xl tabular-nums">{clock}</p>
        {startedAt
          ? <button className="btn w-full" onClick={stop}>終了して記録</button>
          : <button className="btn w-full" onClick={start}>タイマー開始</button>}
      </section>

      <section className="card space-y-3">
        <p className="label">手入力</p>
        <div className="flex gap-2">
          <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <input className="input" type="number" inputMode="numeric" min={1} placeholder="分" value={minutes} onChange={(e) => setMinutes(e.target.value)} />
        </div>
        <button
          className="btn w-full" disabled={!(Number(minutes) > 0)}
          onClick={async () => { await add(Math.round(Number(minutes)), date); setMinutes(""); }}
        >追加</button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </section>

      <section className="card">
        <p className="label">最近の記録</p>
        <ul className="divide-y divide-line">
          {rows.map((r) => (
            <li key={r.id} className="flex items-center justify-between py-2 text-sm">
              <span>{r.studied_on.slice(5)}　{CATEGORY_LABEL[r.category]}{r.subject ? `・${r.subject}` : ""}</span>
              <span className="flex items-center gap-3">
                {fmtMinutes(r.minutes)}
                <button className="text-muted" aria-label="削除" onClick={() => remove(r.id)}>×</button>
              </span>
            </li>
          ))}
          {rows.length === 0 && <li className="py-2 text-sm text-muted">まだ記録がありません。</li>}
        </ul>
      </section>
    </div>
  );
}
