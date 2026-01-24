"use client";

import Link from "next/link";
import { ArrowRight, ShieldCheck, Cpu, Code } from "lucide-react";
import { motion } from "framer-motion";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-purple-500 selection:text-white">
      {/* Navbar */}
      <nav className="fixed w-full z-50 bg-black/50 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-8 h-8 text-purple-500" />
            <span className="text-xl font-bold tracking-tight">EduProof Zero</span>
          </div>
          <div className="flex gap-6 text-sm font-medium text-gray-400">
            <Link href="#features" className="hover:text-white transition">Features</Link>
            <Link href="#how-it-works" className="hover:text-white transition">How it Works</Link>
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

      {/* Hero Section */}
      <main className="pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-6xl md:text-8xl font-bold tracking-tighter mb-8 bg-gradient-to-b from-white to-gray-600 bg-clip-text text-transparent">
              Skill Credentials <br />
              That Can’t Be Faked.
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              EduProof Zero issues tamper-proof, wallet-bound credentials backed by real evidence. Verified by AI and stored permanently on Stellar blockchain.
            </p>

            <div className="flex flex-col md:flex-row items-center justify-center gap-4">
              <Link href="/student">
                <button className="h-12 px-8 rounded-full bg-purple-600 hover:bg-purple-500 text-white font-semibold transition flex items-center gap-2">
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

        {/* Feature Grid */}
        <div id="features" className="max-w-7xl mx-auto px-6 mt-32 grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard
            icon={<Cpu />}
            title="AI-Powered Evaluation"
            desc="Our AI analyzes your GitHub repos, docs, and Loom videos against a transparent, public rubric."
          />
          <FeatureCard
            icon={<Code />}
            title="Soulbound NFTs"
            desc="Credentials are minted as non-transferable tokens on the Stellar blockchain. They can't be sold or transferred."
          />
          <FeatureCard
            icon={<ShieldCheck />}
            title="Zero-Trust Verification"
            desc="Employers verify your skills directly on-chain without needing an account or trusting a central authority."
          />
        </div>

        {/* How It Works Section */}
        <div id="how-it-works" className="max-w-7xl mx-auto px-6 mt-32 mb-20">
          <h2 className="text-4xl font-bold text-center mb-16">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <StepCard
              number="1"
              title="Submit Evidence"
              desc="Connect your wallet and submit a GitHub repo, Google Doc, Loom video, or portfolio link as proof of your skill."
            />
            <StepCard
              number="2"
              title="AI Evaluation"
              desc="Our AI evaluates your evidence against a transparent rubric. You get detailed feedback and a score (0-100)."
            />
            <StepCard
              number="3"
              title="Mint Credential"
              desc="If you pass (score ≥ 70), mint your credential as a soulbound NFT on Stellar. It's permanent and verifiable."
            />
          </div>
        </div>
      </main>
    </div>
  );
}

function StepCard({ number, title, desc }: { number: string, title: string, desc: string }) {
  return (
    <div className="p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-500/50 transition duration-300">
      <div className="w-12 h-12 rounded-full bg-purple-500/20 border border-purple-500/50 flex items-center justify-center text-purple-400 font-bold text-xl mb-4">
        {number}
      </div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-gray-400 leading-relaxed">{desc}</p>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: any, title: string, desc: string }) {
  return (
    <div className="p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-500/50 transition duration-300">
      <div className="text-purple-500 mb-4 w-10 h-10">{icon}</div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-gray-400 leading-relaxed">{desc}</p>
    </div>
  )
}
