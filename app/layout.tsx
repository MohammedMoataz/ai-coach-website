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

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "AI Coach — harness your team", template: "%s · AI Coach" },
  description:
    "A coach for using Claude Code well: memory that survives the session, knowledge that changes hands, and no claim without the evidence for it.",
  openGraph: {
    type: "website",
    siteName: "AI Coach",
    images: [{ url: "/cover.jpg", alt: "AI Coach — harness your team" }],
  },
  twitter: { card: "summary_large_image" },
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
          <Footer version={catalog.version} commit={catalog.commit} />
        </Providers>
      </body>
    </html>
  );
}
