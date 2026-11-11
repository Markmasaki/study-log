"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase, today, pct, type Lecture } from "@/lib/supabase";

export default function QAssistPage() {
  const [rows, setRows] = useState<Lecture[]>([]);
  const [subject, setSubject] = useState("");
  const [titles, setTitles] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const { data } = await supabase.from("sl_qassist_lectures").select("*").order("subject").order("sort");
    setRows(data ?? []);
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggle = async (l: Lecture) => {
    const watched_on = l.watched_on ? null : today();
    setRows((rs) => rs.map((r) => (r.id === l.id ? { ...r, watched_on } : r)));
    await supabase.from("sl_qassist_lectures").update({ watched_on }).eq("id", l.id);
  };

  // 1行1講義でまとめて登録できる
  const add = async () => {
    setError("");
    const s = subject.trim();
    const list = titles.split("\n").map((t) => t.trim()).filter(Boolean);
    if (!s || list.length === 0) return;
    const base = rows.filter((r) => r.subject === s).length;
    const { error } = await supabase.from("sl_qassist_lectures")
      .insert(list.map((title, i) => ({ subject: s, title, sort: base + i })));
    if (error) setError(error.message);
    else setTitles("");
    await load();
  };

  const subjects = [...new Set(rows.map((r) => r.subject))];

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Q-Assist</h1>

      {subjects.map((s) => {
        const list = rows.filter((r) => r.subject === s);
        const done = list.filter((r) => r.watched_on).length;
        return (
          <details key={s} className="card">
            <summary className="cursor-pointer">
              <span className="font-semibold">{s}</span>
              <span className="ml-2 text-sm text-muted">{done} / {list.length}（{pct(done, list.length)}%）</span>
              <div className="bar mt-2"><span style={{ width: `${pct(done, list.length)}%` }} /></div>
            </summary>
            <ul className="mt-3 divide-y divide-line">
              {list.map((l) => (
                <li key={l.id}>
                  <label className="flex items-center gap-3 py-2 text-sm">
                    <input type="checkbox" className="size-5 accent-[var(--accent)]" checked={!!l.watched_on} onChange={() => toggle(l)} />
                    <span className="flex-1">{l.title}</span>
                    {l.watched_on && <span className="text-xs text-muted">{l.watched_on.slice(5)}</span>}
                  </label>
                </li>
              ))}
            </ul>
          </details>
        );
      })}
      {subjects.length === 0 && <p className="text-sm text-muted">下のフォームから講義を登録してください。</p>}

      <section className="card space-y-3">
        <p className="label">講義を追加</p>
        <input className="input" placeholder="科目（例：循環器）" value={subject} onChange={(e) => setSubject(e.target.value)} />
        <textarea className="input" rows={4} placeholder={"講義名を1行に1つ"} value={titles} onChange={(e) => setTitles(e.target.value)} />
        <button className="btn w-full" onClick={add}>追加</button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </section>
    </div>
  );
}
