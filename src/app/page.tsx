import { Features } from "@/components/features";
import { Header } from "@/components/header";
import { Hero } from "@/components/hero";
import { Inside } from "@/components/inside";
import { Install } from "@/components/install";
import { PageBackdrop } from "@/components/page-backdrop";
import { Provenance } from "@/components/provenance";
import { RevealObserver } from "@/components/reveal-observer";
import { Showcase } from "@/components/showcase";
import { SiteFooter } from "@/components/site-footer";
import { SpinnerProvider } from "@/components/spinner-engine";
import { Stateless } from "@/components/stateless";
import { Usage } from "@/components/usage";

export default function Home() {
  return (
    <SpinnerProvider>
      <a href="#main" className="skip-link">
        پرش به محتوای اصلی
      </a>
      <RevealObserver />
      <PageBackdrop />
      <Header />
      <main id="main">
        <Hero />
        <Showcase />
        <Stateless />
        <Usage />
        <Inside />
        <Features />
        <Install />
        <Provenance />
      </main>
      <SiteFooter />
    </SpinnerProvider>
  );
}
