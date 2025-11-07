import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mapa Geoespacial",
  description: "Visualização de dados geoespaciais",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body style={{ margin: 0, padding: 0, height: '100vh', width: '100vw', overflow: 'hidden' }}>
        {children}
      </body>
    </html>
  );
}