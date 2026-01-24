"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Shield, CheckCircle, ExternalLink, Award, Loader2, AlertCircle, TrendingUp, User } from "lucide-react";
import { fetchUserCredentials } from "@/lib/stellar";
import Certificate from "@/components/Certificate";
import ScrollReveal from "@/components/ScrollReveal";

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
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/10 to-indigo-50/20 text-slate-900 relative overflow-hidden">
            {/* Animated background gradient */}
            <div className="fixed inset-0 -z-10">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-200/10 via-transparent to-transparent" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-indigo-200/10 via-transparent to-transparent" />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px]" />
            </div>

            <div className="max-w-6xl mx-auto px-6 py-8 md:py-12">
                <ScrollReveal direction="down">
                    <header className="mb-16 md:mb-20">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                            <div className="flex items-center gap-4">
                                <div className="bg-slate-900 p-2.5 rounded-2xl shadow-xl">
                                    <Shield className="w-7 h-7 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-black tracking-tight text-slate-900">EduProof <span className="text-purple-600">Verifier</span></h1>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1.5 flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        On-Chain Skill Validation Node
                                    </p>
                                </div>
                            </div>
                            <div className="hidden md:flex items-center gap-4">
                                <div className="px-5 py-2.5 bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200/50 shadow-sm text-xs font-bold text-slate-500">
                                    Status: <span className="text-emerald-600">Syncing with Mainnet</span>
                                </div>
                            </div>
                        </div>
                    </header>
                </ScrollReveal>

                <main className="max-w-4xl mx-auto">
                    {/* Search Section */}
                    <div className="mb-20 text-center">
                        <ScrollReveal direction="up" delay={0.1}>
                            <h2 className="text-5xl md:text-7xl font-black mb-8 tracking-tight text-slate-900 leading-[1.1]">
                                Verify Skill <br className="hidden md:block" />
                                <span className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">Credentials.</span>
                            </h2>
                        </ScrollReveal>

                        <ScrollReveal direction="up" delay={0.2}>
                            <p className="text-slate-500 text-lg md:text-xl font-medium mb-12 max-w-2xl mx-auto leading-relaxed">
                                Enter a Stellar wallet address to view all verifiable, tamper-proof skill credentials earned by the candidate across the ecosystem.
                            </p>
                        </ScrollReveal>

                        <ScrollReveal direction="up" delay={0.3}>
                            <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto">
                                <div className="relative group">
                                    <div className="absolute -inset-1 bg-gradient-to-r from-purple-600/20 to-indigo-600/20 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition duration-500" />
                                    <input
                                        type="text"
                                        placeholder="Stellar Wallet Address (G...)"
                                        value={address}
                                        onChange={(e) => setAddress(e.target.value)}
                                        className="relative w-full bg-white/90 backdrop-blur-xl border-2 border-slate-200/50 rounded-3xl py-6 pl-14 pr-44 text-slate-900 text-lg font-bold placeholder:text-slate-300 focus:outline-none focus:border-purple-600/50 focus:ring-4 focus:ring-purple-600/5 transition-all shadow-2xl shadow-slate-200/50"
                                    />
                                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 w-6 h-6 z-10" />
                                    <button
                                        type="submit"
                                        disabled={loading || !address}
                                        className="absolute right-3 top-3 bottom-3 bg-slate-900 hover:bg-slate-800 text-white px-10 rounded-2xl font-black text-xs tracking-widest transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-xl active:scale-95 z-20"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" strokeWidth={3} />
                                                <span>SCANNING...</span>
                                            </>
                                        ) : (
                                            <>
                                                <span>VERIFY</span>
                                                <ExternalLink className="w-4 h-4 opacity-50" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </ScrollReveal>
                    </div>

                    {/* Results Section */}
                    <div className="space-y-8 pb-32">
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-red-50/50 backdrop-blur-sm border-2 border-red-100 p-8 rounded-3xl flex items-start gap-4 text-red-900 shadow-xl"
                            >
                                <div className="p-2.5 bg-red-100 rounded-xl">
                                    <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                                </div>
                                <div>
                                    <p className="font-black text-xl mb-1">Query Error</p>
                                    <p className="font-medium text-red-600/80">{error}</p>
                                </div>
                            </motion.div>
                        )}

                        {searched && !loading && credentials.length > 0 && (
                            <div className="space-y-10">
                                <ScrollReveal direction="up">
                                    <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-8 bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl -z-0" />
                                        <div className="flex items-center gap-6 relative z-10 w-full md:w-auto">
                                            <div className="w-16 h-16 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/20">
                                                <User className="w-8 h-8 text-white" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Authenticated Wallet Identity</p>
                                                <p className="font-mono text-white text-lg font-bold truncate">{address}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 relative z-10 bg-white/5 backdrop-blur-xl px-6 py-4 rounded-2xl border border-white/10 w-full md:w-auto justify-center md:justify-start">
                                            <div className="text-center">
                                                <div className="text-3xl font-black text-white leading-none">{credentials.length}</div>
                                                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2">Verified Skills</div>
                                            </div>
                                            <div className="w-px h-10 bg-white/10 mx-4" />
                                            <div className="text-center">
                                                <div className="text-3xl font-black text-emerald-400 leading-none">100%</div>
                                                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2">Proof Validity</div>
                                            </div>
                                        </div>
                                    </div>
                                </ScrollReveal>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {credentials.map((cred, i) => (
                                        <ScrollReveal key={cred.id} direction="up" delay={0.1 + i * 0.1}>
                                            <motion.div
                                                whileHover={{ y: -8, scale: 1.02 }}
                                                className="bg-white border-2 border-slate-100/50 hover:border-purple-200 rounded-[2.5rem] p-10 transition-all group cursor-pointer shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-purple-500/10 relative overflow-hidden"
                                                onClick={() => setSelectedCert(cred)}
                                            >
                                                {/* Decorative background circle */}
                                                <div className="absolute -top-12 -right-12 w-48 h-48 bg-purple-50 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />

                                                <div className="absolute top-8 right-8 p-3 bg-purple-50 rounded-2xl opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0 border border-purple-100">
                                                    <ExternalLink className="w-5 h-5 text-purple-600" />
                                                </div>

                                                <div className="flex flex-col gap-8 relative z-10">
                                                    <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center border-2 border-slate-100 group-hover:bg-purple-600 group-hover:border-purple-600 transition-all duration-300">
                                                        <Award className="w-8 h-8 text-slate-400 group-hover:text-white transition-colors" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-3xl font-black text-slate-900 mb-4 group-hover:text-purple-600 transition-colors leading-tight">{cred.skill}</h3>
                                                        <div className="flex items-center gap-4">
                                                            <span className="bg-slate-900 text-white px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-slate-200">
                                                                {cred.level}
                                                            </span>
                                                            <div className="flex items-center gap-2 px-4 py-1.5 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-black border border-emerald-100">
                                                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                                                {cred.score}% MASTERY
                                                            </div>
                                                        </div>

                                                        <div className="mt-10 pt-10 border-t border-slate-100 flex items-center justify-between">
                                                            <div className="space-y-1">
                                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date Minted</p>
                                                                <p className="text-sm font-bold text-slate-700">{cred.date}</p>
                                                            </div>
                                                            <button className="text-[10px] font-black text-purple-600 uppercase tracking-widest bg-purple-50 px-5 py-2.5 rounded-xl hover:bg-purple-100 transition-colors border border-purple-100/50">
                                                                REVEAL PROOF
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        </ScrollReveal>
                                    ))}
                                </div>
                            </div>
                        )}

                        {searched && !loading && credentials.length === 0 && !error && (
                            <ScrollReveal direction="up">
                                <div className="text-center py-32 bg-white/50 backdrop-blur-sm rounded-[3rem] border-2 border-dashed border-slate-200">
                                    <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-8">
                                        <TrendingUp className="w-10 h-10 text-slate-300" />
                                    </div>
                                    <h3 className="text-3xl font-black text-slate-900 mb-4">No Verified Evidence Found</h3>
                                    <p className="text-slate-500 font-medium max-w-sm mx-auto leading-relaxed">
                                        This wallet address has not yet earned any skill credentials on the EduProof ledger.
                                    </p>
                                </div>
                            </ScrollReveal>
                        )}
                    </div>
                </main>
            </div>

            {/* Certificate Modal */}
            <AnimatePresence>
                {selectedCert && (
                    <Certificate
                        userName={address.slice(0, 8) + "..." + address.slice(-8)}
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
