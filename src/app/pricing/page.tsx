"use client";

import { Check, ShieldCheck, Zap, Globe, Lock, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import ScrollReveal from "@/components/ScrollReveal";

const features = [
    {
        icon: <ShieldCheck className="w-5 h-5 text-emerald-600" />,
        title: "Blockchain Verification",
        description: "Every credential check is recorded on the Stellar ledger for immutable proof."
    },
    {
        icon: <Zap className="w-5 h-5 text-amber-600" />,
        title: "Instant Access",
        description: "Unlock all candidate profiles immediately after successful payment."
    },
    {
        icon: <Globe className="w-5 h-5 text-blue-600" />,
        title: "Global Protocol",
        description: "Standardized verification across all supported educational institutions."
    },
    {
        icon: <Lock className="w-5 h-5 text-purple-600" />,
        title: "Encrypted Data",
        description: "Enterprise-grade encryption for all sensitive verifier and candidate info."
    }
];

export default function PricingPage() {
    return (
        <main className="min-h-screen bg-zinc-50 text-zinc-950 selection:bg-zinc-900 selection:text-zinc-50">
            {/* Background decoration */}
            <div className="fixed inset-0 -z-10 bg-[radial-gradient(45%_45%_at_50%_50%,#fafafa_0%,#f4f4f5_100%)]" />
            <div className="fixed inset-0 -z-10">
                <div className="absolute top-[20%] left-[10%] w-[30%] h-[30%] bg-zinc-200/40 blur-[120px] rounded-full" />
                <div className="absolute bottom-[20%] right-[10%] w-[30%] h-[30%] bg-zinc-200/40 blur-[120px] rounded-full" />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:32px_32px]" />
            </div>

            <section className="pt-48 pb-32 px-6">
                <div className="max-w-7xl mx-auto text-center">
                    <ScrollReveal direction="up">
                        <h1 className="text-6xl md:text-8xl lg:text-9xl font-black mb-10 tracking-tight text-zinc-950 leading-[0.9]">
                            Clear. Powerful<span className="text-zinc-400">.</span><br />
                            <span className="text-zinc-400">On-Chain.</span>
                        </h1>
                        <p className="text-lg md:text-xl text-zinc-500 max-w-xl mx-auto mt-10 mb-20 leading-relaxed font-medium">
                            One simple plan for enterprise verifiers. Unlimited protocol access, secured by the Stellar blockchain.
                        </p>
                    </ScrollReveal>

                    <div className="grid lg:grid-cols-2 gap-20 items-center">
                        {/* Left side: Features list */}
                        <div className="text-left space-y-12">
                            {features.map((feature, i) => (
                                <ScrollReveal key={i} direction="right" delay={i * 0.1}>
                                    <div className="flex gap-6 group">
                                        <div className="w-14 h-14 rounded-2xl bg-white border border-zinc-200 flex items-center justify-center shrink-0 group-hover:border-zinc-300 group-hover:shadow-lg transition-all">
                                            {feature.icon}
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold mb-2 text-zinc-950">{feature.title}</h3>
                                            <p className="text-zinc-500 text-sm leading-relaxed font-medium">{feature.description}</p>
                                        </div>
                                    </div>
                                </ScrollReveal>
                            ))}
                        </div>

                        {/* Right side: Pricing Card */}
                        <ScrollReveal direction="left">
                            <div className="bg-white rounded-[3rem] p-12 md:p-16 border border-zinc-200 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-80 h-80 bg-zinc-100 blur-[120px] rounded-full -mr-40 -mt-40 transition-colors" />

                                <div className="relative z-10 text-left">
                                    <span className="inline-block px-4 py-1.5 rounded-full bg-zinc-950 text-white text-[10px] font-black tracking-[0.2em] mb-8 uppercase">
                                        Protocol Access
                                    </span>

                                    <h2 className="text-3xl font-black mb-2 text-zinc-950">Verifier Pro</h2>
                                    <div className="flex items-baseline gap-2 mb-10">
                                        <span className="text-7xl font-black tracking-tighter text-zinc-950">$30</span>
                                        <span className="text-zinc-400 font-bold uppercase tracking-widest text-xs">/ Month</span>
                                    </div>

                                    <ul className="space-y-5 mb-12">
                                        {[
                                            "Unlimited Candidate Search",
                                            "Instant Certificate Protocol Access",
                                            "On-Chain Billing History",
                                            "Verification Proof Recording",
                                            "Priority Ledger Indexing",
                                            "24/7 Protocol Support"
                                        ].map((item, i) => (
                                            <li key={i} className="flex items-center gap-4 text-sm font-bold text-zinc-600">
                                                <div className="w-6 h-6 rounded-full bg-emerald-50 flex items-center justify-center">
                                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                                </div>
                                                {item}
                                            </li>
                                        ))}
                                    </ul>

                                    <Link href="/verifier">
                                        <button className="h-16 w-full bg-zinc-950 hover:bg-zinc-800 text-white rounded-2xl font-black text-sm tracking-widest transition-all shadow-2xl active:scale-95 flex items-center justify-center gap-3">
                                            UPGRADE NOW <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                                        </button>
                                    </Link>

                                    <p className="mt-8 text-[10px] font-black text-zinc-300 uppercase tracking-[0.2em] text-center">
                                        No hidden fees • Cancel anytime
                                    </p>
                                </div>
                            </div>
                        </ScrollReveal>
                    </div>
                </div>
            </section>
        </main>
    );
}
