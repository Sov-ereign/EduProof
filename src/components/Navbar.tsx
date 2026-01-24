"use client";

import Link from "next/link";
import { ShieldCheck, ArrowRight } from "lucide-react";

export default function Navbar() {
    return (
        <nav className="fixed w-full z-50 top-0 left-0 right-0 py-4 px-6 md:px-12 flex justify-center">
            <div className="max-w-7xl w-full h-16 glass-dark rounded-2xl flex items-center justify-between px-6 md:px-8 border border-white/10 shadow-2xl">
                <div className="flex items-center gap-6">
                    <Link href="/" className="flex items-center gap-2.5 group transition-all">
                        <div className="bg-white p-1.5 rounded-lg shadow-sm group-hover:scale-110 transition-transform">
                            <ShieldCheck className="w-5 h-5 text-black" />
                        </div>
                        <span className="text-xl font-black tracking-tight text-white">
                            EduProof<span className="text-zinc-500 font-medium">.</span>
                        </span>
                    </Link>

                    <div className="hidden md:flex items-center gap-8 ml-8">
                        <Link href="/#features" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors relative group">
                            Features
                            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-white transition-all group-hover:w-full" />
                        </Link>
                        <Link href="/#how-it-works" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors relative group">
                            Protocol
                            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-white transition-all group-hover:w-full" />
                        </Link>
                        <Link href="/pricing" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors relative group">
                            Pricing
                            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-white transition-all group-hover:w-full" />
                        </Link>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <Link href="/verifier">
                        <button className="hidden sm:block px-4 py-2 text-sm font-bold text-zinc-400 hover:text-white transition-colors">
                            Verifier
                        </button>
                    </Link>
                    <Link href="/student">
                        <button className="bg-white text-black px-6 py-2.5 rounded-xl text-sm font-black hover:bg-zinc-200 transition-all flex items-center gap-2 active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                            Launch <ArrowRight className="w-4 h-4" />
                        </button>
                    </Link>
                </div>
            </div>
        </nav>
    );
}
