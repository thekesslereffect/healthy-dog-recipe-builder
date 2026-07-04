import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";

// Nunito reads heavier than geometric sans at the same numeric weight —
// we load 400–700 and prefer medium/semibold in the UI.
const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Healthy Dog Recipe Builder",
  description:
    "Build balanced, vet-informed homemade meals for your dogs — calorie, portion and shopping calculations included.",
  openGraph: {
    title: "Healthy Dog Recipe Builder",
    description:
      "Balanced meals, portions & shopping lists for your dogs.",
    type: "website",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{if(localStorage.getItem('hdrb.theme')==='"dark"')document.documentElement.classList.add('dark')}catch(e){}})();`,
          }}
        />
      </head>
      <body className={`${nunito.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
