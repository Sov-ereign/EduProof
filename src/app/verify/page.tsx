"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Shield, CheckCircle, ExternalLink, Award, Loader2, AlertCircle } from "lucide-react";
import { fetchUserCredentials } from "@/lib/stellar";
import Certificate from "@/components/Certificate";

export default function VerifyPage() {
    const [address, setAddress] = useState("");
    const [loading, setLoading] = useState(false);
    const [credentials, setCredentials] = useState<any[]>([]);
    const [searched, setSearched] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedCert, setSelectedCert] = useState<any>(null);

    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!address.trim()) return;

        setLoading(true);
        setError(null);
        setCredentials([]);
        setSearched(true);

        try {
            // Fetch verify credentials from on-chain history
            const results = await fetchUserCredentials(address);
            setCredentials(results);

            if (results.length === 0) {
                setError("No credentials found for this wallet address.");
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Failed to fetch credentials. Please check the address.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 p-6 md:p-12">
            <header className="mb-12 border-b border-slate-200 pb-8">
                <div className="max-w-6xl mx-auto flex items-center gap-4">
                    <div className="bg-purple-600 p-2 rounded-xl shadow-lg shadow-purple-100">
                        <Shield className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-slate-900">EduProof <span className="text-purple-600">Verifier</span></h1>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">On-Chain Skill Validation</p>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto">
                {/* Search Section */}
                <div className="mb-20 text-center">
                    <h2 className="text-5xl md:text-6xl font-black mb-6 tracking-tight text-slate-900">
                        Verify Skill Credentials.
                    </h2>
                    <p className="text-slate-500 text-lg font-medium mb-12 max-w-2xl mx-auto leading-relaxed">
                        Enter a Stellar wallet address to view all verifiable, tamper-proof skill credentials earned by the candidate across the ecosystem.
                    </p>

                    <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto">
                        <div className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition duration-1000"></div>
                            <input
                                type="text"
                                placeholder="Stellar Wallet Address (G...)"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                className="relative w-full bg-white border-2 border-slate-100 rounded-[1.5rem] py-6 pl-14 pr-40 text-slate-900 text-lg font-bold placeholder:text-slate-300 focus:outline-none focus:border-purple-600 transition-all shadow-xl shadow-slate-200/50"
                            />
                            <Search className="absolute left-6 top-7 text-slate-400 w-6 h-6" />
                            <button
                                type="submit"
                                disabled={loading || !address}
                                className="absolute right-3 top-3 bottom-3 bg-slate-900 hover:bg-slate-800 text-white px-8 rounded-xl font-black text-sm tracking-widest transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg active:scale-95"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" strokeWidth={3} /> : "VERIFY"}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Results Section */}
                <div className="space-y-8">
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-red-50 border-2 border-red-100 p-6 rounded-[1.5rem] flex items-start gap-4 text-red-900"
                        >
                            <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
                            <div>
                                <p className="font-black text-lg">Query Error</p>
                                <p className="font-medium text-red-600/80">{error}</p>
                            </div>
                        </motion.div>
                    )}

                    {credentials.length > 0 && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between px-2">
                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-widest">Verified Credentials</h3>
                                <span className="bg-emerald-50 text-emerald-700 font-black text-[10px] px-3 py-1 rounded-full border border-emerald-100">
                                    {credentials.length} FOUND
                                </span>
                            </div>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="grid grid-cols-1 md:grid-cols-2 gap-6"
                            >
                                {credentials.map((cred, i) => (
                                    <motion.div
                                        key={cred.id}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: i * 0.1 }}
                                        className="bg-white border-2 border-slate-100 hover:border-purple-200 rounded-[2rem] p-8 transition-all group cursor-pointer shadow-sm hover:shadow-xl relative overflow-hidden"
                                        onClick={() => setSelectedCert(cred)}
                                    >
                                        <div className="absolute top-6 right-6 p-3 bg-slate-50 rounded-xl opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                                            <ExternalLink className="w-5 h-5 text-purple-600" />
                                        </div>

                                        <div className="flex flex-col gap-6">
                                            <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center border-2 border-slate-100 group-hover:bg-purple-50 group-hover:border-purple-100 transition-colors">
                                                <Award className="w-8 h-8 text-slate-400 group-hover:text-purple-600" />
                                            </div>
                                            <div>
                                                <h3 className="text-2xl font-black text-slate-900 mb-2 group-hover:text-purple-600 transition-colors">{cred.skill}</h3>
                                                <div className="flex flex-wrap items-center gap-3">
                                                    <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider border border-indigo-100">
                                                        {cred.level}
                                                    </span>
                                                    <span className="text-slate-300 font-black text-xs">SCORE: {cred.score}/100</span>
                                                </div>
                                                <div className="mt-6 pt-6 border-t border-slate-50 flex items-center justify-between">
                                                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                                                        MINTED: {cred.date}
                                                    </span>
                                                    <span className="text-[10px] font-black text-purple-600 group-hover:underline">VIEW CERTIFICATE</span>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </motion.div>
                        </div>
                    )}
                </div>
            </main>

            {/* Certificate Modal */}
            <AnimatePresence>
                {selectedCert && (
                    <Certificate
                        userName={address.slice(0, 4) + "..." + address.slice(-4)} // Anonymized
                        skill={selectedCert.skill}
                        level={selectedCert.level}
                        score={selectedCert.score}
                        date={selectedCert.date}
                        transactionHash={selectedCert.txHash || selectedCert.id}
                        explorerUrl={selectedCert.evidence}
                        onClose={() => setSelectedCert(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
