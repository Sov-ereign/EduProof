"use client";

import { useState } from "react";
import { Search, ShieldCheck, ExternalLink, User, AlertCircle, CheckCircle2, X, Loader2, Award, TrendingUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ScrollReveal from "@/components/ScrollReveal";

const LEVEL_COLORS: Record<string, string> = {
    Beginner: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    Intermediate: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    Advanced: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    Expert: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    Verified: "bg-green-500/20 text-green-400 border-green-500/30",
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
        <div className="min-h-screen bg-black text-white relative overflow-hidden">
            {/* Background gradient */}
            <div className="fixed inset-0 bg-gradient-to-b from-black via-indigo-950/5 to-black -z-10" />
            
            <div className="container-custom max-w-6xl mx-auto px-4 sm:px-6 py-12 md:py-16">
                {/* Header */}
                <ScrollReveal direction="down" threshold={0.1}>
                    <header className="text-center mb-12 md:mb-16">
                        <div className="inline-flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-500/30 flex items-center justify-center">
                                <ShieldCheck className="w-7 h-7 text-purple-400" />
                            </div>
                            <div className="text-left">
                                <h1 className="text-3xl md:text-4xl font-bold gradient-text-purple">EduProof Verifier</h1>
                                <p className="text-sm text-gray-400">Zero-trust credential verification</p>
                            </div>
                        </div>
                    </header>
                </ScrollReveal>

                {/* Hero Section */}
                <ScrollReveal direction="up" threshold={0.2}>
                    <div className="text-center mb-12">
                        <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                            Verify a <span className="gradient-text-purple">Candidate</span>
                        </h2>
                        <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
                            Enter a Stellar wallet address to view their on-chain, tamper-proof skill credentials.
                            No login required. No trust required.
                        </p>
                    </div>
                </ScrollReveal>

                {/* Search Section */}
                <ScrollReveal direction="up" delay={0.2} threshold={0.2}>
                    <div className="relative mb-12 max-w-3xl mx-auto">
                        <div className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl blur-lg opacity-20 group-hover:opacity-30 transition duration-1000" />
                            <div className="relative">
                                <Search className="absolute left-6 top-5 text-gray-500 w-6 h-6 group-focus-within:text-purple-400 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Paste Stellar Wallet Address (e.g. GCA7...)"
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-5 pl-14 pr-36 text-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all text-white placeholder-gray-500"
                                    value={search}
                                    onChange={(e) => {
                                        setSearch(e.target.value);
                                        setError("");
                                    }}
                                    onKeyDown={(e) => e.key === 'Enter' && !loading && handleSearch()}
                                />
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleSearch}
                                    disabled={loading || !search.trim()}
                                    className={`absolute right-2 top-2 bottom-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 text-white px-8 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg ${
                                        !loading && search.trim() ? "hover:shadow-purple-500/50" : ""
                                    }`}
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Searching...
                                        </>
                                    ) : (
                                        "Verify"
                                    )}
                                </motion.button>
                            </div>
                        </div>
                    </div>
                </ScrollReveal>

                {/* Loading State */}
                <AnimatePresence>
                    {loading && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="text-center py-20"
                        >
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-6 shadow-lg shadow-purple-500/30"
                            />
                            <p className="text-purple-400 font-semibold text-lg mb-2">Scanning Stellar Ledger...</p>
                            <p className="text-gray-500 text-sm">Querying on-chain credentials</p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Error State */}
                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="mb-8 bg-red-500/10 border border-red-500/50 p-4 rounded-xl flex items-start gap-3 backdrop-blur-sm"
                        >
                            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <p className="text-red-400 font-semibold mb-1">Verification Failed</p>
                                <p className="text-red-300 text-sm">{error}</p>
                            </div>
                            <button onClick={() => setError("")} className="text-red-400 hover:text-red-300 transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Results */}
                <AnimatePresence>
                    {result && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className="space-y-8"
                        >
                            {/* Wallet Info Card */}
                            <ScrollReveal direction="up" threshold={0.2}>
                                <div className="glass-strong rounded-2xl border border-white/10 p-6 md:p-8">
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                                        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-500/30 flex items-center justify-center flex-shrink-0">
                                            <User className="w-8 h-8 text-purple-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-gray-400 mb-2 font-medium uppercase tracking-wider">Wallet Identity</p>
                                            <p className="font-mono text-purple-400 text-lg md:text-xl break-all">{result.address}</p>
                                        </div>
                                        <div className="text-center sm:text-right">
                                            <div className="text-4xl md:text-5xl font-bold text-white mb-1">{result.credentials.length}</div>
                                            <div className="text-xs text-gray-500 uppercase tracking-wider">Credentials</div>
                                        </div>
                                    </div>
                                </div>
                            </ScrollReveal>

                            {/* Credentials List */}
                            {result.credentials.length === 0 ? (
                                <ScrollReveal direction="up" threshold={0.2}>
                                    <div className="text-center py-20 glass-strong rounded-2xl border border-white/10">
                                        <div className="w-20 h-20 rounded-full bg-gray-800/50 mx-auto mb-6 flex items-center justify-center">
                                            <ShieldCheck className="w-10 h-10 text-gray-600" />
                                        </div>
                                        <p className="text-gray-400 text-xl mb-2 font-semibold">No credentials found</p>
                                        <p className="text-gray-500 text-sm">This wallet has no verified skill credentials yet.</p>
                                    </div>
                                </ScrollReveal>
                            ) : (
                                <>
                                    <h2 className="text-2xl md:text-3xl font-bold mb-6">Verified Skills</h2>
                                    <div className="grid gap-6">
                                        {result.credentials.map((cred: any, index: number) => (
                                            <ScrollReveal
                                                key={cred.id}
                                                direction="up"
                                                delay={index * 0.1}
                                                threshold={0.2}
                                            >
                                                <motion.div
                                                    whileHover={{ y: -4, scale: 1.01 }}
                                                    className="glass-strong rounded-2xl border border-white/10 p-6 md:p-8 hover:border-purple-500/50 transition-all duration-300 group"
                                                >
                                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-6">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-3 mb-3">
                                                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 flex items-center justify-center">
                                                                    <Award className="w-6 h-6 text-green-400" />
                                                                </div>
                                                                <h3 className="text-2xl md:text-3xl font-bold text-white">{cred.skill}</h3>
                                                            </div>
                                                            <span className={`inline-block px-4 py-1.5 rounded-full text-sm font-semibold border ${getLevelColor(cred.level)}`}>
                                                                {cred.level}
                                                            </span>
                                                        </div>
                                                        <div className="text-center md:text-right">
                                                            <div className="text-4xl md:text-5xl font-bold text-white mb-1">{cred.score}</div>
                                                            <div className="text-xs text-gray-500 uppercase tracking-wider">Score</div>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 border-t border-white/10 pt-6">
                                                        <span className="flex items-center gap-2">
                                                            <CheckCircle2 className="w-4 h-4 text-green-400" />
                                                            Minted: {cred.date}
                                                        </span>
                                                        {cred.evidence && (
                                                            <a
                                                                href={cred.evidence}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="flex items-center gap-2 hover:text-purple-400 transition-colors text-purple-400"
                                                            >
                                                                View Evidence <ExternalLink className="w-4 h-4" />
                                                            </a>
                                                        )}
                                                        {cred.txHash && (
                                                            <a
                                                                href={`https://stellar.expert/explorer/testnet/tx/${cred.txHash}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="ml-auto flex items-center gap-2 hover:text-purple-300 transition-colors text-purple-400"
                                                            >
                                                                View on Explorer <ExternalLink className="w-4 h-4" />
                                                            </a>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            </ScrollReveal>
                                        ))}
                                    </div>
                                </>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
