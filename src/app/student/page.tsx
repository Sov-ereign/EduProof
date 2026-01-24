"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, Upload, Loader2, Github, FileText, Video, Link as LinkIcon, ExternalLink, AlertCircle, X, FileCode, TrendingUp, Award, BarChart3, Wallet } from "lucide-react";
import { connectWallet } from "@/lib/stellar";
import Certificate from "@/components/Certificate";
import ScrollReveal from "@/components/ScrollReveal";

const SKILLS = [
    { name: "Python", category: "Tech" },
    { name: "Rust", category: "Tech" },
    { name: "React", category: "Tech" },
    { name: "JavaScript", category: "Tech" },
    { name: "TypeScript", category: "Tech" },
];

const EVIDENCE_TYPES = [
    { type: "github", label: "GitHub Repo", icon: Github, placeholder: "https://github.com/username/project" },
    { type: "google-docs", label: "Google Docs", icon: FileText, placeholder: "https://docs.google.com/..." },
    { type: "loom", label: "Loom Video", icon: Video, placeholder: "https://loom.com/share/..." },
    { type: "portfolio", label: "Portfolio Link", icon: LinkIcon, placeholder: "https://yourportfolio.com" },
];

export default function StudentDashboard() {
    const [wallet, setWallet] = useState<string | null>(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [minting, setMinting] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [evidenceLink, setEvidenceLink] = useState("");
    const [selectedSkill, setSelectedSkill] = useState("Python");
    const [mintSuccess, setMintSuccess] = useState<any>(null);
    const [showCertificate, setShowCertificate] = useState(false);
    const [certificateData, setCertificateData] = useState<any>(null);

    useEffect(() => {
        // Try to reconnect wallet on mount
        const tryReconnect = async () => {
            try {
                const { connectWallet } = await import("@/lib/stellar");
                const address = await connectWallet();
                if (address) setWallet(address);
            } catch (e) {
                // Not connected, that's fine - user will need to click connect
                console.log("Wallet not auto-connected:", e);
            }
        };
        tryReconnect();
    }, []);

    const handleConnect = async () => {
        try {
            setError(null);

            // First, check Freighter status for better error messages
            try {
                const { checkFreighterStatus, getFreighterHelpMessage } = await import("@/lib/freighter-check");
                const status = await checkFreighterStatus();

                if (!status.installed) {
                    setError("Freighter extension not found. Please install from https://freighter.app");
                    setTimeout(() => {
                        if (confirm("Freighter not found. Would you like to install it?")) {
                            window.open("https://freighter.app", "_blank");
                        }
                    }, 100);
                    return;
                }

                if (!status.unlocked || !status.hasAccount) {
                    const helpMsg = getFreighterHelpMessage(status);
                    setError(helpMsg);
                    return;
                }
            } catch (checkError) {
                // Continue with normal connection if check fails
                console.log("Status check failed, continuing with connection:", checkError);
            }

            // Now try to connect
            const address = await connectWallet();
            if (address) {
                setWallet(address);
                setError(null); // Clear any previous errors
            }
        } catch (e: any) {
            console.error("Connection error:", e);
            // Show user-friendly error message
            let errorMsg = e.message || "Failed to connect wallet. Please install Freighter extension.";

            // Format multi-line errors better
            if (errorMsg.includes("\n")) {
                errorMsg = errorMsg.split("\n").join(". ");
            }

            setError(errorMsg);

            // If Freighter not found, provide installation link
            if (errorMsg.includes("not found") || errorMsg.includes("not installed")) {
                setTimeout(() => {
                    if (confirm("Freighter not found. Would you like to install it?")) {
                        window.open("https://freighter.app", "_blank");
                    }
                }, 100);
            }
        }
    };

    const detectEvidenceType = (url: string) => {
        if (url.includes('github.com')) return 'github';
        if (url.includes('docs.google.com') || url.includes('drive.google.com')) return 'google-docs';
        if (url.includes('loom.com')) return 'loom';
        if (url.includes('portfolio') || url.includes('behance') || url.includes('dribbble')) return 'portfolio';
        return 'other';
    };

    const isWalletConnected = !!wallet;
    const isLinkEntered = evidenceLink.trim().length > 0;

    const getButtonText = () => {
        if (analyzing) return <>Analyzing Evidence...</>;
        if (!isWalletConnected) return "Connect Wallet to Evaluate";
        if (!isLinkEntered) return "Enter Evidence Link";
        return "Run AI Evaluation";
    };

    const isButtonDisabled = analyzing || !isWalletConnected || !isLinkEntered;

    const handleSubmit = async () => {
        if (!evidenceLink.trim()) return;
        setAnalyzing(true);
        setResult(null);
        setError(null);

        try {
            const response = await fetch(
                `/api/evaluate?url=${encodeURIComponent(evidenceLink.trim())}&skill=${encodeURIComponent(selectedSkill)}`
            );
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Evaluation failed");
            }

            setResult(data);
        } catch (e: any) {
            console.error(e);
            setError(e.message || "Failed to evaluate evidence. Please check your URL.");
        } finally {
            setAnalyzing(false);
        }
    };

    const handleMint = async () => {
        if (!wallet || !result) return;
        setMinting(true);
        setError(null);
        setMintSuccess(null);

        try {
            const { mintCredential } = await import("@/lib/stellar");
            const category = SKILLS.find(s => s.name === selectedSkill)?.category || "Tech";
            const txResult = await mintCredential(
                wallet,
                selectedSkill,
                result.level,
                evidenceLink.trim(),
                result.score,
                category
            );

            setMintSuccess(txResult);

            // Prepare certificate data
            const userName = result.owner || wallet?.slice(0, 8) + "..." + wallet?.slice(-4) || "Student";
            setCertificateData({
                userName,
                skill: selectedSkill,
                level: result.level,
                score: result.score,
                date: new Date().toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                }),
                transactionHash: txResult.hash,
                explorerUrl: txResult.explorerUrl,
            });

            // Show certificate
            setShowCertificate(true);

            setResult(null); // Clear result to allow new submission
            setEvidenceLink(""); // Clear evidence link
        } catch (e: any) {
            console.error(e);
            setError("Minting Failed: " + (e.message || "Transaction was cancelled or failed"));
        } finally {
            setMinting(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white relative overflow-hidden">
            {/* Background gradient */}
            <div className="fixed inset-0 bg-gradient-to-b from-black via-purple-950/5 to-black -z-10" />

            <div className="container-custom max-w-[1600px] mx-auto px-4 sm:px-6 py-8 md:py-12">
                {/* Header */}
                <ScrollReveal direction="down" threshold={0.1}>
                    <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 md:mb-12 pb-6 border-b border-white/10">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold mb-2 gradient-text-purple">Prove Your Skill</h1>
                            <p className="text-sm md:text-base text-gray-400">Get verified credentials backed by real evidence</p>
                        </div>
                        {!wallet ? (
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleConnect}
                                className="group relative px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl font-semibold transition-all flex items-center gap-2 shadow-lg hover:shadow-purple-500/50"
                            >
                                <Wallet className="w-5 h-5" />
                                <span className="hidden sm:inline">Connect Freighter</span>
                                <span className="sm:hidden">Connect</span>
                            </motion.button>
                        ) : (
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="flex items-center gap-3 text-green-400 bg-green-500/10 px-4 py-3 rounded-xl border border-green-500/30 backdrop-blur-sm"
                            >
                                <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse shadow-lg shadow-green-400/50" />
                                <span className="font-mono text-sm font-medium">{wallet.slice(0, 8)}...{wallet.slice(-6)}</span>
                            </motion.div>
                        )}
                    </header>
                </ScrollReveal>

                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            className="mb-6 bg-red-500/10 border border-red-500/50 p-4 rounded-xl flex items-start gap-3 backdrop-blur-sm"
                        >
                            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                                <p className="text-red-400 font-semibold text-sm mb-1">Error</p>
                                <p className="text-red-300 text-sm break-words">{error}</p>
                            </div>
                            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300 flex-shrink-0 transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {mintSuccess && (
                        <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            className="mb-6 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/50 p-4 rounded-xl backdrop-blur-sm"
                        >
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                                    <CheckCircle className="w-6 h-6 text-green-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-green-400 font-semibold text-base mb-1">Credential Minted Successfully! 🚀</p>
                                    <p className="text-green-300 text-sm mt-1 break-all font-mono">
                                        TX: {mintSuccess.hash?.slice(0, 12)}...{mintSuccess.hash?.slice(-12)}
                                    </p>
                                    <div className="flex flex-wrap gap-3 mt-4">
                                        {mintSuccess.explorerUrl && (
                                            <motion.button
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => setShowCertificate(true)}
                                                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-lg"
                                            >
                                                View Certificate
                                            </motion.button>
                                        )}
                                        {mintSuccess.explorerUrl && (
                                            <motion.a
                                                href={mintSuccess.explorerUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                whileHover={{ scale: 1.05 }}
                                                className="text-green-400 hover:text-green-300 text-sm inline-flex items-center gap-2 px-4 py-2 border border-green-500/50 rounded-lg hover:bg-green-500/10 transition-colors"
                                            >
                                                View on Explorer <ExternalLink className="w-4 h-4" />
                                            </motion.a>
                                        )}
                                    </div>
                                </div>
                                <button onClick={() => setMintSuccess(null)} className="text-green-400 hover:text-green-300 flex-shrink-0 transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Certificate Modal */}
                {showCertificate && certificateData && (
                    <Certificate
                        userName={certificateData.userName}
                        skill={certificateData.skill}
                        level={certificateData.level}
                        score={certificateData.score}
                        date={certificateData.date}
                        transactionHash={certificateData.transactionHash}
                        explorerUrl={certificateData.explorerUrl}
                        onClose={() => setShowCertificate(false)}
                    />
                )}

                {/* Main Content - Responsive Grid */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 md:gap-8">
                    {/* Left Col: Submission Form */}
                    <ScrollReveal direction="right" threshold={0.2} className="xl:col-span-4">
                        <div className="glass-strong rounded-2xl border border-white/10 p-6 md:p-8 hover:border-purple-500/30 transition-all duration-300">
                            <h2 className="text-2xl font-bold mb-6 text-white">Submit Evidence</h2>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-gray-300 text-sm font-semibold mb-3">Select Skill</label>
                                    <div className="grid grid-cols-3 md:grid-cols-2 gap-3">
                                        {SKILLS.map(skill => (
                                            <motion.button
                                                key={skill.name}
                                                whileHover={{ scale: 1.05, y: -2 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => {
                                                    setSelectedSkill(skill.name);
                                                    setResult(null);
                                                }}
                                                className={`px-4 py-3 rounded-xl border transition-all text-sm font-medium ${selectedSkill === skill.name
                                                        ? "border-purple-500 bg-gradient-to-br from-purple-500/20 to-indigo-500/20 text-white shadow-lg shadow-purple-500/30"
                                                        : "border-white/10 hover:border-white/20 text-gray-400 hover:text-white bg-white/5"
                                                    }`}
                                            >
                                                {skill.name}
                                            </motion.button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-gray-300 text-sm font-semibold mb-3">Evidence Link</label>
                                    <div className="relative group">
                                        <LinkIcon className="absolute left-4 top-4 text-gray-500 w-5 h-5 group-focus-within:text-purple-400 transition-colors" />
                                        <input
                                            type="text"
                                            placeholder="Paste your evidence URL (GitHub, Docs, Loom, Portfolio...)"
                                            value={evidenceLink}
                                            onChange={(e) => {
                                                setEvidenceLink(e.target.value);
                                                setResult(null);
                                            }}
                                            onKeyDown={(e) => e.key === 'Enter' && !isButtonDisabled && handleSubmit()}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white text-sm focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">
                                        Supports: GitHub repos, Google Docs, Loom videos, Portfolio links
                                    </p>
                                </div>

                                <motion.button
                                    whileHover={!isButtonDisabled ? { scale: 1.02, y: -2 } : {}}
                                    whileTap={!isButtonDisabled ? { scale: 0.98 } : {}}
                                    onClick={handleSubmit}
                                    disabled={isButtonDisabled}
                                    className={`w-full py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all ${isButtonDisabled
                                            ? "bg-gray-800/50 text-gray-500 cursor-not-allowed border border-white/5"
                                            : "bg-gradient-to-r from-white to-gray-100 text-black hover:from-gray-100 hover:to-white shadow-xl hover:shadow-2xl"
                                        }`}
                                >
                                    {analyzing ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            <span>Analyzing Evidence...</span>
                                        </>
                                    ) : (
                                        getButtonText()
                                    )}
                                </motion.button>
                            </div>
                        </div>
                    </ScrollReveal>

                    {/* Right Col: Results */}
                    <ScrollReveal direction="left" threshold={0.2} className="xl:col-span-8">
                        <div className="glass-strong rounded-2xl border border-white/10 p-6 md:p-8 flex flex-col min-h-[500px]">
                            {!result && !analyzing && !mintSuccess && (
                                <div className="flex-1 flex flex-col justify-center items-center text-center">
                                    <motion.div
                                        animate={{ y: [0, -10, 0], rotate: [0, 5, -5, 0] }}
                                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                        className="mb-6"
                                    >
                                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-500/30 flex items-center justify-center">
                                            <Upload className="w-10 h-10 text-purple-400 opacity-60" />
                                        </div>
                                    </motion.div>
                                    <h3 className="text-xl font-semibold text-white mb-2">Submit Evidence to See Your Score</h3>
                                    <p className="text-gray-400 text-sm max-w-md">AI will evaluate your work against a transparent public rubric</p>
                                </div>
                            )}

                            {analyzing && (
                                <div className="flex-1 flex flex-col justify-center items-center space-y-6">
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                        className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full shadow-lg shadow-purple-500/30"
                                    />
                                    <div className="space-y-2 text-center">
                                        <p className="text-purple-400 font-semibold text-lg">Analyzing your evidence...</p>
                                        <p className="text-gray-500 text-sm">Checking code quality, logic, and documentation</p>
                                    </div>
                                </div>
                            )}

                            {result && !analyzing && (
                                <motion.div
                                    initial={{ scale: 0.95, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="flex-1 flex flex-col"
                                >
                                    {result.failed || result.score === 0 ? (
                                        <div className="flex-1 flex flex-col items-center justify-center text-center">
                                            <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center border-2 border-red-500/30 mb-4">
                                                <X className="w-10 h-10 text-red-500" />
                                            </div>
                                            <h3 className="text-3xl font-bold text-red-400 mb-2">Evaluation Failed</h3>
                                            <p className="text-gray-400 mb-6">Score: {result.score}/100</p>
                                            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 w-full text-left">
                                                <p className="text-sm text-red-400 mb-3 font-medium">Failure Reason:</p>
                                                <ul className="text-sm space-y-2">
                                                    {result.feedback.map((f: string, i: number) => (
                                                        <li key={i} className="flex items-start gap-2">
                                                            <span className="text-red-500 mt-1">•</span>
                                                            <span className="text-gray-300">{f}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                            <p className="text-gray-500 text-sm mt-6">Please submit evidence that actually contains {selectedSkill} code</p>
                                        </div>
                                    ) : (
                                        <EvaluationResults
                                            result={result}
                                            selectedSkill={selectedSkill}
                                            onMint={handleMint}
                                            minting={minting}
                                        />
                                    )}
                                </motion.div>
                            )}
                        </div>
                    </ScrollReveal>
                </div>

                {/* Certificate Modal */}
                <AnimatePresence>
                    {showCertificate && certificateData && (
                        <Certificate
                            userName={certificateData.userName}
                            skill={certificateData.skill}
                            level={certificateData.level}
                            score={certificateData.score}
                            date={certificateData.date}
                            transactionHash={certificateData.transactionHash}
                            explorerUrl={certificateData.explorerUrl}
                            onClose={() => setShowCertificate(false)}
                        />
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

// Enhanced Evaluation Results Component
function EvaluationResults({
    result,
    selectedSkill,
    onMint,
    minting
}: {
    result: any;
    selectedSkill: string;
    onMint: () => void;
    minting: boolean;
}) {
    const [scoreDisplay, setScoreDisplay] = useState(0);
    const score = result.score || 0;

    // Animate score counter
    useEffect(() => {
        const duration = 1500;
        const steps = 60;
        const increment = score / steps;
        let current = 0;
        const timer = setInterval(() => {
            current += increment;
            if (current >= score) {
                setScoreDisplay(score);
                clearInterval(timer);
            } else {
                setScoreDisplay(Math.floor(current));
            }
        }, duration / steps);
        return () => clearInterval(timer);
    }, [score]);

    // Parse feedback to extract scores and files
    const parsedData = useMemo(() => {
        const files: Array<{ path: string; lines: number; size: string }> = [];
        const criteriaScores: Array<{ name: string; score: number; weight: number }> = [];
        const feedbackItems: string[] = [];
        let inFilesSection = false;

        result.feedback?.forEach((f: string) => {
            // Extract files analyzed
            if (f.includes('📁 FILES ANALYZED')) {
                inFilesSection = true;
                return;
            }
            if (inFilesSection && f.match(/^\s*\d+\.\s+/)) {
                const match = f.match(/(\d+)\.\s+(.+?)\s+\((\d+)\s+lines,\s+(.+?)\)/);
                if (match) {
                    files.push({
                        path: match[2],
                        lines: parseInt(match[3]),
                        size: match[4]
                    });
                }
                if (f.trim() === '') inFilesSection = false;
                return;
            }
            if (f.trim() === '' && inFilesSection) {
                inFilesSection = false;
                return;
            }

            // Extract criteria scores
            const scoreMatch = f.match(/📊\s+(.+?):\s+(\d+)\/100\s+\((\d+)%\s+weight\)/);
            if (scoreMatch) {
                criteriaScores.push({
                    name: scoreMatch[1],
                    score: parseInt(scoreMatch[2]),
                    weight: parseInt(scoreMatch[3])
                });
                return;
            }

            // Regular feedback
            if (!f.includes('📁') && !f.includes('📊') && f.trim() !== '') {
                feedbackItems.push(f);
            }
        });

        return { files, criteriaScores, feedbackItems };
    }, [result.feedback]);

    const getScoreColor = (score: number) => {
        if (score >= 90) return "text-green-400";
        if (score >= 80) return "text-blue-400";
        if (score >= 70) return "text-yellow-400";
        return "text-orange-400";
    };

    const getLevelBadgeColor = (level: string) => {
        switch (level) {
            case "Expert": return "from-purple-500 to-pink-500";
            case "Advanced": return "from-blue-500 to-cyan-500";
            case "Intermediate": return "from-green-500 to-emerald-500";
            default: return "from-gray-500 to-gray-600";
        }
    };

    return (
        <div className="flex-1 flex flex-col gap-3 md:gap-4 overflow-y-auto custom-scrollbar">
            {/* Score Header - Compact Horizontal Layout */}
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.4 }}
                className="relative bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 rounded-xl md:rounded-2xl p-4 md:p-6 border border-purple-500/30 overflow-hidden"
            >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-transparent to-indigo-500/10" />
                <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: "spring" }}
                            className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-full flex items-center justify-center border-2 border-green-500/50 shadow-lg shadow-green-500/20 flex-shrink-0"
                        >
                            <CheckCircle className="w-8 h-8 md:w-10 md:h-10 text-green-400" />
                        </motion.div>
                        <div>
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="flex items-baseline gap-2 mb-1.5"
                            >
                                <h3 className={`text-4xl md:text-5xl lg:text-6xl font-bold ${getScoreColor(score)}`}>
                                    {scoreDisplay}
                                </h3>
                                <span className="text-2xl md:text-3xl text-gray-500">/100</span>
                            </motion.div>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.4 }}
                                className={`inline-block bg-gradient-to-r ${getLevelBadgeColor(result.level)} px-3 md:px-4 py-1 md:py-1.5 rounded-full text-white font-semibold text-xs md:text-sm shadow-lg`}
                            >
                                <Award className="w-3 h-3 md:w-4 md:h-4 inline mr-1.5" />
                                {result.level}
                            </motion.div>
                        </div>
                    </div>
                    {/* Progress Bar */}
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.5, type: "spring" }}
                        className="w-full sm:w-48 md:w-64"
                    >
                        <div className="relative w-full h-2 md:h-3 bg-gray-800 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${score}%` }}
                                transition={{ duration: 1.5, delay: 0.3, ease: "easeOut" }}
                                className={`h-full bg-gradient-to-r ${getLevelBadgeColor(result.level)} rounded-full shadow-lg`}
                            />
                        </div>
                    </motion.div>
                </div>
            </motion.div>

            {/* Compact Grid Layout for Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">

                {/* Repository Info - Compact */}
                {result.owner && result.owner !== 'External' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-gradient-to-r from-purple-500/10 to-indigo-500/10 rounded-xl p-3 md:p-4 border border-purple-500/20"
                    >
                        <p className="text-xs text-gray-400 mb-2 font-medium">Repository</p>
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                            <p className="text-white font-semibold text-sm">{result.owner}</p>
                            {result.ownerUsername && (
                                <a
                                    href={`https://github.com/${result.ownerUsername}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-purple-400 hover:text-purple-300 text-xs flex items-center gap-1 transition"
                                >
                                    @{result.ownerUsername}
                                    <ExternalLink className="w-3 h-3" />
                                </a>
                            )}
                        </div>
                        {result.repositoryInfo && (
                            <div className="flex gap-3 md:gap-4 text-xs text-gray-400 mb-2">
                                {result.repositoryInfo.stars !== undefined && (
                                    <span className="flex items-center gap-1">
                                        <span className="text-yellow-400">⭐</span>
                                        {result.repositoryInfo.stars}
                                    </span>
                                )}
                                {result.repositoryInfo.forks !== undefined && (
                                    <span className="flex items-center gap-1">
                                        <span>🍴</span>
                                        {result.repositoryInfo.forks}
                                    </span>
                                )}
                            </div>
                        )}
                        {result.languages && Object.keys(result.languages).length > 0 && (
                            <div>
                                <div className="flex h-2 rounded-full overflow-hidden bg-gray-800">
                                    {Object.entries(result.languages).slice(0, 3).map(([lang, bytes]: [string, any], i) => {
                                        const total: number = Object.values(result.languages).reduce((a: any, b: any) => a + b, 0) as number;
                                        const percent = (bytes / total) * 100;
                                        const colors = ["bg-blue-500", "bg-yellow-500", "bg-purple-500"];
                                        return (
                                            <motion.div
                                                key={lang}
                                                initial={{ width: 0 }}
                                                animate={{ width: `${percent}%` }}
                                                transition={{ duration: 0.8, delay: 0.5 + i * 0.1 }}
                                                className={`${colors[i % colors.length]} h-full`}
                                                title={`${lang}: ${Math.round(percent)}%`}
                                            />
                                        );
                                    })}
                                </div>
                                <div className="flex gap-2 mt-1.5 text-xs text-gray-400">
                                    {Object.keys(result.languages).slice(0, 3).map((lang, i) => (
                                        <span key={lang} className="flex items-center gap-1">
                                            <div className={`w-1.5 h-1.5 rounded-full ${["bg-blue-500", "bg-yellow-500", "bg-purple-500"][i]}`} />
                                            {lang}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* Criteria Scores - Compact */}
                {parsedData.criteriaScores.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-black/40 rounded-xl p-3 md:p-4 border border-gray-800 xl:col-span-2"
                    >
                        <div className="flex items-center gap-2 mb-3">
                            <BarChart3 className="w-4 h-4 md:w-5 md:h-5 text-purple-400" />
                            <p className="text-xs md:text-sm font-semibold text-gray-300 truncate">{result.rubric?.name || selectedSkill}</p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {parsedData.criteriaScores.map((criteria, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.4 + i * 0.1 }}
                                >
                                    <div className="flex justify-between items-center mb-1.5">
                                        <span className="text-xs md:text-sm text-gray-300 font-medium truncate">{criteria.name}</span>
                                        <div className="flex items-center gap-1.5 ml-2">
                                            <span className={`text-xs md:text-sm font-bold ${getScoreColor(criteria.score)}`}>
                                                {criteria.score}
                                            </span>
                                            <span className="text-xs text-gray-500">({criteria.weight}%)</span>
                                        </div>
                                    </div>
                                    <div className="relative w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${criteria.score}%` }}
                                            transition={{ duration: 1, delay: 0.5 + i * 0.1, ease: "easeOut" }}
                                            className={`h-full bg-gradient-to-r ${getLevelBadgeColor(result.level)} rounded-full`}
                                        />
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Files Analyzed - Compact */}
                {parsedData.files.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="bg-gradient-to-br from-gray-900/50 to-black/50 rounded-xl p-3 md:p-4 border border-gray-800"
                    >
                        <div className="flex items-center gap-2 mb-3">
                            <FileCode className="w-4 h-4 md:w-5 md:h-5 text-blue-400" />
                            <p className="text-xs md:text-sm font-semibold text-gray-300">
                                Files ({parsedData.files.length})
                            </p>
                        </div>
                        <div className="max-h-32 md:max-h-40 overflow-y-auto space-y-1.5 custom-scrollbar">
                            {parsedData.files.slice(0, 5).map((file, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.5 + i * 0.05 }}
                                    className="flex items-center justify-between bg-gray-800/50 rounded-lg p-2 hover:bg-gray-800/70 transition"
                                >
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <FileCode className="w-3 h-3 text-purple-400 flex-shrink-0" />
                                        <span className="text-xs text-gray-300 font-mono truncate">{file.path.split('/').pop()}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-gray-500 ml-2">
                                        <span>{file.lines}L</span>
                                    </div>
                                </motion.div>
                            ))}
                            {parsedData.files.length > 5 && (
                                <p className="text-xs text-gray-500 text-center pt-1">+{parsedData.files.length - 5} more files</p>
                            )}
                        </div>
                    </motion.div>
                )}

                {/* AI Analysis Feedback - Compact */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-black/40 rounded-xl p-3 md:p-4 border border-gray-800 xl:col-span-3 flex flex-col max-h-64 md:max-h-80"
                >
                    <div className="flex items-center gap-2 mb-3">
                        <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-green-400" />
                        <p className="text-xs md:text-sm font-semibold text-gray-300">AI Analysis</p>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-1.5 custom-scrollbar">
                        {parsedData.feedbackItems.slice(0, 8).map((f: string, i: number) => {
                            const isPositive = f.includes('✓');
                            const isWarning = f.includes('⚠');
                            const isError = f.includes('❌');

                            return (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.6 + i * 0.03 }}
                                    className={`flex items-start gap-2 text-xs md:text-sm p-1.5 md:p-2 rounded-lg ${isPositive ? 'bg-green-500/10 text-green-300' :
                                        isWarning ? 'bg-yellow-500/10 text-yellow-300' :
                                            isError ? 'bg-red-500/10 text-red-300' :
                                                'text-gray-300'
                                        }`}
                                >
                                    <span className={`mt-0.5 flex-shrink-0 ${isPositive ? 'text-green-400' :
                                        isWarning ? 'text-yellow-400' :
                                            isError ? 'text-red-400' :
                                                'text-purple-400'
                                        }`}>
                                        {isPositive ? '✓' : isWarning ? '⚠' : isError ? '❌' : '•'}
                                    </span>
                                    <span className="flex-1 text-xs md:text-sm">{f.replace(/^[✓⚠❌•]\s*/, '')}</span>
                                </motion.div>
                            );
                        })}
                        {parsedData.feedbackItems.length > 8 && (
                            <p className="text-xs text-gray-500 text-center pt-1">+{parsedData.feedbackItems.length - 8} more items</p>
                        )}
                    </div>
                </motion.div>
            </div>

            {/* Mint Button - Full Width */}
            <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                onClick={onMint}
                disabled={minting || result.score < 70}
                whileHover={!minting && result.score >= 70 ? { scale: 1.02 } : {}}
                whileTap={!minting && result.score >= 70 ? { scale: 0.98 } : {}}
                className={`w-full bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:opacity-90 py-3 md:py-4 rounded-xl font-bold text-sm md:text-base text-white shadow-lg shadow-purple-900/30 transition-all flex items-center justify-center gap-2 ${minting || result.score < 70 ? "opacity-50 cursor-not-allowed" : ""
                    }`}
            >
                {minting ? (
                    <>
                        <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
                        <span className="hidden sm:inline">Minting Credential...</span>
                        <span className="sm:hidden">Minting...</span>
                    </>
                ) : result.score < 70 ? (
                    `Score too low (need ≥70)`
                ) : (
                    <>
                        <Award className="w-4 h-4 md:w-5 md:h-5" />
                        <span className="hidden sm:inline">Mint Credential NFT</span>
                        <span className="sm:hidden">Mint NFT</span>
                    </>
                )}
            </motion.button>
        </div>
    );
}

