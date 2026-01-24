"use client";

import Link from "next/link";
import { ShieldCheck, Cpu, Code, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

import AnimatedHeading from "../components/text-generate-effect";

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-zinc-50 text-zinc-950 selection:bg-zinc-900 selection:text-zinc-50 overflow-hidden">
      {/* Background decoration */}
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(45%_45%_at_50%_50%,#fafafa_0%,#f4f4f5_100%)]" />
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-[20%] left-[10%] w-[30%] h-[30%] bg-zinc-200/40 blur-[120px] rounded-full" />
        <div className="absolute bottom-[20%] right-[10%] w-[30%] h-[30%] bg-zinc-200/40 blur-[120px] rounded-full" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:32px_32px]" />
      </div>

      <main className="pt-48 pb-32 relative z-10">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-10 text-[10px] font-black tracking-[0.2em] text-zinc-500 uppercase bg-white border border-zinc-200 rounded-full shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-900 animate-pulse" />
              Protocol v0.1.0-alpha
            </div>

            <h1 className="text-6xl md:text-8xl lg:text-9xl font-black mb-10 tracking-tight text-zinc-950 leading-[0.9]">
              Skill Proof<span className="text-zinc-400">.</span><br />
              <span className="text-zinc-400 text-5xl md:text-7xl lg:text-8xl font-black">Without Trust.</span>
            </h1>

            <p className="text-lg md:text-xl text-zinc-500 max-w-xl mx-auto mt-10 mb-14 leading-relaxed font-medium">
              The definitive verifiable credential protocol.
              Powered by AI, secured on Stellar, and bound to your cryptographic identity.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link href="/student">
                <button className="h-14 px-10 rounded-2xl bg-zinc-950 hover:bg-zinc-800 text-white font-black text-sm tracking-widest transition-all shadow-2xl active:scale-95 flex items-center gap-3">
                  ACCESS PIPELINE <ArrowRight className="w-4 h-4" />
                </button>
              </Link>

              <Link href="/verifier">
                <button className="h-14 px-10 rounded-2xl bg-white border border-zinc-200 hover:border-zinc-300 text-zinc-950 font-black text-sm tracking-widest transition-all shadow-sm active:scale-95">
                  VALIDATION NODE
                </button>
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Features SECTION */}
        <section id="features" className="max-w-7xl mx-auto px-6 mt-64">
          <div className="text-center mb-24">
            <h2 className="text-xs font-black text-zinc-400 uppercase tracking-[0.3em] mb-4">Core Infrastructure</h2>
            <h3 className="text-4xl md:text-5xl font-black text-zinc-950 tracking-tight">System Capabilities</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <FeatureCard
              icon={<Cpu className="w-6 h-6" />}
              title="Neural Validation"
              desc="Advanced AI agents evaluate your code architecture and decision making against professional standards."
            />
            <FeatureCard
              icon={<Code className="w-6 h-6" />}
              title="Soulbound Proof"
              desc="Credentials are minted as cryptographic attestations on Stellar, forever linked to your wallet."
            />
            <FeatureCard
              icon={<ShieldCheck className="w-6 h-6" />}
              title="Zero-Knowledge"
              desc="Verify skills without revealing sensitive repository data or access keys to third parties."
            />
          </div>
        </section>

        {/* WORKFLOW SECTION */}
        <section id="how-it-works" className="max-w-4xl mx-auto px-6 mt-64 mb-32">
          <div className="text-center mb-24">
            <h2 className="text-xs font-black text-zinc-400 uppercase tracking-[0.3em] mb-4">Protocol Workflow</h2>
            <h3 className="text-4xl md:text-5xl font-black text-zinc-950 tracking-tight">How It Operates</h3>
          </div>

          <div className="space-y-12">
            <StepRow
              number="01"
              title="Evidence Ingestion"
              desc="Connect your digital identity and provide evidence of work via GitHub or Portfolio."
            />
            <StepRow
              number="02"
              title="Computational Review"
              desc="AI agents conduct a rigorous evaluation of the provided evidence, generating a performance delta."
            />
            <StepRow
              number="03"
              title="Attestation Minting"
              desc="Upon passing the benchmark, a verifiable proof is recorded on the Stellar ledger."
            />
          </div>
        </section>
      </main>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: any; title: string, desc: string }) {
  return (
    <div className="group bg-white border border-zinc-200 p-10 rounded-[2.5rem] hover:border-zinc-950 transition-all duration-500 shadow-sm relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-zinc-50 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="relative z-10">
        <div className="bg-zinc-50 w-14 h-14 rounded-2xl flex items-center justify-center mb-8 border border-zinc-100 group-hover:bg-zinc-950 group-hover:text-white transition-all duration-300">
          {icon}
        </div>
        <h4 className="text-2xl font-black text-zinc-950 mb-4 tracking-tight">{title}</h4>
        <p className="text-zinc-500 font-medium leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function StepRow({ number, title, desc }: { number: string; title: string; desc: string }) {
  return (
    <div className="flex flex-col md:flex-row gap-8 md:items-center p-8 bg-white border border-zinc-200 rounded-[2rem] hover:shadow-xl transition-all group">
      <div className="text-4xl font-black text-zinc-200 group-hover:text-zinc-950 transition-colors duration-500 md:w-24 shrink-0">
        {number}
      </div>
      <div className="flex-1">
        <h4 className="text-2xl font-black text-zinc-950 mb-2 tracking-tight">{title}</h4>
        <p className="text-zinc-500 font-medium leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}
