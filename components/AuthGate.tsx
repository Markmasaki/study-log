"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import Nav from "./Nav";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  if (session === undefined) return <p className="p-6 text-sm text-muted">読み込み中…</p>;

  if (!session) {
    const run = async (mode: "in" | "up") => {
      setMessage("");
      const { error } =
        mode === "in"
          ? await supabase.auth.signInWithPassword({ email, password })
          : await supabase.auth.signUp({ email, password });
      if (error) setMessage(error.message);
      else if (mode === "up") setMessage("登録しました。確認メールが届いた場合はリンクを開いてください。");
    };
    return (
      <main className="mx-auto w-full max-w-sm p-6">
        <h1 className="mb-6 text-xl font-semibold">学習記録</h1>
        <label className="label">メールアドレス</label>
        <input className="input mb-3" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <label className="label">パスワード</label>
        <input className="input mb-4" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button className="btn w-full" onClick={() => run("in")}>ログイン</button>
        <button className="btn-ghost mt-2 w-full" onClick={() => run("up")}>初回登録</button>
        {message && <p className="mt-3 text-sm text-muted">{message}</p>}
      </main>
    );
  }

  return (
    <>
      <main className="mx-auto w-full max-w-2xl flex-1 p-4 pb-24">{children}</main>
      <Nav />
    </>
  );
}
