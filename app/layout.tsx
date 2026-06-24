import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wikipedia",
  description: "Embedded Wikipedia articles",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://en.wikipedia.org/w/load.php?modules=mediawiki.skinning.content.parsoid|mediawiki.skinning.interface&only=styles&skin=vector"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
