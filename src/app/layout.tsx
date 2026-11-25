import type { Metadata, Viewport } from "next";
import { Inter_Tight } from "next/font/google";
import { readContent } from "@/server/store";

const sans = Inter_Tight({ subsets: ["latin"], weight: ["500", "600"], variable: "--font-sans", display: "swap" });

export async function generateMetadata(): Promise<Metadata> {
  const { brand, description } = await readContent();
  return {
    title: { default: brand, template: `%s · ${brand}` },
    description,
    openGraph: { title: brand, description, type: "website" },
    twitter: { title: brand, description },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={sans.variable}>
      <body>{children}</body>
    </html>
  );
}
