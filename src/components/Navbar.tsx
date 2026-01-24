"use client";

import Link from "next/link";
import { ShieldCheck, ArrowRight } from "lucide-react";

export default function Navbar() {
    return (
        <nav className="fixed w-full z-50 bg-white/70 backdrop-blur-lg border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition">
                        <div className="bg-purple-600 p-1.5 rounded-lg shadow-sm">
                            <ShieldCheck className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xl font-bold tracking-tight text-slate-900">
                            EduProof <span className="text-purple-600">Zero</span>
                        </span>
                    </Link>
                </div>

                <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
                    <Link href="/#features" className="hover:text-purple-600 transition">
                        Features
                    </Link>
                    <Link href="/#how-it-works" className="hover:text-purple-600 transition">
                        How it Works
                    </Link>
                </div>

                <div className="flex items-center gap-4">
                    <Link href="/verifier">
                        <button className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:text-purple-600 transition">
                            Verifier Mode
                        </button>
                    </Link>
                    <Link href="/student">
                        <button className="bg-purple-600 text-white px-6 py-2.5 rounded-full text-sm font-bold hover:bg-purple-700 transition flex items-center gap-2 shadow-md shadow-purple-200 hover:shadow-lg hover:shadow-purple-300 transform active:scale-95">
                            Launch App <ArrowRight className="w-4 h-4" />
                        </button>
                    </Link>
                </div>
            </div>
        </nav>
    );
}
