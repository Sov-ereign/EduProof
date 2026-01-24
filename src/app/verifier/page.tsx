"use client";

import { useState } from "react";

import { Search, ShieldCheck, ExternalLink, User, AlertCircle, CheckCircle2, X, Loader2, Award, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import ScrollReveal from "@/components/ScrollReveal";

const LEVEL_COLORS: Record<string, string> = {
    Beginner: "bg-slate-900 text-white border-slate-800 shadow-lg shadow-slate-200",
    Intermediate: "bg-emerald-50 text-emerald-700 border-emerald-100",
    Advanced: "bg-blue-50 text-blue-700 border-blue-100",
    Expert: "bg-purple-600 text-white border-purple-500 shadow-lg shadow-purple-200",
    Verified: "bg-teal-50 text-teal-700 border-teal-100",
};

export default function VerifierDashboard() {
    const [search, setSearch] = useState("");
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSearch = async () => {
        if (!search.trim()) return;
        setLoading(true);
        setResult(null);
        setError("");

        try {
            const { fetchUserCredentials } = await import("@/lib/stellar");
            const credentials = await fetchUserCredentials(search.trim());

            setResult({
                address: search.trim(),
                credentials: credentials
            });
        } catch (e: any) {
            console.error(e);
            setError(e.message || "Failed to verify wallet. Please check the address format.");
        } finally {
            setLoading(false);
        }
    };

    const getLevelColor = (level: string) => {
        return LEVEL_COLORS[level] || LEVEL_COLORS.Verified;
    };


    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/10 to-indigo-50/20 text-slate-900 relative overflow-hidden">
            {/* Animated background gradient */}
            <div className="fixed inset-0 -z-10">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-200/10 via-transparent to-transparent" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-indigo-200/10 via-transparent to-transparent" />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px]" />
            </div>

            <main className="max-w-6xl mx-auto px-6 py-12 md:py-20 lg:py-24">
                <div className="text-center mb-20">
                    <ScrollReveal direction="down">
                        <div className="flex justify-center mb-8">
                            <div className="bg-slate-900 p-4 rounded-3xl shadow-2xl rotate-3">
                                <ShieldCheck className="w-12 h-12 text-white" />
                            </div>
                        </div>
                    </ScrollReveal>

                    <ScrollReveal direction="up" delay={0.1}>
                        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-8 tracking-tight text-slate-900 leading-[1.1]">
                            Verify a <br className="hidden md:block" />
                            <span className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">Candidate.</span>
                        </h1>
                    </ScrollReveal>

                    <ScrollReveal direction="up" delay={0.2}>
                        <p className="text-slate-500 text-lg md:text-xl font-medium max-w-2xl mx-auto leading-relaxed mb-12">
                            Enter a Stellar wallet address to view their on-chain, tamper-proof skill credentials.
                            <br className="hidden md:block" />
                            No login required. No trust required. No centralized gatekeepers.
                        </p>
                    </ScrollReveal>
                </div>

                <ScrollReveal direction="up" delay={0.3}>
                    <div className="relative mb-24 max-w-2xl mx-auto">
                        <div className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600/20 to-indigo-600/20 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition duration-500" />
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 w-6 h-6 z-10" />
                            <input
                                type="text"
                                placeholder="Stellar Wallet Address (G...)"
                                className="relative w-full bg-white/90 backdrop-blur-xl border-2 border-slate-200/50 rounded-3xl py-6 pl-14 pr-44 text-slate-900 text-lg font-bold placeholder:text-slate-300 focus:outline-none focus:border-purple-600/50 focus:ring-4 focus:ring-purple-600/5 transition-all shadow-2xl shadow-slate-200/50"
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    setError("");
                                }}
                                onKeyDown={(e) => e.key === 'Enter' && !loading && handleSearch()}
                            />
                            <button
                                onClick={handleSearch}
                                disabled={loading || !search.trim()}
                                className="absolute right-3 top-3 bottom-3 bg-slate-900 hover:bg-slate-800 text-white px-10 rounded-2xl font-black text-xs tracking-widest transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-xl active:scale-95 z-20"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" strokeWidth={3} />
                                        <span>QUERYING...</span>
                                    </>
                                ) : (
                                    "VERIFY"
                                )}
                            </button>
                        </div>
                    </div>
                </ScrollReveal>

                {loading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-24"
                    >
                        <div className="relative w-24 h-24 mx-auto mb-10">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                className="absolute inset-0 border-4 border-purple-100 border-t-purple-600 rounded-full shadow-lg"
                            />
                        </div>
                        <p className="text-slate-900 font-black text-2xl mb-3">Scanning Stellar Ledger...</p>
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Accessing immutable evidence pools</p>
                    </motion.div>
                )}

                {error && (
                    <ScrollReveal direction="up">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-red-50/50 backdrop-blur-sm border-2 border-red-100 p-8 rounded-3xl mb-16 flex items-start gap-6 shadow-xl max-w-2xl mx-auto"
                        >
                            <div className="bg-red-500 p-3 rounded-2xl shadow-lg">
                                <AlertCircle className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1">
                                <p className="text-red-900 font-black text-xl mb-1">Verification Failed</p>
                                <p className="text-red-600 font-medium leading-relaxed">{error}</p>
                            </div>
                            <button onClick={() => setError("")} className="text-red-400 hover:text-red-600 p-2 hover:bg-red-100 rounded-xl transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </motion.div>
                    </ScrollReveal>
                )}

                {result && (
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-12"
                    >
                        <ScrollReveal direction="up">
                            <div className="flex flex-col md:flex-row items-center justify-between gap-8 p-10 bg-white rounded-[3rem] border-2 border-slate-100/50 shadow-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-96 h-96 bg-purple-50 rounded-full blur-3xl -z-0 opacity-50 group-hover:opacity-100 transition-opacity" />

                                <div className="flex items-center gap-8 relative z-10 w-full md:w-auto">
                                    <div className="bg-slate-900 p-6 rounded-[2rem] shadow-xl">
                                        <User className="w-10 h-10 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Candidate On-Chain Identity</p>
                                        <p className="font-mono text-purple-600 text-xl lg:text-2xl font-bold truncate tracking-tight">{result.address}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-10 relative z-10 bg-slate-50/80 backdrop-blur-sm px-8 py-6 rounded-3xl border border-slate-100 w-full md:w-auto justify-center md:justify-start">
                                    <div className="text-center">
                                        <div className="text-4xl lg:text-5xl font-black text-slate-900 leading-none">{result.credentials.length}</div>
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-3">Verified Skills</div>
                                    </div>
                                    <div className="w-px h-12 bg-slate-200" />
                                    <div className="flex flex-col items-center gap-1">
                                        <div className="flex -space-x-3">
                                            {[1, 2, 3].map(i => (
                                                <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500">
                                                    ID
                                                </div>
                                            ))}
                                        </div>
                                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-2 flex items-center gap-1">
                                            <CheckCircle2 className="w-3 h-3" /> SECURED
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </ScrollReveal>

                        {result.credentials.length === 0 ? (
                            <ScrollReveal direction="up">
                                <div className="text-center py-32 bg-white/50 backdrop-blur-sm rounded-[3rem] border-2 border-dashed border-slate-200">
                                    <ShieldCheck className="w-24 h-24 mx-auto mb-8 text-slate-200" />
                                    <h3 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">No Credentials Found</h3>
                                    <p className="text-slate-500 font-medium max-w-sm mx-auto leading-relaxed text-lg">
                                        This wallet identity has no verified skill credentials recorded on the ledger yet.
                                    </p>
                                </div>
                            </ScrollReveal>
                        ) : (
                            <div className="space-y-10">
                                <ScrollReveal direction="up">
                                    <div className="flex items-center justify-between mb-2 px-4">
                                        <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Verified Proofs</h2>
                                        <div className="px-5 py-2 bg-emerald-500 text-white rounded-full text-[10px] font-black tracking-widest flex items-center gap-2 shadow-lg shadow-emerald-200">
                                            <CheckCircle2 className="w-4 h-4" /> ON-CHAIN VERIFIED
                                        </div>
                                    </div>
                                </ScrollReveal>

                                <div className="grid gap-8">
                                    {result.credentials.map((cred: any, i: number) => (
                                        <ScrollReveal key={cred.id} direction="up" delay={0.1 + i * 0.1}>
                                            <motion.div
                                                whileHover={{ y: -8 }}
                                                className="bg-white border-2 border-slate-100 p-10 rounded-[3rem] hover:border-purple-200 transition-all duration-500 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-purple-500/10 group relative overflow-hidden"
                                            >
                                                <div className="absolute -top-12 -right-12 w-64 h-64 bg-slate-50 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />

                                                <div className="flex flex-col md:flex-row justify-between items-start gap-8 relative z-10">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-4 mb-6">
                                                            <div className="w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center shadow-xl group-hover:rotate-12 transition-transform">
                                                                <Award className="w-8 h-8 text-white" />
                                                            </div>
                                                            <h3 className="text-4xl font-black text-slate-900 group-hover:text-purple-600 transition-colors tracking-tight">{cred.skill}</h3>
                                                        </div>
                                                        <div className="flex flex-wrap items-center gap-3">
                                                            <span className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest border-2 ${getLevelColor(cred.level)}`}>
                                                                {cred.level}
                                                            </span>
                                                            <span className="px-5 py-2 bg-slate-50 text-slate-400 rounded-xl text-xs font-black tracking-widest border border-slate-100">
                                                                SCORE: {cred.score}/100
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="text-left md:text-right bg-slate-900 p-8 rounded-[2.50rem] border-2 border-slate-800 min-w-[200px] shadow-2xl relative overflow-hidden">
                                                        <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-2xl" />
                                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 relative z-10 text-center md:text-right">Mastery Benchmark</p>
                                                        <div className="text-6xl font-black text-white mb-2 relative z-10 text-center md:text-right">{cred.score}<span className="text-2xl text-slate-600 ml-1">%</span></div>
                                                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden relative z-10">
                                                            <motion.div
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${cred.score}%` }}
                                                                transition={{ duration: 1.5, delay: 0.5 }}
                                                                className="h-full bg-gradient-to-r from-purple-500 to-indigo-500"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap items-center gap-8 text-[10px] font-black border-t border-slate-100 pt-10 mt-10 relative z-10 uppercase tracking-widest">
                                                    <span className="flex items-center gap-3 text-slate-400 bg-slate-50 px-4 py-2 rounded-xl">
                                                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                                        LOCKED ON LEDGER: {cred.date}
                                                    </span>

                                                    <div className="flex items-center gap-4 md:ml-auto">
                                                        {cred.evidence && (
                                                            <a
                                                                href={cred.evidence}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="flex items-center gap-2 text-purple-600 hover:text-white hover:bg-purple-600 border border-purple-200 px-6 py-3 rounded-2xl transition-all shadow-lg shadow-purple-50"
                                                            >
                                                                VIEW EVIDENCE <ExternalLink className="w-4 h-4" />
                                                            </a>
                                                        )}
                                                        {cred.txHash && (
                                                            <a
                                                                href={`https://stellar.expert/explorer/testnet/tx/${cred.txHash}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="flex items-center gap-2 text-slate-900 hover:text-white hover:bg-slate-900 border border-slate-200 px-6 py-3 rounded-2xl transition-all shadow-lg shadow-slate-100"
                                                            >
                                                                TX PROOF <ExternalLink className="w-4 h-4" />
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        </ScrollReveal>
                                    ))}
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </main>
        </div>
    );
}
