'use client';

import { useState } from 'react';
import Hero from "@/components/Hero";
import FeaturedTools from "@/components/FeaturedTools";
import HowItWorks from "@/components/HowItWorks";
import Benefits from "@/components/Benefits";
import Community from "@/components/Community";

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  return (
    <main>
      <Hero selectedCategory={selectedCategory} onCategoryChange={setSelectedCategory} />
      <FeaturedTools selectedCategory={selectedCategory} />
      <HowItWorks />
      <Benefits />
      <Community />
    </main>
  );
}
