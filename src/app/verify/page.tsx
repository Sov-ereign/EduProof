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
        <div className="min-h-screen bg-black text-white p-6 md:p-12">
            <header className="mb-12 border-b border-gray-800 pb-6">
                <div className="max-w-6xl mx-auto flex items-center gap-3">
                    <Shield className="w-8 h-8 text-purple-500" />
                    <div>
                        <h1 className="text-2xl font-bold">EduProof Verifier</h1>
                        <p className="text-sm text-gray-400">Validate on-chain skill credentials instantly</p>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto">
                {/* Search Section */}
                <div className="mb-16 text-center">
                    <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-white via-purple-200 to-gray-400 bg-clip-text text-transparent">
                        Verify a candidate's skills.
                    </h2>
                    <p className="text-gray-400 text-lg mb-8 max-w-2xl mx-auto">
                        Enter a Stellar wallet address to view all verifiable, tamper-proof skill credentials earned by the candidate.
                    </p>

                    <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto">
                        <div className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                            <input
                                type="text"
                                placeholder="G..."
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                className="relative w-full bg-gray-900 border border-gray-700 rounded-xl py-4 pl-12 pr-32 text-white text-lg focus:outline-none focus:border-purple-500 transition shadow-xl"
                            />
                            <Search className="absolute left-4 top-5 text-gray-500 w-6 h-6" />
                            <button
                                type="submit"
                                disabled={loading || !address}
                                className="absolute right-2 top-2 bottom-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 text-white px-6 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify"}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Results Section */}
                <div className="space-y-6">
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-red-500/10 border border-red-500/50 p-4 rounded-xl flex items-center gap-3 text-red-300"
                        >
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <p>{error}</p>
                        </motion.div>
                    )}

                    {credentials.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="grid grid-cols-1 md:grid-cols-2 gap-4"
                        >
                            {credentials.map((cred, i) => (
                                <motion.div
                                    key={cred.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="bg-gray-900/50 border border-gray-800 hover:border-purple-500/50 rounded-xl p-6 transition group cursor-pointer relative overflow-hidden"
                                    onClick={() => setSelectedCert(cred)}
                                >
                                    <div className="absolute top-0 right-0 p-4 opacity-50 group-hover:opacity-100 transition">
                                        <ExternalLink className="w-5 h-5 text-gray-500 group-hover:text-purple-400" />
                                    </div>

                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/20 group-hover:scale-110 transition">
                                            <Award className="w-6 h-6 text-green-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-white mb-1">{cred.skill}</h3>
                                            <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
                                                <span className="bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded text-xs font-semibold uppercase">
                                                    {cred.level}
                                                </span>
                                                <span>•</span>
                                                <span>Score: {cred.score}/100</span>
                                            </div>
                                            <p className="text-xs text-gray-500 font-mono">
                                                Minted: {cred.date}
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
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
