import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { ReactQueryProvider } from "./ReactQueryProvider";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://unimad.ai"),
  title: {
    default: "Unimad - AI Personal Branding",
    template: "%s | Unimad",
  },
  description: "Personal branding simplified for job seekers – build your portfolio, resume, and presence with AI.",
  openGraph: {
    siteName: "Unimad",
    type: "website",
    url: "https://unimad.ai",
    title: "Unimad - AI Personal Branding",
    description: "Personal branding simplified for job seekers – build your portfolio, resume, and presence with AI.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Unimad - AI Personal Branding",
    description: "Personal branding simplified for job seekers – build your portfolio, resume, and presence with AI.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Onest:wght@100..900&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-slate-50 text-slate-900 text-sm font-light overflow-x-hidden font-sans antialiased" suppressHydrationWarning>
        <ReactQueryProvider>{children}</ReactQueryProvider>
        <Analytics />
      </body>
    </html>
  );
}
