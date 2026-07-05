import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Nunito } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito"
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Paws & Portions — Healthy Dog Recipe Builder",
  description:
    "Build balanced, vet-informed homemade meals for your dogs — calorie, portion and shopping calculations included.",
  openGraph: {
    title: "Paws & Portions",
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
      <body className={`${jakarta.variable} ${nunito.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
