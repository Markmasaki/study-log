"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase, pct, fmtHours, watchedSeconds, type Chapter } from "@/lib/supabase";

export default function QAssistPage() {
  const [rows, setRows] = useState<Chapter[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const { data } = await supabase.from("sl_qassist_chapters").select("*").order("sort");
    setRows(data ?? []);
  }, []);

  useEffect(() => { load(); }, [load]);

  const setWatched = async (c: Chapter, next: number) => {
    const watched = Math.max(0, Math.min(c.videos, next));
    setRows((rs) => rs.map((r) => (r.id === c.id ? { ...r, watched } : r)));
    const { error } = await supabase
      .from("sl_qassist_chapters")
      .update({ watched, updated_at: new Date().toISOString() })
      .eq("id", c.id);
    if (error) { setError(error.message); await load(); }
  };

  // 旧版（改訂前）と息抜き動画は、既定では集計に含めない
  const counted = (c: Chapter) => !c.is_old && !c.is_optional;
  const target = rows.filter(counted);
  const totalSec = target.reduce((a, c) => a + c.seconds, 0);
  const doneSec = target.reduce((a, c) => a + watchedSeconds(c), 0);
  const totalVideos = target.reduce((a, c) => a + c.videos, 0);
  const doneVideos = target.reduce((a, c) => a + c.watched, 0);
  const courses = [...new Set(rows.map((r) => r.course))];

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Q-Assist・総まとめ</h1>

      <section className="card">
        <p className="label">見るべき講座の合計（旧版・息抜きを除く）</p>
        <p className="text-lg font-semibold">{fmtHours(doneSec)} / {fmtHours(totalSec)}（{pct(doneSec, totalSec)}%）</p>
        <div className="bar mt-2"><span style={{ width: `${pct(doneSec, totalSec)}%` }} /></div>
        <p className="mt-2 text-sm text-muted">
          {doneVideos} / {totalVideos} 本・残り {fmtHours(totalSec - doneSec)}
        </p>
      </section>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" className="size-4 accent-[var(--accent)]" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} />
        旧版・息抜き動画も表示する
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}

      {courses.map((course) => {
        const list = rows.filter((r) => r.course === course);
        const cnt = list.filter(counted);
        const t = cnt.reduce((a, c) => a + c.seconds, 0);
        const d = cnt.reduce((a, c) => a + watchedSeconds(c), 0);
        const shown = showAll ? list : cnt;
        return (
          <details key={course} className="card">
            <summary className="cursor-pointer">
              <span className="font-semibold">{course}</span>
              <span className="ml-2 text-sm text-muted">{fmtHours(d)} / {fmtHours(t)}（{pct(d, t)}%）</span>
              <div className="bar mt-2"><span style={{ width: `${pct(d, t)}%` }} /></div>
            </summary>
            <ul className="mt-3 divide-y divide-line">
              {shown.map((c) => (
                <li key={c.id} className="py-2 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className={counted(c) ? "" : "text-muted"}>{c.chapter}</span>
                    <span className="shrink-0 text-xs text-muted">{c.videos}本・{fmtHours(c.seconds)}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <button className="btn-ghost !px-3 !py-1" aria-label="1本戻す" onClick={() => setWatched(c, c.watched - 1)}>−</button>
                    <span className="min-w-16 text-center tabular-nums">{c.watched} / {c.videos}</span>
                    <button className="btn-ghost !px-3 !py-1" aria-label="1本進める" onClick={() => setWatched(c, c.watched + 1)}>＋</button>
                    <button className="btn-ghost !px-3 !py-1 text-xs" onClick={() => setWatched(c, c.videos)}>全部見た</button>
                  </div>
                </li>
              ))}
            </ul>
          </details>
        );
      })}
      {rows.length === 0 && <p className="text-sm text-muted">講座データがありません。</p>}
    </div>
  );
}
