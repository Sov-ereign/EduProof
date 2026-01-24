"use client";

import { useState } from "react";
import { Search, ShieldCheck, ExternalLink, User, AlertCircle, CheckCircle2, X, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

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
        <div className="min-h-screen bg-black text-white p-6 md:p-12">
            <header className="flex justify-between items-center mb-12 border-b border-gray-800 pb-6">
                <div className="flex items-center gap-3">
                    <ShieldCheck className="w-8 h-8 text-purple-500" />
                    <div>
                        <span className="text-xl font-bold">EduProof Verifier</span>
                        <p className="text-sm text-gray-400">Zero-trust credential verification</p>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-white to-gray-600 bg-clip-text text-transparent">
                        Verify a Candidate
                    </h1>
                    <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                        Enter a Stellar wallet address to view their on-chain, tamper-proof skill credentials.
                        No login required. No trust required.
                    </p>
                </div>

                <div className="relative mb-12">
                    <Search className="absolute left-4 top-4 text-gray-500 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Paste Stellar Wallet Address (e.g. GCA7...)"
                        className="w-full bg-gray-900 border border-gray-700 rounded-2xl py-4 pl-12 pr-32 text-lg focus:outline-none focus:border-purple-500 transition shadow-xl text-white"
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
                        className={`absolute right-2 top-2 bg-white text-black font-bold px-6 py-2 rounded-xl transition flex items-center gap-2 ${
                            loading || !search.trim()
                                ? "opacity-50 cursor-not-allowed"
                                : "hover:bg-gray-200"
                        }`}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Searching...
                            </>
                        ) : (
                            "Verify"
                        )}
                    </button>
                </div>

                {loading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-16"
                    >
                        <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-gray-400 font-medium">Scanning Stellar Ledger...</p>
                        <p className="text-gray-500 text-sm mt-2">Querying on-chain credentials</p>
                    </motion.div>
                )}

                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-red-500/10 border border-red-500/50 p-4 rounded-xl mb-8 flex items-start gap-3"
                    >
                        <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="text-red-400 font-medium">Verification Failed</p>
                            <p className="text-red-300 text-sm">{error}</p>
                        </div>
                        <button onClick={() => setError("")} className="text-red-400 hover:text-red-300">
                            <X className="w-4 h-4" />
                        </button>
                    </motion.div>
                )}

                {result && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        <div className="flex items-center gap-4 p-6 bg-gray-900 rounded-xl border border-gray-800">
                            <div className="bg-gray-800 p-4 rounded-full">
                                <User className="w-6 h-6 text-gray-400" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm text-gray-500 mb-1">Wallet Identity</p>
                                <p className="font-mono text-purple-400 text-lg">{result.address}</p>
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-bold text-white">{result.credentials.length}</div>
                                <div className="text-xs text-gray-500 uppercase tracking-wider">Credentials</div>
                            </div>
                        </div>

                        {result.credentials.length === 0 ? (
                            <div className="text-center py-16 bg-gray-900/50 rounded-xl border border-gray-800">
                                <ShieldCheck className="w-16 h-16 mx-auto mb-4 text-gray-600 opacity-50" />
                                <p className="text-gray-400 text-lg mb-2">No credentials found</p>
                                <p className="text-gray-500 text-sm">This wallet has no verified skill credentials yet.</p>
                            </div>
                        ) : (
                            <>
                                <h2 className="text-2xl font-bold mb-4">Verified Skills</h2>
                                <div className="grid gap-4">
                                    {result.credentials.map((cred: any) => (
                                        <motion.div
                                            key={cred.id}
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="bg-gradient-to-r from-gray-900 to-black border border-gray-800 p-6 rounded-xl hover:border-purple-500/50 transition duration-300"
                                        >
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex-1">
                                                    <h3 className="text-2xl font-bold text-white mb-2">{cred.skill}</h3>
                                                    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getLevelColor(cred.level)}`}>
                                                        {cred.level}
                                                    </span>
                                                </div>
                                                <div className="text-right ml-4">
                                                    <div className="text-4xl font-bold text-white mb-1">{cred.score}</div>
                                                    <div className="text-xs text-gray-500 uppercase tracking-wider">Score</div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4 text-sm text-gray-400 border-t border-gray-800 pt-4 mt-4 flex-wrap">
                                                <span className="flex items-center gap-1">
                                                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                                                    Minted: {cred.date}
                                                </span>
                                                {cred.evidence && (
                                                    <a
                                                        href={cred.evidence}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-1 hover:text-white transition text-purple-400"
                                                    >
                                                        View Evidence <ExternalLink className="w-3 h-3" />
                                                    </a>
                                                )}
                                                {cred.txHash && (
                                                    <a
                                                        href={`https://stellar.expert/explorer/testnet/tx/${cred.txHash}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="ml-auto flex items-center gap-1 hover:text-purple-300 transition text-purple-400"
                                                    >
                                                        View on Explorer <ExternalLink className="w-3 h-3" />
                                                    </a>
                                                )}
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </>
                        )}
                    </motion.div>
                )}
            </main>
        </div>
    );
}
