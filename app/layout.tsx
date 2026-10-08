import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import "primeicons/primeicons.css";
import "./lara.css";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { getCatalog } from "@/lib/coaches";
import { SITE_URL } from "@/lib/site";

const sans = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-plex-sans" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-plex-mono" });

// Pages set their own canonical URL, Open Graph and Twitter blocks through pageMeta().
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "AI Coach — a coaching harness for Claude Code", template: "%s · AI Coach" },
  applicationName: "AI Coach",
  authors: [{ name: "Mohammed Moataz", url: "https://github.com/MohammedMoataz" }],
  // Search Console ownership check: set GOOGLE_SITE_VERIFICATION in the Vercel project.
  ...(process.env.GOOGLE_SITE_VERIFICATION && { verification: { google: process.env.GOOGLE_SITE_VERIFICATION } }),
};

// Runs before first paint: picks the saved or system theme so nothing flashes. Every colour,
// PrimeReact's included (app/lara.css), reads tokens that switch on this attribute.
const themeScript = `(function(){var t;try{t=localStorage.getItem("theme")}catch(e){}
if(t!=="light"&&t!=="dark")t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";
document.documentElement.dataset.theme=t})()`;

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const catalog = await getCatalog();
  return (
    <html lang="en" data-theme="light" className={`${sans.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <a className="skip" href="#main">
          Skip to content
        </a>
        <Providers>
          <Nav coaches={catalog.coaches.map((c) => c.slug)} />
          <main id="main">{children}</main>
          <Footer version={catalog.version} coaches={catalog.coaches.map((c) => c.slug)} />
        </Providers>
      </body>
    </html>
  );
}
