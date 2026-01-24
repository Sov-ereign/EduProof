"use client";

import { useState } from "react";
import { Search, ShieldCheck, ExternalLink, User, AlertCircle, CheckCircle2, X, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

const LEVEL_COLORS: Record<string, string> = {
    Beginner: "bg-blue-50 text-blue-700 border-blue-100",
    Intermediate: "bg-amber-50 text-amber-700 border-amber-100",
    Advanced: "bg-orange-50 text-orange-700 border-orange-100",
    Expert: "bg-purple-50 text-purple-700 border-purple-100",
    Verified: "bg-emerald-50 text-emerald-700 border-emerald-100",
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
        <div className="min-h-screen bg-slate-50 text-slate-900 p-6 md:p-12">
            {/* <header className="flex justify-between items-center mb-12 border-b border-slate-200 pb-8">
                <div className="flex items-center gap-4">
                    <div className="bg-purple-600 p-2 rounded-xl shadow-lg shadow-purple-100">
                        <ShieldCheck className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <span className="text-3xl font-black tracking-tight text-slate-900">EduProof <span className="text-purple-600">Verifier</span></span>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Zero-Trust Credential Validation</p>
                    </div>
                </div>
            </header> */}

            <main className="max-w-4xl mx-auto mt-20">
                <div className="text-center mb-20">
                    <h1 className="text-5xl md:text-6xl font-black mb-6 tracking-tight text-slate-900">
                        Verify a Candidate.
                    </h1>
                    <p className="text-slate-500 text-lg font-medium max-w-2xl mx-auto leading-relaxed">
                        Enter a Stellar wallet address to view their on-chain, tamper-proof skill credentials.
                        No login required. No trust required. No centralized gatekeepers.
                    </p>
                </div>

                <div className="relative mb-20 max-w-2xl mx-auto">
                    <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition duration-1000"></div>
                        <Search className="absolute left-6 top-7 text-slate-400 w-6 h-6 z-10" />
                        <input
                            type="text"
                            placeholder="Stellar Wallet Address (G...)"
                            className="relative w-full bg-white border-2 border-slate-100 rounded-[1.5rem] py-6 pl-14 pr-40 text-slate-900 text-lg font-bold placeholder:text-slate-300 focus:outline-none focus:border-purple-600 transition-all shadow-xl shadow-slate-200/50"
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
                            className="absolute right-3 top-3 bottom-3 bg-slate-900 hover:bg-slate-800 text-white px-8 rounded-xl font-black text-sm tracking-widest transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg active:scale-95"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>QUERYING...</span>
                                </>
                            ) : (
                                "VERIFY"
                            )}
                        </button>
                    </div>
                </div>

                {loading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-24"
                    >
                        <div className="relative w-24 h-24 mx-auto mb-8">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                className="absolute inset-0 border-4 border-purple-100 border-t-purple-600 rounded-full"
                            />
                        </div>
                        <p className="text-slate-900 font-bold text-xl mb-2">Scanning Stellar Ledger...</p>
                        <p className="text-slate-500 font-medium tracking-tight">Accessing immutable evidence pools</p>
                    </motion.div>
                )}

                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-red-50 border-2 border-red-100 p-6 rounded-3xl mb-12 flex items-start gap-4"
                    >
                        <div className="bg-red-500 p-2 rounded-xl">
                            <AlertCircle className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                            <p className="text-red-900 font-bold text-lg">Verification Failed</p>
                            <p className="text-red-600 font-medium">{error}</p>
                        </div>
                        <button onClick={() => setError("")} className="text-red-400 hover:text-red-600">
                            <X className="w-6 h-6" />
                        </button>
                    </motion.div>
                )}

                {result && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-10"
                    >
                        <div className="flex items-center gap-6 p-8 bg-white rounded-[2rem] border-2 border-slate-100 shadow-sm">
                            <div className="bg-slate-100 p-5 rounded-2xl">
                                <User className="w-8 h-8 text-slate-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-slate-400 mb-1 uppercase tracking-widest">Candidate Identity</p>
                                <p className="font-mono text-purple-600 text-lg md:text-xl font-bold truncate">{result.address}</p>
                            </div>
                            <div className="text-right hidden md:block">
                                <div className="text-4xl font-black text-slate-900 leading-none">{result.credentials.length}</div>
                                <div className="text-[0.6rem] font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">Verified Skills</div>
                            </div>
                        </div>

                        {result.credentials.length === 0 ? (
                            <div className="text-center py-24 bg-white rounded-[2rem] border-2 border-slate-100 border-dashed">
                                <ShieldCheck className="w-20 h-20 mx-auto mb-6 text-slate-200" />
                                <h3 className="text-2xl font-bold text-slate-900 mb-2">No Credentials Found</h3>
                                <p className="text-slate-500 font-medium">This wallet identity has no verified skill credentials yet.</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between mb-8">
                                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Verified Skills</h2>
                                    <div className="px-4 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold border border-emerald-100 flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4" /> ON-CHAIN VERIFIED
                                    </div>
                                </div>
                                <div className="grid gap-6">
                                    {result.credentials.map((cred: any) => (
                                        <motion.div
                                            key={cred.id}
                                            initial={{ opacity: 0, scale: 0.98 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="bg-white border-2 border-slate-100 p-8 rounded-[2rem] hover:border-purple-200 transition-all duration-300 shadow-sm hover:shadow-xl group"
                                        >
                                            <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-8">
                                                <div className="flex-1">
                                                    <h3 className="text-3xl font-black text-slate-900 mb-4 group-hover:text-purple-600 transition-colors">{cred.skill}</h3>
                                                    <span className={`px-4 py-2 rounded-xl text-sm font-bold border-2 ${getLevelColor(cred.level)} shadow-sm`}>
                                                        {cred.level}
                                                    </span>
                                                </div>
                                                <div className="text-left md:text-right bg-slate-50 p-6 rounded-2xl border border-slate-100 min-w-[140px]">
                                                    <div className="text-5xl font-black text-slate-900 mb-1">{cred.score}</div>
                                                    <div className="text-[0.6rem] font-bold text-slate-400 uppercase tracking-widest">Mastery Score</div>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-6 text-sm font-bold border-t border-slate-100 pt-8 mt-4">
                                                <span className="flex items-center gap-2 text-slate-500">
                                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                                    Minted: {cred.date}
                                                </span>
                                                {cred.evidence && (
                                                    <a
                                                        href={cred.evidence}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-2 text-purple-600 hover:text-purple-700 bg-purple-50 px-4 py-2 rounded-xl transition-all"
                                                    >
                                                        Proof of Work <ExternalLink className="w-4 h-4" />
                                                    </a>
                                                )}
                                                {cred.txHash && (
                                                    <a
                                                        href={`https://stellar.expert/explorer/testnet/tx/${cred.txHash}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="md:ml-auto flex items-center gap-2 text-slate-900 hover:bg-slate-100 px-4 py-2 rounded-xl transition-all border border-slate-200"
                                                    >
                                                        Ledger Proof <ExternalLink className="w-4 h-4" />
                                                    </a>
                                                )}
                                            </div>
                                        </motion.div>
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
