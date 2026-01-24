"use client";

import Link from "next/link";
import { ShieldCheck, Github, Twitter, Linkedin } from "lucide-react";

export default function Footer() {
    return (
        <footer className="bg-black border-t border-white/10 text-gray-400 py-12 relative z-10">
            <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
                {/* Brand */}
                <div className="col-span-1 md:col-span-1">
                    <div className="flex items-center gap-2 mb-4">
                        <ShieldCheck className="w-6 h-6 text-purple-500" />
                        <span className="text-lg font-bold text-white">EduProof Zero</span>
                    </div>
                    <p className="text-sm leading-relaxed mb-4">
                        Verifiable skill credentials for an AI-generated world. Built on Stellar.
                    </p>
                    <div className="flex gap-4">
                        <Link href="https://github.com" target="_blank" className="hover:text-white transition">
                            <Github className="w-5 h-5" />
                        </Link>
                        <Link href="https://twitter.com" target="_blank" className="hover:text-white transition">
                            <Twitter className="w-5 h-5" />
                        </Link>
                    </div>
                </div>

                {/* Links */}
                <div>
                    <h4 className="text-white font-semibold mb-4">Platform</h4>
                    <ul className="space-y-2 text-sm">
                        <li><Link href="/" className="hover:text-purple-400 transition">Home</Link></li>
                        <li><Link href="/student" className="hover:text-purple-400 transition">Prove Skill</Link></li>
                        <li><Link href="/verifier" className="hover:text-purple-400 transition">Verify Wallet</Link></li>
                    </ul>
                </div>

                <div>
                    <h4 className="text-white font-semibold mb-4">Resources</h4>
                    <ul className="space-y-2 text-sm">
                        <li><Link href="/#how-it-works" className="hover:text-purple-400 transition">Documentation</Link></li>
                        <li><Link href="#" className="hover:text-purple-400 transition">GitHub Repo</Link></li>
                        <li><Link href="#" className="hover:text-purple-400 transition">Smart Contract</Link></li>
                    </ul>
                </div>

                <div>
                    <h4 className="text-white font-semibold mb-4">Legal</h4>
                    <ul className="space-y-2 text-sm">
                        <li><Link href="#" className="hover:text-purple-400 transition">Privacy Policy</Link></li>
                        <li><Link href="#" className="hover:text-purple-400 transition">Terms of Service</Link></li>
                    </ul>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 mt-12 pt-8 border-t border-white/5 text-center text-xs text-gray-600">
                © {new Date().getFullYear()} EduProof Zero. All rights reserved.
            </div>
        </footer>
    );
}
