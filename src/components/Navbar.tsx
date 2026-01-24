"use client";

import Link from "next/link";
import { ShieldCheck, ArrowRight } from "lucide-react";

export default function Navbar() {
    return (
        <nav className="fixed w-full z-50 bg-black/50 backdrop-blur-md border-b border-white/10">
            <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition">
                        <ShieldCheck className="w-8 h-8 text-purple-500" />
                        <span className="text-xl font-bold tracking-tight text-white">
                            EduProof Zero
                        </span>
                    </Link>
                </div>

                <div className="hidden md:flex gap-6 text-sm font-medium text-gray-400">
                    <Link href="/#features" className="hover:text-white transition">
                        Features
                    </Link>
                    <Link href="/#how-it-works" className="hover:text-white transition">
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
    );
}
