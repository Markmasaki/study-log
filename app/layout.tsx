import type { Metadata, Viewport } from "next";
import "./globals.css";
import AuthGate from "@/components/AuthGate";

export const metadata: Metadata = {
  title: "学習記録",
  description: "勉強時間・Q-Assist・QBの進捗記録",
  appleWebApp: { capable: true, title: "学習記録", statusBarStyle: "default" },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <AuthGate>{children}</AuthGate>
      </body>
    </html>
  );
}
