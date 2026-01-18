import { HeroSection } from "./components/hero-section";
import { ScrollAnimator } from "./components/scroll-animator";

export default function LandingPage(): React.ReactElement {
  return (
    <div className="flex h-screen flex-col bg-ink text-surface overflow-hidden">
      <ScrollAnimator />
      <HeroSection />
    </div>
  );
}
