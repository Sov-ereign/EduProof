"use client";

import Link from "next/link";
import { ShieldCheck, Github, Twitter, Linkedin } from "lucide-react";

export default function Footer() {
    return (
        <footer className="bg-zinc-950 text-zinc-500 py-24 relative z-10 border-t border-white/5">
            <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-16 md:gap-12">
                {/* Brand */}
                <div className="col-span-1 md:col-span-1">
                    <div className="flex items-center gap-2.5 mb-8 group cursor-default">
                        <div className="bg-white p-1.5 rounded-lg">
                            <ShieldCheck className="w-5 h-5 text-black" />
                        </div>
                        <span className="text-xl font-black text-white tracking-tight">EduProof<span className="text-zinc-500">.</span></span>
                    </div>
                    <p className="text-sm leading-relaxed mb-8 max-w-xs font-medium text-zinc-400">
                        The definitive standard for cryptographic skill verification.
                        Backed by Stellar and verified by neural reasoning.
                    </p>
                    <div className="flex gap-4">
                        <Link href="https://github.com/Sov-ereign/PresentX" target="_blank" className="hover:bg-white hover:text-black p-2.5 rounded-xl transition-all border border-zinc-800 text-zinc-400 bg-zinc-900/50">
                            <Github className="w-5 h-5" />
                        </Link>
                        <Link href="https://twitter.com/_Sov_ereign" target="_blank" className="hover:bg-white hover:text-black p-2.5 rounded-xl transition-all border border-zinc-800 text-zinc-400 bg-zinc-900/50">
                            <Twitter className="w-5 h-5" />
                        </Link>
                    </div>
                </div>

                {/* Links */}
                <div>
                    <h4 className="text-white font-bold mb-8 text-xs uppercase tracking-[0.2em]">Platform</h4>
                    <ul className="space-y-4 text-sm font-medium">
                        <li><Link href="/" className="hover:text-white transition-colors">Network Home</Link></li>
                        <li><Link href="/student" className="hover:text-white transition-colors">Proof Pipeline</Link></li>
                        <li><Link href="/verifier" className="hover:text-white transition-colors">Verification Node</Link></li>
                    </ul>
                </div>

                <div>
                    <h4 className="text-white font-bold mb-8 text-xs uppercase tracking-[0.2em]">Resources</h4>
                    <ul className="space-y-4 text-sm font-medium">
                        <li><Link href="/docs" className="hover:text-white transition-colors">Documentation</Link></li>
                        <li><Link href="https://github.com/Sov-ereign/PresentX" target="_blank" className="hover:text-white transition-colors">Source Code</Link></li>
                        <li><Link href="/smart-contract" className="hover:text-white transition-colors">Ledger Protocol</Link></li>
                    </ul>
                </div>

                <div>
                    <h4 className="text-white font-bold mb-8 text-xs uppercase tracking-[0.2em]">Compliance</h4>
                    <ul className="space-y-4 text-sm font-medium">
                        <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Privacy</Link></li>
                        <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Protocol</Link></li>
                    </ul>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 mt-24 pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
                <p>© {new Date().getFullYear()} EduProof Protocol. Built on Stellar.</p>
                <div className="flex gap-8">
                    <span className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-emerald-500" /> Mainnet Live</span>
                    <span className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-zinc-700" /> v0.1.0-alpha</span>
                </div>
            </div>
        </footer>
    );
}
