"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { CheckCircle, Upload, Loader2, Github, FileText, Video, Link as LinkIcon, ExternalLink, AlertCircle, X, FileCode, TrendingUp, Award, BarChart3 } from "lucide-react";
import { connectWallet } from "@/lib/stellar";
import Certificate from "@/components/Certificate";

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
        <div className="min-h-screen bg-black text-white p-6 md:p-12">
            <header className="flex justify-between items-center mb-12 border-b border-gray-800 pb-6">
                <div>
                    <h1 className="text-2xl font-bold">EduProof Dashboard</h1>
                    <p className="text-sm text-gray-400 mt-1">Prove your skills with on-chain credentials</p>
                </div>
                {!wallet ? (
                    <button
                        onClick={handleConnect}
                        className="bg-purple-600 hover:bg-purple-700 px-6 py-2 rounded-lg font-medium transition flex items-center gap-2"
                    >
                        <Github className="w-4 h-4" />
                        Connect Freighter
                    </button>
                ) : (
                    <div className="flex items-center gap-2 text-green-400 bg-green-400/10 px-4 py-2 rounded-lg border border-green-500/20">
                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                        <span className="font-mono text-sm">{wallet.slice(0, 6)}...{wallet.slice(-4)}</span>
                    </div>
                )}
            </header>

            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-4xl mx-auto mb-6 bg-red-500/10 border border-red-500/50 p-4 rounded-xl flex items-start gap-3"
                >
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <p className="text-red-400 font-medium">Error</p>
                        <p className="text-red-300 text-sm">{error}</p>
                    </div>
                    <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300">
                        <X className="w-4 h-4" />
                    </button>
                </motion.div>
            )}

            {mintSuccess && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-4xl mx-auto mb-6 bg-green-500/10 border border-green-500/50 p-4 rounded-xl"
                >
                    <div className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="text-green-400 font-medium">Credential Minted Successfully! 🚀</p>
                            <p className="text-green-300 text-sm mt-1">
                                Transaction: {mintSuccess.hash?.slice(0, 8)}...{mintSuccess.hash?.slice(-8)}
                            </p>
                            <div className="flex gap-3 mt-3">
                                {mintSuccess.explorerUrl && (
                                    <button
                                        onClick={() => setShowCertificate(true)}
                                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
                                    >
                                        View Certificate
                                    </button>
                                )}
                                {mintSuccess.explorerUrl && (
                                    <a
                                        href={mintSuccess.explorerUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-green-400 hover:text-green-300 text-sm inline-flex items-center gap-1 px-4 py-2 border border-green-500/50 rounded-lg hover:bg-green-500/10 transition"
                                    >
                                        View on Explorer <ExternalLink className="w-3 h-3" />
                                    </a>
                                )}
                            </div>
                        </div>
                        <button onClick={() => setMintSuccess(null)} className="text-green-400 hover:text-green-300">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </motion.div>
            )}

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

            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Col: Submission */}
                <div className="bg-gray-900/50 rounded-2xl border border-gray-800 p-8">
                    <h2 className="text-xl font-semibold mb-6">Prove a Skill</h2>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-gray-400 text-sm mb-3">Select Skill</label>
                            <div className="grid grid-cols-2 gap-3">
                                {SKILLS.map(skill => (
                                    <button
                                        key={skill.name}
                                        onClick={() => {
                                            setSelectedSkill(skill.name);
                                            setResult(null);
                                        }}
                                        className={`px-4 py-3 rounded-lg border transition ${selectedSkill === skill.name
                                            ? "border-purple-500 bg-purple-500/20 text-white"
                                            : "border-gray-700 hover:border-gray-500 text-gray-400"
                                            }`}
                                    >
                                        {skill.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-gray-400 text-sm mb-3">Evidence Link</label>
                            <div className="relative">
                                <LinkIcon className="absolute left-3 top-3.5 text-gray-500 w-5 h-5" />
                                <input
                                    type="text"
                                    placeholder="Paste your evidence URL (GitHub, Loom, Docs, Portfolio...)"
                                    value={evidenceLink}
                                    onChange={(e) => {
                                        setEvidenceLink(e.target.value);
                                        setResult(null);
                                    }}
                                    onKeyDown={(e) => e.key === 'Enter' && !isButtonDisabled && handleSubmit()}
                                    className="w-full bg-gray-900 border border-gray-700 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-purple-500 transition"
                                />
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                Supports: GitHub repos, Google Docs, Loom videos, Portfolio links
                            </p>
                        </div>

                        <button
                            onClick={handleSubmit}
                            disabled={isButtonDisabled}
                            className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition ${isButtonDisabled
                                ? "bg-gray-800 text-gray-500 cursor-not-allowed"
                                : "bg-white text-black hover:bg-gray-200"
                                }`}
                        >
                            {analyzing ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Analyzing Evidence...
                                </>
                            ) : (
                                getButtonText()
                            )}
                        </button>
                    </div>
                </div>

                {/* Right Col: Result */}
                <div className="bg-gray-900/50 rounded-2xl border border-gray-800 p-8 min-h-[500px] flex flex-col">
                    {!result && !analyzing && !mintSuccess && (
                        <div className="flex-1 flex flex-col justify-center items-center text-center text-gray-500">
                            <Upload className="w-16 h-16 mx-auto mb-4 opacity-50" />
                            <p className="text-lg mb-2">Submit evidence to see your score</p>
                            <p className="text-sm">AI will evaluate your work against a public rubric</p>
                        </div>
                    )}

                    {analyzing && (
                        <div className="flex-1 flex flex-col justify-center items-center space-y-4">
                            <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
                            <div className="space-y-2 text-center">
                                <p className="text-purple-400 font-medium">Analyzing your evidence...</p>
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
                                // FAILED EVALUATION
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
                                // SUCCESSFUL EVALUATION
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
        <div className="flex-1 flex flex-col space-y-6 overflow-y-auto">
            {/* Score Header with Animation */}
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="relative bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 rounded-2xl p-6 border border-purple-500/30 overflow-hidden"
            >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-transparent to-indigo-500/10 animate-pulse" />
                <div className="relative flex items-center justify-between">
                    <div>
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="flex items-baseline gap-2 mb-2"
                        >
                            <h3 className={`text-6xl font-bold ${getScoreColor(score)}`}>
                                {scoreDisplay}
                            </h3>
                            <span className="text-3xl text-gray-500">/100</span>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className={`inline-block bg-gradient-to-r ${getLevelBadgeColor(result.level)} px-4 py-1.5 rounded-full text-white font-semibold text-sm shadow-lg`}
                        >
                            <Award className="w-4 h-4 inline mr-1.5" />
                            {result.level}
                        </motion.div>
                    </div>
                    <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                        className="w-24 h-24 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-full flex items-center justify-center border-2 border-green-500/50 shadow-lg shadow-green-500/20"
                    >
                        <CheckCircle className="w-12 h-12 text-green-400" />
                    </motion.div>
                </div>

                {/* Circular Progress Indicator */}
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5, type: "spring" }}
                    className="mt-6"
                >
                    <div className="relative w-full h-3 bg-gray-800 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${score}%` }}
                            transition={{ duration: 1.5, delay: 0.3, ease: "easeOut" }}
                            className={`h-full bg-gradient-to-r ${getLevelBadgeColor(result.level)} rounded-full shadow-lg`}
                        />
                    </div>
                </motion.div>
            </motion.div>

            {/* Repository Info */}
            {result.owner && result.owner !== 'External' && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-gradient-to-r from-purple-500/10 to-indigo-500/10 rounded-xl p-5 border border-purple-500/20"
                >
                    <p className="text-xs text-gray-400 mb-3 font-medium uppercase tracking-wider">Repository Owner</p>
                    <div className="flex items-center gap-2 flex-wrap mb-4">
                        <p className="text-white font-semibold">{result.owner}</p>
                        {result.ownerUsername && (
                            <a
                                href={`https://github.com/${result.ownerUsername}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-purple-400 hover:text-purple-300 text-sm flex items-center gap-1 transition"
                            >
                                @{result.ownerUsername}
                                <ExternalLink className="w-3 h-3" />
                            </a>
                        )}
                    </div>
                    {result.repositoryInfo && (
                        <div className="flex gap-6 text-sm text-gray-400 mb-4">
                            {result.repositoryInfo.stars !== undefined && (
                                <span className="flex items-center gap-1.5">
                                    <span className="text-yellow-400">⭐</span>
                                    {result.repositoryInfo.stars} stars
                                </span>
                            )}
                            {result.repositoryInfo.forks !== undefined && (
                                <span className="flex items-center gap-1.5">
                                    <span>🍴</span>
                                    {result.repositoryInfo.forks} forks
                                </span>
                            )}
                            {result.repositoryInfo.openIssues !== undefined && (
                                <span className="flex items-center gap-1.5">
                                    <span>📝</span>
                                    {result.repositoryInfo.openIssues} issues
                                </span>
                            )}
                        </div>
                    )}
                    {result.languages && Object.keys(result.languages).length > 0 && (
                        <div>
                            <p className="text-xs text-gray-500 mb-2 font-medium">Languages Used:</p>
                            <div className="flex h-3 rounded-full overflow-hidden bg-gray-800 shadow-inner">
                                {Object.entries(result.languages).slice(0, 3).map(([lang, bytes]: [string, any], i) => {
                                    const total: number = Object.values(result.languages).reduce((a: any, b: any) => a + b, 0) as number;
                                    const percent = (bytes / total) * 100;
                                    const colors = ["bg-blue-500", "bg-yellow-500", "bg-purple-500", "bg-green-500"];
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
                            <div className="flex gap-4 mt-2 text-xs text-gray-400">
                                {Object.keys(result.languages).slice(0, 3).map((lang, i) => (
                                    <span key={lang} className="flex items-center gap-1.5">
                                        <div className={`w-2 h-2 rounded-full ${["bg-blue-500", "bg-yellow-500", "bg-purple-500"][i]}`} />
                                        {lang}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </motion.div>
            )}

            {/* Criteria Scores with Progress Bars */}
            {parsedData.criteriaScores.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-black/40 rounded-xl p-5 border border-gray-800"
                >
                    <div className="flex items-center gap-2 mb-4">
                        <BarChart3 className="w-5 h-5 text-purple-400" />
                        <p className="text-sm font-semibold text-gray-300">Evaluation Rubric: {result.rubric?.name || selectedSkill}</p>
                    </div>
                    <div className="space-y-4">
                        {parsedData.criteriaScores.map((criteria, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.4 + i * 0.1 }}
                            >
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm text-gray-300 font-medium">{criteria.name}</span>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-sm font-bold ${getScoreColor(criteria.score)}`}>
                                            {criteria.score}/100
                                        </span>
                                        <span className="text-xs text-gray-500">({criteria.weight}%)</span>
                                    </div>
                                </div>
                                <div className="relative w-full h-2.5 bg-gray-800 rounded-full overflow-hidden">
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

            {/* Files Analyzed */}
            {parsedData.files.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-gradient-to-br from-gray-900/50 to-black/50 rounded-xl p-5 border border-gray-800"
                >
                    <div className="flex items-center gap-2 mb-4">
                        <FileCode className="w-5 h-5 text-blue-400" />
                        <p className="text-sm font-semibold text-gray-300">
                            Files Analyzed ({parsedData.files.length})
                        </p>
                    </div>
                    <div className="max-h-48 overflow-y-auto space-y-2 custom-scrollbar">
                        {parsedData.files.map((file, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.5 + i * 0.05 }}
                                className="flex items-center justify-between bg-gray-800/50 rounded-lg p-3 hover:bg-gray-800/70 transition"
                            >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <FileCode className="w-4 h-4 text-purple-400 flex-shrink-0" />
                                    <span className="text-xs text-gray-300 font-mono truncate">{file.path}</span>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-gray-500 ml-3">
                                    <span>{file.lines} lines</span>
                                    <span>•</span>
                                    <span>{file.size}</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* AI Analysis Feedback */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-black/40 rounded-xl p-5 border border-gray-800 flex-1 min-h-0 flex flex-col"
            >
                <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-5 h-5 text-green-400" />
                    <p className="text-sm font-semibold text-gray-300">AI Analysis</p>
                </div>
                <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar">
                    {parsedData.feedbackItems.map((f: string, i: number) => {
                        const isPositive = f.includes('✓') || f.includes('✓');
                        const isWarning = f.includes('⚠') || f.includes('⚠️');
                        const isError = f.includes('❌');

                        return (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.6 + i * 0.03 }}
                                className={`flex items-start gap-2 text-sm p-2 rounded-lg ${isPositive ? 'bg-green-500/10 text-green-300' :
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
                                <span className="flex-1">{f.replace(/^[✓⚠❌•]\s*/, '')}</span>
                            </motion.div>
                        );
                    })}
                </div>
            </motion.div>

            {/* Mint Button */}
            <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                onClick={onMint}
                disabled={minting || result.score < 70}
                className={`w-full bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:opacity-90 py-4 rounded-xl font-bold text-white shadow-lg shadow-purple-900/30 transition-all flex items-center justify-center gap-2 ${minting || result.score < 70 ? "opacity-50 cursor-not-allowed" : "hover:scale-[1.02] active:scale-[0.98]"
                    }`}
            >
                {minting ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Minting Credential...
                    </>
                ) : result.score < 70 ? (
                    `Score too low to mint (need ≥70, got ${result.score})`
                ) : (
                    <>
                        <Award className="w-5 h-5" />
                        Mint Credential NFT
                    </>
                )}
            </motion.button>
        </div>
    );
}

