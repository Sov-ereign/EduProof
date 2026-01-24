"use client";

import Link from "next/link";
import { ShieldCheck, Github, Twitter, Linkedin } from "lucide-react";

export default function Footer() {
    return (
        <footer className="bg-slate-50 border-t border-slate-200 text-slate-500 py-16 relative z-10">
            <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
                {/* Brand */}
                <div className="col-span-1 md:col-span-1">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="bg-purple-600 p-1 rounded-lg">
                            <ShieldCheck className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xl font-bold text-slate-900">EduProof</span>
                    </div>
                    <p className="text-sm leading-relaxed mb-6">
                        Verifiable skill credentials for an AI-generated world. Built with trust on Stellar.
                    </p>
                    <div className="flex gap-4">
                        <Link href="https://github.com" target="_blank" className="hover:text-purple-600 transition bg-white p-2 rounded-full shadow-sm border border-slate-200">
                            <Github className="w-5 h-5" />
                        </Link>
                        <Link href="https://twitter.com" target="_blank" className="hover:text-purple-600 transition bg-white p-2 rounded-full shadow-sm border border-slate-200">
                            <Twitter className="w-5 h-5" />
                        </Link>
                    </div>
                </div>

                {/* Links */}
                <div>
                    <h4 className="text-slate-900 font-bold mb-6 text-sm uppercase tracking-wider">Platform</h4>
                    <ul className="space-y-4 text-sm font-medium">
                        <li><Link href="/" className="hover:text-purple-600 transition">Home</Link></li>
                        <li><Link href="/student" className="hover:text-purple-600 transition">Prove Skill</Link></li>
                        <li><Link href="/verifier" className="hover:text-purple-600 transition">Verify Wallet</Link></li>
                    </ul>
                </div>

                <div>
                    <h4 className="text-slate-900 font-bold mb-6 text-sm uppercase tracking-wider">Resources</h4>
                    <ul className="space-y-4 text-sm font-medium">
                        <li><Link href="/#how-it-works" className="hover:text-purple-600 transition">Documentation</Link></li>
                        <li><Link href="#" className="hover:text-purple-600 transition">GitHub Repo</Link></li>
                        <li><Link href="#" className="hover:text-purple-600 transition">Smart Contract</Link></li>
                    </ul>
                </div>

                <div>
                    <h4 className="text-slate-900 font-bold mb-6 text-sm uppercase tracking-wider">Legal</h4>
                    <ul className="space-y-4 text-sm font-medium">
                        <li><Link href="#" className="hover:text-purple-600 transition">Privacy Policy</Link></li>
                        <li><Link href="#" className="hover:text-purple-600 transition">Terms of Service</Link></li>
                    </ul>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 mt-16 pt-8 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-medium text-slate-400">
                <p>© {new Date().getFullYear()} EduProof Zero. All rights reserved.</p>
                <div className="flex gap-6">
                    <span>Powered by Stellar</span>
                    <span>AI Verified</span>
                </div>
            </div>
        </footer>
    );
}
