"use client";

import Link from "next/link";
import { ShieldCheck, Cpu, Code, ArrowRight, Sparkles, Zap, Lock } from "lucide-react";
import { motion } from "framer-motion";
import ScrollReveal from "@/components/ScrollReveal";
import WebcamPixelGrid from "@/components/WebcamPixelGrid";
import DottedGlowBackground from "@/components/dotted-glow-background";

export default function LandingPage() {
  return (
    <div className="relative min-h-screen text-white selection:bg-purple-500/30 selection:text-white overflow-hidden">
      {/* Background */}
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
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black to-black/95" />
      </div>

      {/* Hero Section */}
      <main className="relative z-10">
        <section className="min-h-screen flex items-center justify-center pt-32 pb-20 px-4 sm:px-6">
          <div className="container-custom max-w-6xl mx-auto text-center">
            <ScrollReveal direction="fade" delay={0.1}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 mb-8"
              >
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-medium text-purple-300">AI-Powered Skill Verification</span>
              </motion.div>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={0.2}>
              <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold mb-6 leading-tight">
                <span className="gradient-text">Skill Credentials</span>
                <br />
                <span className="text-white">That Can't Be Faked</span>
              </h1>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={0.3}>
              <p className="text-lg sm:text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto mb-12 leading-relaxed">
                EduProof Zero issues tamper-proof, wallet-bound credentials backed by
                real evidence. Verified by AI and stored permanently on Stellar blockchain.
              </p>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={0.4}>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
                <Link href="/student">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="group relative px-8 py-4 bg-white text-black font-semibold rounded-full overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/50"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      Prove Your Skill
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </motion.button>
                </Link>

                <Link href="/verifier">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-8 py-4 border-2 border-white/20 hover:border-white/40 bg-white/5 backdrop-blur-sm text-white font-semibold rounded-full transition-all duration-300 hover:bg-white/10"
                  >
                    Verify a Wallet
                  </motion.button>
                </Link>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-32 px-4 sm:px-6 relative">
          <div className="container-custom max-w-7xl mx-auto">
            <ScrollReveal direction="up" threshold={0.3}>
              <div className="text-center mb-20">
                <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6">
                  Built for <span className="gradient-text-purple">Fast Moving Teams</span>
                </h2>
                <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                  Agents work inside your existing tools, with built-in approvals, brand and policy guardrails, and full traceability.
                </p>
              </div>
            </ScrollReveal>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              <ScrollReveal direction="up" delay={0.1} threshold={0.2}>
                <FeatureCard
                  icon={<Cpu className="w-8 h-8" />}
                  title="AI-Powered Evaluation"
                  desc="Our AI analyzes GitHub repos, docs, and videos using a transparent public rubric."
                  gradient="from-purple-500/20 to-purple-600/10"
                />
              </ScrollReveal>

              <ScrollReveal direction="up" delay={0.2} threshold={0.2}>
                <FeatureCard
                  icon={<Code className="w-8 h-8" />}
                  title="Soulbound NFTs"
                  desc="Credentials are minted as non-transferable tokens on the Stellar blockchain."
                  gradient="from-indigo-500/20 to-indigo-600/10"
                />
              </ScrollReveal>

              <ScrollReveal direction="up" delay={0.3} threshold={0.2}>
                <FeatureCard
                  icon={<ShieldCheck className="w-8 h-8" />}
                  title="Zero-Trust Verification"
                  desc="Employers verify skills directly on-chain without trusting a central authority."
                  gradient="from-green-500/20 to-green-600/10"
                />
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-32 px-4 sm:px-6 relative bg-gradient-to-b from-transparent via-black/20 to-transparent">
          <div className="container-custom max-w-7xl mx-auto">
            <ScrollReveal direction="up" threshold={0.3}>
              <div className="text-center mb-20">
                <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6">
                  How It <span className="gradient-text-purple">Works</span>
                </h2>
                <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                  Every action is auditable, every outcome accountable.
                </p>
              </div>
            </ScrollReveal>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              <ScrollReveal direction="up" delay={0.1} threshold={0.2}>
                <StepCard
                  number="1"
                  title="Submit Evidence"
                  desc="Connect your wallet and submit a GitHub repo, doc, video, or portfolio."
                  icon={<Zap className="w-6 h-6" />}
                />
              </ScrollReveal>

              <ScrollReveal direction="up" delay={0.2} threshold={0.2}>
                <StepCard
                  number="2"
                  title="AI Evaluation"
                  desc="Our AI scores your evidence and gives transparent feedback (0–100)."
                  icon={<Cpu className="w-6 h-6" />}
                />
              </ScrollReveal>

              <ScrollReveal direction="up" delay={0.3} threshold={0.2}>
                <StepCard
                  number="3"
                  title="Mint Credential"
                  desc="If you pass, mint a permanent soulbound credential on Stellar."
                  icon={<Lock className="w-6 h-6" />}
                />
              </ScrollReveal>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

/* Components */
function FeatureCard({
  icon,
  title,
  desc,
  gradient,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  gradient: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-black/60 to-black/40 backdrop-blur-xl hover:border-purple-500/50 transition-all duration-500 h-full"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
      
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

      <div className="relative z-10 p-8 h-full flex flex-col">
        <div className="text-purple-400 mb-6 w-12 h-12 flex items-center justify-center rounded-xl bg-purple-500/10 border border-purple-500/20 group-hover:scale-110 transition-transform duration-300">
          {icon}
        </div>
        <h3 className="text-2xl font-bold mb-3 text-white">{title}</h3>
        <p className="text-gray-400 leading-relaxed flex-1">{desc}</p>
      </div>
    </motion.div>
  );
}

function StepCard({
  number,
  title,
  desc,
  icon,
}: {
  number: string;
  title: string;
  desc: string;
  icon: React.ReactNode;
}) {
  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-black/60 to-black/40 backdrop-blur-xl hover:border-purple-500/50 transition-all duration-500 h-full"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <DottedGlowBackground
          gap={14}
          radius={1.6}
          color="rgba(255,255,255,0.25)"
          glowColor="rgba(124,58,237,0.9)"
          opacity={0.7}
          speedMin={0.3}
          speedMax={1.1}
        />
      </div>

      <div className="relative z-10 p-8 h-full flex flex-col">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-500/50 flex items-center justify-center text-purple-400 font-bold text-2xl group-hover:scale-110 transition-transform duration-300">
            {number}
          </div>
          <div className="text-purple-400 opacity-50 group-hover:opacity-100 transition-opacity">
            {icon}
          </div>
        </div>
        <h3 className="text-2xl font-bold mb-3 text-white">{title}</h3>
        <p className="text-gray-400 leading-relaxed flex-1">{desc}</p>
      </div>
    </motion.div>
  );
}
