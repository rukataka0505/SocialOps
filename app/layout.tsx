import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: {
    default: "SocialOps - チームタスク管理を、もっとシンプルに",
    template: "%s | SocialOps"
  },
  description: "SNS運用チームのためのタスク管理ツール。今日やるべきことが一目でわかる、シンプルで美しいダッシュボード。",
  keywords: ["タスク管理", "チーム管理", "SNS運用", "プロジェクト管理", "カレンダー"],
  authors: [{ name: "SocialOps Team" }],
  openGraph: {
    type: "website",
    locale: "ja_JP",
    url: "https://socialops.app",
    siteName: "SocialOps",
    title: "SocialOps - チームタスク管理を、もっとシンプルに",
    description: "SNS運用チームのためのタスク管理ツール。今日やるべきことが一目でわかる、シンプルで美しいダッシュボード。",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "SocialOps Dashboard",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SocialOps - チームタスク管理を、もっとシンプルに",
    description: "SNS運用チームのためのタスク管理ツール。今日やるべきことが一目でわかる。",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link href="https://api.fontshare.com/v2/css?f[]=clash-display@400,500,600,700&f[]=satoshi@400,500,700,900&display=swap" rel="stylesheet" />
      </head>
      <body
        className="antialiased"
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
