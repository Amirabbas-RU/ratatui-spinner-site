import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ratatui-spinner — اسپینرهای بی‌حالت برای ترمینال",
  description:
    "ویجت‌های انیمیشنی بی‌حالت و کاملاً قابل تنظیم برای Ratatui: کمان‌های برایل، نوارهای جهنده و گلیف‌های چرخان.",
  keywords: [
    "ratatui",
    "spinner",
    "rust",
    "terminal",
    "tui",
    "برایل",
    "اسپینر",
    "ترمینال",
  ],
  openGraph: {
    title: "ratatui-spinner — اسپینرهای بی‌حالت برای ترمینال",
    description: "ویجت‌های انیمیشنی بی‌حالت و کاملاً قابل تنظیم برای Ratatui.",
    type: "website",
    locale: "fa_IR",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // `dark` is what the Vengeance UI components check for their dark palette.
    <html lang="fa" dir="rtl" className="dark">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
