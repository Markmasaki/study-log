# 学習記録（study-log）

勉強時間・Q-Assist の視聴・QB の進捗を記録する個人用 PWA。

- Next.js (App Router) + Tailwind / Supabase（プロジェクト `qa-progress`、テーブルは `sl_` で始まる）/ Vercel
- 画面：`/` ホーム、`/time` 勉強時間、`/qassist` Q-Assist、`/qb` QB
- データ設計：`supabase/schema.sql`（行は本人のみ読み書き可）
- 環境変数：`.env.example` を参照

## 今後
- mediLink の QB 進捗の半自動取り込み（`sl_qb_progress` に `source = 'import'` で upsert）
- 科目別・教材別のグラフ、国試までのペース表示
