"use client";

import Link from "next/link";
import { ShieldCheck, Cpu, Code } from "lucide-react";
import { motion } from "framer-motion";

import AnimatedHeading from "../components/text-generate-effect";

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-slate-50 text-slate-900 selection:bg-purple-500 selection:text-white overflow-hidden">

      {/* ================= BACKGROUND ================= */}
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-purple-100 via-slate-50 to-slate-50" />
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-200/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-200/20 blur-[120px] rounded-full" />
      </div>
      {/* ============================================== */}



      {/* ================= HERO ================= */}
      <main className="pt-40 pb-32 relative z-10">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="inline-block px-4 py-1.5 mb-6 text-sm font-bold tracking-wider text-purple-600 uppercase bg-purple-50 rounded-full border border-purple-100">
              Future of Skill Verification
            </div>

            <AnimatedHeading text="Skill Credentials That Can’t Be Faked." />

            <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mt-8 mb-12 leading-relaxed font-medium">
              EduProof Zero issues tamper-proof, wallet-bound credentials backed by
              real evidence. Verified by AI and stored permanently on Stellar
              blockchain.
            </p>

            <div className="flex flex-col md:flex-row items-center justify-center gap-6">
              <Link href="/student">
                <button className="h-14 px-10 rounded-full bg-purple-600 hover:bg-purple-700 text-white font-bold transition shadow-lg shadow-purple-200 hover:shadow-purple-300 transform hover:-translate-y-1">
                  Prove Your Skill
                </button>
              </Link>

              <Link href="/verifier">
                <button className="h-14 px-10 rounded-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-900 font-bold transition shadow-sm hover:shadow-md transform hover:-translate-y-1">
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
          className="max-w-7xl mx-auto px-6 mt-40 mb-32"
        >
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              How It Works
            </h2>
            <div className="w-24 h-1.5 bg-purple-600 mx-auto rounded-full" />
          </div>

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
    <div className="relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-8 hover:border-purple-200 transition-all duration-300 group shadow-sm hover:shadow-xl hover:-translate-y-2">
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
        <div className="bg-purple-600 w-24 h-24 rounded-full blur-2xl" />
      </div>

      <div className="relative z-10">
        <div className="text-purple-600 mb-6 w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors duration-300">
          {icon}
        </div>
        <h3 className="text-xl font-bold mb-4 text-slate-900">{title}</h3>
        <p className="text-slate-500 leading-relaxed text-sm font-medium">{desc}</p>
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
    <div className="relative p-8 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all group">
      <div className="absolute -top-4 -left-4 w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-bold text-xl shadow-lg shadow-purple-200 group-hover:scale-110 transition-transform">
        {number}
      </div>
      <div className="mt-4">
        <h3 className="text-xl font-bold mb-4 text-slate-900">{title}</h3>
        <p className="text-slate-500 leading-relaxed text-sm font-medium">{desc}</p>
      </div>
    </div>
  );
}
