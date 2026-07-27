"use client";
import { useState } from "react";
import "./homepage2.css";
import { useLenis } from "@/lib/motion/useLenis";
import { LoadingScreen } from "@/components/homepage2/LoadingScreen";
import { Nav } from "@/components/homepage2/Nav";
import { HeroScene } from "@/components/homepage2/HeroScene";
import { BlueprintScene } from "@/components/homepage2/BlueprintScene";
import { CouncilScene } from "@/components/homepage2/CouncilScene";
import { RoomBuildScene } from "@/components/homepage2/RoomBuildScene";
import { ProductsScene } from "@/components/homepage2/ProductsScene";
import { BudgetScene } from "@/components/homepage2/BudgetScene";
import { BeforeAfterScene } from "@/components/homepage2/BeforeAfterScene";
import { HowItWorksScene } from "@/components/homepage2/HowItWorksScene";
import { FinalCtaScene } from "@/components/homepage2/FinalCtaScene";
import { Footer } from "@/components/homepage2/Footer";

export default function Landing() {
  const [loading, setLoading] = useState(true);
  useLenis();

  return (
    <main className="hp2">
      {loading && <LoadingScreen onDone={() => setLoading(false)} />}
      <Nav />
      <HeroScene />
      <BlueprintScene />
      <CouncilScene />
      <RoomBuildScene />
      <ProductsScene />
      <BudgetScene />
      <BeforeAfterScene />
      <HowItWorksScene />
      <FinalCtaScene />
      <Footer />
    </main>
  );
}
