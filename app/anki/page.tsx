"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase, today, fmtMinutes, pct, type AnkiDaily, type AnkiDeck } from "@/lib/supabase";

export default function AnkiPage() {
  const [days, setDays] = useState<AnkiDaily[]>([]);
  const [decks, setDecks] = useState<AnkiDeck[]>([]);
  const [form, setForm] = useState({ day: today(), reviews: "", minutes: "" });
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const [d, k] = await Promise.all([
      supabase.from("sl_anki_daily").select("*").gte("day", today(-13)).order("day"),
      supabase.from("sl_anki_decks").select("*").order("deck"),
    ]);
    setDays(d.data ?? []);
    setDecks(k.data ?? []);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setError("");
    const { error } = await supabase.from("sl_anki_daily").upsert(
      {
        day: form.day,
        reviews: Math.round(Number(form.reviews)),
        minutes: form.minutes === "" ? null : Math.round(Number(form.minutes)),
        source: "manual",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,day" },
    );
    if (error) setError(error.message);
    else setForm({ day: today(), reviews: "", minutes: "" });
    await load();
  };

  const range = Array.from({ length: 14 }, (_, i) => today(i - 13));
  const byDay = new Map(days.map((r) => [r.day, r]));
  const counts = range.map((d) => byDay.get(d)?.reviews ?? 0);
  const max = Math.max(50, ...counts);
  const todayRow = byDay.get(today());
  const sum14 = counts.reduce((a, b) => a + b, 0);
  const streak = (() => {
    let n = 0;
    for (let i = range.length - 1; i >= 0; i--) {
      if (counts[i] > 0) n++;
      else if (i === range.length - 1) continue; // 今日まだ未実施でも連続は切らない
      else break;
    }
    return n;
  })();
  const accuracy = todayRow?.correct != null ? pct(todayRow.correct, todayRow.reviews) : null;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Anki</h1>

      <section className="card">
        <p className="label">今日の復習</p>
        <p className="text-3xl font-semibold">{todayRow?.reviews ?? 0} 枚</p>
        <p className="mt-1 text-sm text-muted">
          {todayRow?.minutes != null ? `${fmtMinutes(todayRow.minutes)}・` : ""}
          {accuracy != null ? `正答率 ${accuracy}%・` : ""}
          連続 {streak} 日・直近14日 {sum14} 枚
        </p>
        <div className="mt-4 flex h-24 items-end gap-1">
          {counts.map((c, i) => (
            <div key={range[i]} className="flex flex-1 flex-col items-center gap-1">
              <div className="w-full rounded-t bg-accent" style={{ height: `${(c / max) * 100}%`, minHeight: c ? 2 : 0 }} />
              <span className="text-[10px] text-muted">{Number(range[i].slice(8))}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <p className="label">デッキ別の今日の残り</p>
        <ul className="divide-y divide-line">
          {decks.map((d) => (
            <li key={d.id} className="py-2 text-sm">
              <div className="flex items-center justify-between">
                <span>{d.deck}</span>
                <span className="font-semibold">{d.due_new + d.due_learn + d.due_review} 枚</span>
              </div>
              <p className="text-xs text-muted">
                新規 {d.due_new}・学習中 {d.due_learn}・復習 {d.due_review}
                {d.total != null ? `・全体 ${d.total}枚` : ""}
              </p>
            </li>
          ))}
          {decks.length === 0 && <li className="py-2 text-sm text-muted">まだ取り込まれていません。</li>}
        </ul>
        {decks[0] && <p className="mt-2 text-xs text-muted">更新：{new Date(decks[0].updated_at).toLocaleString("ja-JP")}</p>}
      </section>

      <section className="card space-y-3">
        <p className="label">手入力（取り込めない日用）</p>
        <input className="input" type="date" value={form.day} onChange={(e) => setForm({ ...form, day: e.target.value })} />
        <div className="grid grid-cols-2 gap-2">
          <input className="input" type="number" inputMode="numeric" min={0} placeholder="復習枚数" value={form.reviews} onChange={(e) => setForm({ ...form, reviews: e.target.value })} />
          <input className="input" type="number" inputMode="numeric" min={0} placeholder="分（任意）" value={form.minutes} onChange={(e) => setForm({ ...form, minutes: e.target.value })} />
        </div>
        <button className="btn w-full" disabled={form.reviews === ""} onClick={save}>保存</button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </section>
    </div>
  );
}
