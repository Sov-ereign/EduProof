"use client";

import Link from "next/link";
import { ArrowRight, ShieldCheck, Cpu, Code } from "lucide-react";
import { motion } from "framer-motion";

import WebcamPixelGrid from "../components/WebcamPixelGrid";
import DottedGlowBackground from "../components/dotted-glow-background";

export default function LandingPage() {
  return (
    <div className="relative min-h-screen text-white selection:bg-purple-500 selection:text-white overflow-hidden">

      {/* ================= BACKGROUND ================= */}
      <div className="fixed inset-0 -z-10">
        <WebcamPixelGrid
          gridCols={80}
          gridRows={60}
          maxElevation={18}
          motionSensitivity={0.35}
          elevationSmoothing={0.12}
          colorMode="monochrome"
          monochromeColor="#7c3aed"
          backgroundColor="#000000"
          darken={0.2}
          gapRatio={0.08}
          borderOpacity={0.06}
        />

        {/* readability overlay */}
        <div className="absolute inset-0 bg-black/40" />
      </div>
      {/* ============================================== */}

      {/* ================= NAVBAR ================= */}
      <nav className="fixed w-full z-50 bg-black/50 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-8 h-8 text-purple-500" />
            <span className="text-xl font-bold tracking-tight">
              EduProof Zero
            </span>
          </div>

          <div className="hidden md:flex gap-6 text-sm font-medium text-gray-400">
            <Link href="#features" className="hover:text-white transition">
              Features
            </Link>
            <Link href="#how-it-works" className="hover:text-white transition">
              How it Works
            </Link>
          </div>

          <div className="flex gap-4">
            <Link href="/verifier">
              <button className="px-5 py-2 text-sm font-medium text-gray-300 hover:text-white transition">
                Verifier Mode
              </button>
            </Link>
            <Link href="/student">
              <button className="bg-white text-black px-5 py-2 rounded-full text-sm font-bold hover:bg-gray-200 transition flex items-center gap-2">
                Launch App <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </div>
        </div>
      </nav>
      {/* ============================================ */}

      {/* ================= HERO ================= */}
      <main className="pt-32 pb-20 relative z-10">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
          >
            <h1 className="text-6xl md:text-8xl font-bold tracking-tighter mb-8 bg-gradient-to-b from-white to-gray-500 bg-clip-text text-transparent">
              Skill Credentials <br />
              That Can’t Be Faked.
            </h1>

            <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-10 leading-relaxed">
              EduProof Zero issues tamper-proof, wallet-bound credentials backed by
              real evidence. Verified by AI and stored permanently on Stellar
              blockchain.
            </p>

            <div className="flex flex-col md:flex-row items-center justify-center gap-4">
              <Link href="/student">
                <button className="h-12 px-8 rounded-full bg-purple-600 hover:bg-purple-500 text-white font-semibold transition">
                  Prove Your Skill
                </button>
              </Link>

              <Link href="/verifier">
                <button className="h-12 px-8 rounded-full border border-white/20 hover:bg-white/10 text-white font-semibold transition">
                  Verify a Wallet
                </button>
              </Link>
            </div>
          </motion.div>
        </div>

        {/* ================= FEATURES ================= */}
        <div
          id="features"
          className="max-w-7xl mx-auto px-6 mt-32 grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          <FeatureCard
            icon={<Cpu />}
            title="AI-Powered Evaluation"
            desc="Our AI analyzes GitHub repos, docs, and videos using a transparent public rubric."
          />
          <FeatureCard
            icon={<Code />}
            title="Soulbound NFTs"
            desc="Credentials are minted as non-transferable tokens on the Stellar blockchain."
          />
          <FeatureCard
            icon={<ShieldCheck />}
            title="Zero-Trust Verification"
            desc="Employers verify skills directly on-chain without trusting a central authority."
          />
        </div>

        {/* ================= HOW IT WORKS ================= */}
        <div
          id="how-it-works"
          className="max-w-7xl mx-auto px-6 mt-32 mb-20"
        >
          <h2 className="text-4xl font-bold text-center mb-16">
            How It Works
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <StepCard
              number="1"
              title="Submit Evidence"
              desc="Connect your wallet and submit a GitHub repo, doc, video, or portfolio."
            />
            <StepCard
              number="2"
              title="AI Evaluation"
              desc="Our AI scores your evidence and gives transparent feedback (0–100)."
            />
            <StepCard
              number="3"
              title="Mint Credential"
              desc="If you pass, mint a permanent soulbound credential on Stellar."
            />
          </div>
        </div>
      </main>
    </div>
  );
}

/* ================= COMPONENTS ================= */

function FeatureCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/60 backdrop-blur-xl
 hover:border-purple-500/50 transition duration-300 group">
      
      {/* dotted glow background */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <DottedGlowBackground
          gap={14}
          radius={1.8}
          color="rgba(255,255,255,0.25)"
          glowColor="rgba(124,58,237,0.9)"
          opacity={0.7}
          speedMin={0.4}
          speedMax={1.2}
        />
      </div>

      <div className="relative z-10 p-8">
        <div className="text-purple-500 mb-4 w-10 h-10">
          {icon}
        </div>
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className="text-gray-400 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function StepCard({
  number,
  title,
  desc,
}: {
  number: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/60 backdrop-blur-xl
 hover:border-purple-500/50 transition duration-300 group">
      
      {/* dotted glow background */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <DottedGlowBackground
          gap={14}
          radius={1.6}
          color="rgba(255,255,255,0.25)"
          glowColor="rgba(124,58,237,0.9)"
          opacity={0.6}
          speedMin={0.3}
          speedMax={1.1}
        />
      </div>

      <div className="relative z-10 p-8">
        <div className="w-12 h-12 rounded-full bg-purple-500/20 border border-purple-500/50 flex items-center justify-center text-purple-400 font-bold text-xl mb-4">
          {number}
        </div>
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className="text-gray-400 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}
