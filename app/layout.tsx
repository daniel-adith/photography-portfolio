import type { Metadata } from "next";
import { Hanken_Grotesk, IBM_Plex_Mono } from "next/font/google";
import { CONTENT } from "@/content/content";
import "./globals.css";

const hankenGrotesk = Hanken_Grotesk({
  weight: ["400", "500"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-body",
  fallback: ["sans-serif"],
});

const ibmPlexMono = IBM_Plex_Mono({
  weight: "500",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
  fallback: ["monospace"],
});

export const metadata: Metadata = {
  title: CONTENT.meta.title,
  description: CONTENT.meta.description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      data-intro="on"
      suppressHydrationWarning
      className={`${hankenGrotesk.variable} ${ibmPlexMono.variable}`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){
              try {
                var seen = sessionStorage.getItem("intro_seen");
                var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
                var hash = window.location.hash;
                var hasHash = hash && ["#about", "#approach", "#works", "#selected", "#contact"].indexOf(hash) !== -1;
                if (seen === "1" || seen === "true" || reduced || hasHash) {
                  document.documentElement.setAttribute("data-intro", "off");
                } else {
                  document.documentElement.setAttribute("data-intro", "on");
                }
              } catch (e) {
                document.documentElement.setAttribute("data-intro", "on");
              }
            })();`,
          }}
        />
        <noscript>
          <style>{`
            [data-intro="on"] #intro-layer { display: none !important; }
            html, body { overflow: auto !important; height: auto !important; }
          `}</style>
        </noscript>
      </head>
      <body>
        <div className="grainOverlay" aria-hidden="true">
          <svg className="grainSvg">
            <filter id="grain-filter">
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.85"
                numOctaves="2"
                stitchTiles="stitch"
              />
            </filter>
            <rect width="100%" height="100%" filter="url(#grain-filter)" />
          </svg>
        </div>
        {children}
      </body>
    </html>
  );
}
