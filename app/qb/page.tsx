"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase, pct, type QbRow } from "@/lib/supabase";

const EMPTY = { subject: "", total: "", answered: "", correct: "", round: "1" };

export default function QbPage() {
  const [rows, setRows] = useState<QbRow[]>([]);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const { data } = await supabase.from("sl_qb_progress").select("*").order("subject");
    setRows(data ?? []);
  }, []);

  useEffect(() => { load(); }, [load]);

  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  // 同じ科目名なら上書き（mediLink からの取り込みも同じ経路で upsert する予定）
  const save = async () => {
    setError("");
    const total = Number(form.total), answered = Number(form.answered);
    const correct = form.correct === "" ? null : Number(form.correct);
    if (!form.subject.trim()) return setError("科目を入力してください。");
    if (answered > total || (correct !== null && correct > answered)) return setError("演習数は総問題数以下、正解数は演習数以下にしてください。");
    const { error } = await supabase.from("sl_qb_progress").upsert(
      { subject: form.subject.trim(), total, answered, correct, round: Math.max(1, Number(form.round) || 1), source: "manual", updated_at: new Date().toISOString() },
      { onConflict: "user_id,subject" },
    );
    if (error) setError(error.message);
    else setForm(EMPTY);
    await load();
  };

  const edit = (r: QbRow) =>
    setForm({ subject: r.subject, total: String(r.total), answered: String(r.answered), correct: r.correct == null ? "" : String(r.correct), round: String(r.round) });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">QB</h1>

      {rows.map((r) => (
        <button key={r.id} className="card block w-full text-left" onClick={() => edit(r)}>
          <span className="font-semibold">{r.subject}</span>
          <span className="ml-2 text-sm text-muted">{r.round}周目</span>
          <div className="bar mt-2"><span style={{ width: `${pct(r.answered, r.total)}%` }} /></div>
          <p className="mt-2 text-sm text-muted">
            {r.answered} / {r.total} 問（{pct(r.answered, r.total)}%）・正答率 {r.correct == null ? "未取得" : `${pct(r.correct, r.answered)}%`}
          </p>
        </button>
      ))}
      {rows.length === 0 && <p className="text-sm text-muted">下のフォームから科目を登録してください。</p>}

      <section className="card space-y-3">
        <p className="label">科目を追加・更新（カードをタップすると編集できます）</p>
        <input className="input" placeholder="科目（例：循環器）" value={form.subject} onChange={set("subject")} />
        <div className="grid grid-cols-2 gap-2">
          <input className="input" type="number" inputMode="numeric" min={0} placeholder="総問題数" value={form.total} onChange={set("total")} />
          <input className="input" type="number" inputMode="numeric" min={0} placeholder="演習済み" value={form.answered} onChange={set("answered")} />
          <input className="input" type="number" inputMode="numeric" min={0} placeholder="正解数（任意）" value={form.correct} onChange={set("correct")} />
          <input className="input" type="number" inputMode="numeric" min={1} placeholder="周回" value={form.round} onChange={set("round")} />
        </div>
        <button className="btn w-full" onClick={save}>保存</button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </section>
    </div>
  );
}
