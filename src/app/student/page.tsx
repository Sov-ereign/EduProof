"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, Upload, Loader2, Github, FileText, Video, Link as LinkIcon, ExternalLink, AlertCircle, X, FileCode, TrendingUp, Award, BarChart3, Wallet, Lock, LogOut, ArrowRight } from "lucide-react";
import { useSession, signIn, signOut } from "next-auth/react";
import { connectWallet } from "@/lib/stellar";
import Certificate from "@/components/Certificate";
import ScrollReveal from "@/components/ScrollReveal";
import TestFlowContainer, { type RepoAnalysis } from "@/components/TestFlowContainer";

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
    const { data: session } = useSession();
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
    const [testReady, setTestReady] = useState(false);
    const [repoAnalysis, setRepoAnalysis] = useState<RepoAnalysis | null>(null);
    const [finalTestScore, setFinalTestScore] = useState<number | null>(null);

    // Auto-fill evidence link with user's GitHub username to enforce ownership
    useEffect(() => {
        if (session?.user?.name) {
            // We can assume session.user.name is the username if configured correctly, 
            // but usually it's 'username' from our custom callback. 
            // Let's rely on the input placeholder guidance for now or basic pre-fill if available.
            // For now, let's just use the placeholder to guide them.
        }
    }, [session]);

    useEffect(() => {
        // Try to reconnect wallet on mount
        const tryReconnect = async () => {
            // Only auto-connect if session is active (cleaner UX)
            if (session) {
                try {
                    const { connectWallet } = await import("@/lib/stellar");
                    const address = await connectWallet();
                    if (address) setWallet(address);
                } catch (e) {
                    console.log("Wallet not auto-connected:", e);
                }
            }
        };
        tryReconnect();
    }, [session]);

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
        setTestReady(false);
        setRepoAnalysis(null);
        setFinalTestScore(null);

        try {
            // Use new prepare-test endpoint
            const response = await fetch(
                `/api/evaluate/prepare-test?url=${encodeURIComponent(evidenceLink.trim())}&skill=${encodeURIComponent(selectedSkill)}`
            );
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to prepare test");
            }

            // Store repo analysis and show test flow
            setRepoAnalysis(data.repoAnalysis);

            // Validate that primary language matches selected skill
            const languages = data.repoAnalysis.languages || {};
            const totalBytes = Object.values(languages).reduce((a: any, b: any) => a + b, 0) as number;

            if (totalBytes > 0) {
                const languagePercentages = Object.entries(languages).map(([lang, bytes]: any) => ({
                    lang,
                    percentage: (bytes / totalBytes) * 100
                })).sort((a, b) => b.percentage - a.percentage);

                const primaryLanguage = languagePercentages[0]?.lang.toLowerCase() || '';
                const selectedSkillNormalized = selectedSkill.toLowerCase();

                // Language mapping - what languages are acceptable for each skill
                const languageMap: Record<string, string[]> = {
                    'python': ['python'],
                    'javascript': ['javascript'],
                    'typescript': ['typescript', 'javascript'],
                    'react': ['javascript', 'typescript', 'jsx', 'tsx'],
                    'rust': ['rust']
                };

                const acceptedLanguages = languageMap[selectedSkillNormalized] || [selectedSkillNormalized];

                // Check if primary language matches any accepted language
                const isLanguageMatch = acceptedLanguages.some(lang =>
                    primaryLanguage.includes(lang.toLowerCase())
                );

                if (!isLanguageMatch) {
                    setError(`Repository's primary language is ${languagePercentages[0]?.lang}, but you selected ${selectedSkill}. Please choose a repository that primarily uses ${selectedSkill}.`);
                    setAnalyzing(false);
                    setRepoAnalysis(null);
                    setTestReady(false);
                    return;
                }
            }

            setTestReady(true);
        } catch (e: any) {
            console.error(e);
            setError(e.message || "Failed to prepare test. Please check your URL.");
        } finally {
            setAnalyzing(false);
        }
    };

    const handleTestComplete = (score: number) => {
        setFinalTestScore(score);
        // Calculate level from score
        const level = score >= 90 ? "Expert" : score >= 80 ? "Advanced" : score >= 70 ? "Intermediate" : "Beginner";

        // Set result for minting
        setResult({
            score,
            level,
            feedback: [`Test completed with score: ${score}/100`],
            owner: repoAnalysis?.owner || 'Student',
            languages: repoAnalysis?.languages || {},
            rubric: { name: selectedSkill }
        });
        setTestReady(false);
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

    // AUTH WALL
    if (!session) {
        return (
            <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center justify-center p-6 relative overflow-hidden">
                <div className="fixed inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-50 via-slate-50 to-slate-50 -z-10" />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md w-full bg-white border border-slate-200 p-10 rounded-[2rem] text-center shadow-xl shadow-purple-100"
                >
                    <div className="w-20 h-20 bg-purple-100 rounded-3xl flex items-center justify-center mx-auto mb-8 transform -rotate-6">
                        <Lock className="w-10 h-10 text-purple-600" />
                    </div>
                    <h1 className="text-3xl font-bold mb-4 text-slate-900">Sign in to EduProof</h1>
                    <p className="text-slate-500 mb-10 font-medium">
                        To ensure the integrity of skill credentials, you must sign in with GitHub.
                    </p>
                    <button
                        onClick={() => signIn("github")}
                        className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-slate-800 transition-all hover:scale-[1.02] shadow-lg"
                    >
                        <Github className="w-6 h-6" />
                        Sign in with GitHub
                    </button>
                    <p className="text-xs text-slate-400 mt-8 font-medium">
                        By continuing, you agree to our anti-cheat verification policy.
                    </p>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-50 text-zinc-950 relative overflow-hidden">
            {/* Minimalist background grid */}
            <div className="fixed inset-0 -z-10 bg-[radial-gradient(45%_45%_at_50%_50%,#fafafa_0%,#f4f4f5_100%)]" />
            <div className="fixed inset-0 -z-10">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:32px_32px]" />
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
                {/* Technical Header */}
                <ScrollReveal direction="down" threshold={0.1}>
                    <header className="relative mb-16 pt-32">
                        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8">
                            <div className="space-y-4">
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="inline-flex items-center gap-2 px-2.5 py-1 bg-white border border-zinc-200 rounded-full shadow-sm"
                                >
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Pipeline Active</span>
                                </motion.div>
                                <motion.h1
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-5xl md:text-7xl font-black tracking-tight text-zinc-950 leading-[0.9]"
                                >
                                    Proof Workflow<span className="text-zinc-400">.</span>
                                </motion.h1>
                                <p className="text-zinc-500 font-medium max-w-lg text-sm md:text-base leading-relaxed">
                                    Submit your evidence for computational validation.
                                    Verification logs are recorded on the primary ledger.
                                </p>
                            </div>

                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                                {!wallet ? (
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={handleConnect}
                                        className="px-8 py-4 bg-zinc-950 text-white rounded-2xl font-black text-xs tracking-widest transition-all shadow-2xl flex items-center justify-center gap-3 active:scale-95 border border-zinc-800"
                                    >
                                        <Wallet className="w-4 h-4" />
                                        INITIALIZE WALLET
                                    </motion.button>
                                ) : (
                                    <div className="flex items-center gap-4 px-6 py-4 bg-white border border-zinc-200 rounded-2xl shadow-sm">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                        <span className="font-mono text-xs font-bold text-zinc-900 tracking-wider uppercase">
                                            {wallet.slice(0, 6)}...{wallet.slice(-4)}
                                        </span>
                                    </div>
                                )}
                                <div className="flex items-center gap-3 pl-4 border-l border-zinc-200 sm:h-12">
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-1">Authenticated</p>
                                        <p className="text-xs font-bold text-zinc-900 leading-none">{session.user?.name}</p>
                                    </div>
                                    <button onClick={() => signOut()} className="p-2.5 rounded-xl hover:bg-zinc-100 text-zinc-400 hover:text-red-600 transition-all border border-transparent hover:border-zinc-200">
                                        <LogOut className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </header>
                </ScrollReveal>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="mb-6 bg-gradient-to-r from-red-50 to-rose-50 border border-red-200/50 backdrop-blur-sm p-4 rounded-2xl shadow-lg flex items-start gap-4"
                    >
                        <div className="p-2 bg-red-100 rounded-xl">
                            <AlertCircle className="w-5 h-5 text-red-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-red-900 font-bold text-sm mb-1">Error</p>
                            <p className="text-red-700 text-sm break-words">{error}</p>
                        </div>
                        <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 flex-shrink-0 p-1 rounded-lg hover:bg-red-100 transition-colors">
                            <X className="w-4 h-4" />
                        </button>
                    </motion.div>
                )}

                {mintSuccess && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="mb-6 bg-gradient-to-r from-emerald-50 via-green-50 to-teal-50 border border-emerald-200/50 backdrop-blur-sm p-5 rounded-2xl shadow-xl"
                    >
                        <div className="flex items-start gap-4">
                            <div className="p-2.5 bg-emerald-100 rounded-xl">
                                <CheckCircle className="w-6 h-6 text-emerald-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-emerald-900 font-black text-base mb-2 flex items-center gap-2">
                                    <span>Credential Minted Successfully!</span>
                                    <span className="text-xl">🚀</span>
                                </p>
                                <p className="text-emerald-700 text-sm font-medium mb-4 break-all font-mono bg-white/50 px-3 py-2 rounded-lg border border-emerald-100">
                                    {mintSuccess.hash?.slice(0, 12)}...{mintSuccess.hash?.slice(-12)}
                                </p>
                                <div className="flex flex-wrap gap-3">
                                    {mintSuccess.explorerUrl && (
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => setShowCertificate(true)}
                                            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-lg shadow-purple-500/30"
                                        >
                                            View Certificate
                                        </motion.button>
                                    )}
                                    {mintSuccess.explorerUrl && (
                                        <motion.a
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            href={mintSuccess.explorerUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 px-4 py-2 bg-white border-2 border-emerald-300 text-emerald-700 rounded-xl text-sm font-bold hover:bg-emerald-50 transition-all shadow-sm"
                                        >
                                            View on Explorer <ExternalLink className="w-4 h-4" />
                                        </motion.a>
                                    )}
                                </div>
                            </div>
                            <button onClick={() => setMintSuccess(null)} className="text-emerald-400 hover:text-emerald-600 flex-shrink-0 p-1.5 rounded-lg hover:bg-emerald-100 transition-colors">
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

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 lg:gap-8">
                    {/* Left Col: Submission Form */}
                    <div className="xl:col-span-4">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-white rounded-3xl border border-zinc-200 p-8 shadow-sm"
                        >
                            <div className="flex items-center gap-3 mb-10">
                                <div className="p-2.5 bg-zinc-950 rounded-xl">
                                    <Award className="w-5 h-5 text-white" />
                                </div>
                                <h2 className="text-2xl font-black text-zinc-950 tracking-tight">Proof Request</h2>
                            </div>

                            <div className="space-y-8">
                                <div>
                                    <label className="block text-zinc-400 text-[10px] font-black uppercase tracking-[0.2em] mb-4">Mastery Target</label>
                                    <div className="grid grid-cols-2 gap-2.5">
                                        {SKILLS.map(skill => (
                                            <motion.button
                                                key={skill.name}
                                                whileHover={{ y: -1 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => {
                                                    setSelectedSkill(skill.name);
                                                    setResult(null);
                                                }}
                                                className={`px-4 py-3 rounded-xl border font-bold transition-all text-sm ${selectedSkill === skill.name
                                                    ? "border-zinc-950 bg-zinc-950 text-white shadow-xl"
                                                    : "border-zinc-200 bg-white hover:border-zinc-300 text-zinc-500"
                                                    }`}
                                            >
                                                {skill.name}
                                            </motion.button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-zinc-400 text-[10px] font-black uppercase tracking-[0.2em] mb-4">Evidence Source</label>
                                    <div className="relative group">
                                        <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4 group-focus-within:text-zinc-950 transition-colors z-10" />
                                        <input
                                            type="text"
                                            placeholder="GitHub URL (e.g. /username/repo)"
                                            value={evidenceLink}
                                            onChange={(e) => {
                                                setEvidenceLink(e.target.value);
                                                setResult(null);
                                            }}
                                            onKeyDown={(e) => e.key === 'Enter' && !isButtonDisabled && handleSubmit()}
                                            className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-4 pl-12 pr-4 text-zinc-950 text-sm font-medium focus:outline-none focus:border-zinc-950 focus:bg-white transition-all"
                                        />
                                    </div>
                                </div>

                                <motion.button
                                    whileHover={!isButtonDisabled ? { y: -1 } : {}}
                                    whileTap={!isButtonDisabled ? { scale: 0.98 } : {}}
                                    onClick={handleSubmit}
                                    disabled={isButtonDisabled}
                                    className={`w-full py-4 rounded-xl font-black text-xs tracking-[0.2em] flex items-center justify-center gap-3 transition-all ${isButtonDisabled
                                        ? "bg-zinc-100 text-zinc-400 cursor-not-allowed border border-zinc-200"
                                        : "bg-zinc-950 text-white hover:bg-zinc-800 shadow-2xl"
                                        }`}
                                >
                                    {analyzing ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            RUNNING ANALYSIS...
                                        </>
                                    ) : (
                                        <>
                                            {isWalletConnected ? "START EVALUATION" : "CONNECT WALLET"}
                                            {!analyzing && isLinkEntered && <ArrowRight className="w-4 h-4 ml-1" />}
                                        </>
                                    )}
                                </motion.button>
                            </div>
                        </motion.div>
                    </div>

                    {/* Right Col: Results */}
                    <div className="xl:col-span-8">
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-white rounded-3xl border border-zinc-200 p-8 flex flex-col min-h-[640px] shadow-sm relative overflow-hidden"
                        >
                            {/* Decorative gradient overlay */}
                            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-purple-100/30 to-indigo-100/30 rounded-full blur-3xl -z-0" />

                            <div className="relative z-10 flex-1 flex flex-col">
                                {!result && !analyzing && !mintSuccess && !testReady && (
                                    <div className="flex-1 flex flex-col justify-center items-center text-center py-12">
                                        <motion.div
                                            initial={{ scale: 0.8, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            transition={{ delay: 0.2 }}
                                            className="relative mb-8"
                                        >
                                            <div className="w-40 h-40 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-3xl flex items-center justify-center border-2 border-purple-200/50 shadow-xl">
                                                <motion.div
                                                    animate={{ y: [0, -12, 0] }}
                                                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                                >
                                                    <Upload className="w-16 h-16 text-purple-400" />
                                                </motion.div>
                                            </div>
                                            <motion.div
                                                animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
                                                transition={{ duration: 2, repeat: Infinity }}
                                                className="absolute inset-0 bg-purple-200 rounded-3xl blur-xl"
                                            />
                                        </motion.div>
                                        <motion.h3
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.3 }}
                                            className="text-3xl font-black mb-3 bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent"
                                        >
                                            Your Evaluation Awaits
                                        </motion.h3>
                                        <motion.p
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.4 }}
                                            className="text-slate-600 max-w-md font-medium leading-relaxed"
                                        >
                                            Submit your GitHub repository to begin the interactive test-based evaluation. Prove your skills through MCQs and coding challenges.
                                        </motion.p>
                                    </div>
                                )}

                                {analyzing && (
                                    <div className="flex-1 flex flex-col justify-center items-center py-12">
                                        <div className="relative w-32 h-32 mb-8">
                                            <motion.div
                                                animate={{ rotate: 360 }}
                                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                                className="absolute inset-0 border-4 border-purple-200 border-t-purple-600 rounded-full"
                                            />
                                            <motion.div
                                                animate={{ rotate: -360 }}
                                                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                                className="absolute inset-4 border-4 border-indigo-200 border-t-indigo-600 rounded-full"
                                            />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-full flex items-center justify-center">
                                                    <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
                                                </div>
                                            </div>
                                        </div>
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="text-center space-y-2"
                                        >
                                            <p className="text-2xl font-black text-slate-900">Analyzing Evidence...</p>
                                            <p className="text-slate-600 font-medium">Preparing your personalized test</p>
                                        </motion.div>
                                    </div>
                                )}

                                {testReady && repoAnalysis && !analyzing && (
                                    <motion.div
                                        initial={{ scale: 0.95, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className="flex-1 flex flex-col overflow-y-auto -m-6 sm:-m-8 p-6 sm:p-8"
                                    >
                                        <TestFlowContainer
                                            repoAnalysis={repoAnalysis}
                                            skill={selectedSkill}
                                            onComplete={handleTestComplete}
                                        />
                                    </motion.div>
                                )}

                                {result && !analyzing && !testReady && (
                                    <motion.div
                                        initial={{ scale: 0.95, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className="flex-1 flex flex-col -m-6 sm:-m-8 p-6 sm:p-8"
                                    >
                                        {result.failed || result.score === 0 ? (
                                            // FAILED EVALUATION
                                            <div className="flex-1 flex flex-col items-center justify-center text-center py-20">
                                                <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center border-2 border-red-100 mb-8">
                                                    <X className="w-12 h-12 text-red-500" />
                                                </div>
                                                <h3 className="text-4xl font-black text-slate-900 mb-2">Evaluation Failed</h3>
                                                <p className="text-slate-500 font-bold mb-10">Score: {result.score}/100</p>
                                                <div className="bg-red-50/50 border border-red-100 rounded-[1.5rem] p-8 w-full text-left">
                                                    <p className="text-sm text-red-900 mb-4 font-black uppercase tracking-wider">Failure Analysis:</p>
                                                    <ul className="space-y-4">
                                                        {result.feedback.map((f: string, i: number) => (
                                                            <li key={i} className="flex items-start gap-4 text-sm font-medium text-red-700">
                                                                <div className="w-2 h-2 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
                                                                <span>{f}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                                <p className="text-slate-400 text-xs mt-10 font-bold uppercase tracking-widest leading-relaxed">Please submit evidence that actually contains <span className="text-purple-600">{selectedSkill}</span> code for a valid assessment.</p>
                                            </div>
                                        ) : (
                                            // SUCCESSFUL EVALUATION - Show mint button only after tests pass
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
                        </motion.div>
                    </div>
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
        if (score >= 90) return "text-emerald-600";
        if (score >= 80) return "text-blue-600";
        if (score >= 70) return "text-amber-600";
        return "text-orange-600";
    };

    const getLevelBadgeColor = (level: string) => {
        switch (level) {
            case "Expert": return "from-purple-600 to-indigo-600 shadow-purple-100";
            case "Advanced": return "from-blue-600 to-indigo-600 shadow-blue-100";
            case "Intermediate": return "from-emerald-600 to-teal-600 shadow-emerald-100";
            default: return "from-slate-600 to-slate-700 shadow-slate-100";
        }
    };

    return (
        <div className="flex-1 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
            {/* Score Header - Compact Horizontal Layout */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative bg-white rounded-[2rem] p-10 border border-zinc-200 shadow-sm overflow-hidden"
            >
                <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
                    <div className="flex items-center gap-8">
                        <div className="w-24 h-24 bg-zinc-50 rounded-[2rem] flex items-center justify-center border border-zinc-100 shadow-inner">
                            <CheckCircle className="w-10 h-10 text-zinc-950" />
                        </div>
                        <div>
                            <div className="flex items-baseline gap-2 mb-2">
                                <h3 className="text-7xl font-black text-zinc-950 tracking-tighter">
                                    {scoreDisplay}
                                </h3>
                                <span className="text-2xl font-bold text-zinc-300">/ 100</span>
                            </div>
                            <div className={`inline-flex items-center gap-2 bg-zinc-950 px-4 py-1.5 rounded-full text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl`}>
                                <Award className="w-3 h-3" />
                                {result.level}
                            </div>
                        </div>
                    </div>

                    <div className="w-full md:w-64 space-y-3">
                        <div className="flex justify-between text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">
                            <span>Validation Delta</span>
                            <span>{score}%</span>
                        </div>
                        <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden border border-zinc-200/50">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${score}%` }}
                                transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                                className="h-full bg-zinc-950 rounded-full"
                            />
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Compact Grid Layout for Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">

                {/* Repository Info - Compact */}
                {result.owner && result.owner !== 'External' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-slate-50 rounded-[1.5rem] p-6 border border-slate-100"
                    >
                        <p className="text-[0.6rem] font-black text-slate-400 mb-4 uppercase tracking-widest">Repository Evidence</p>
                        <div className="flex items-center gap-3 flex-wrap mb-4">
                            <p className="text-slate-900 font-bold text-sm tracking-tight">{result.owner}</p>
                            {result.ownerUsername && (
                                <a
                                    href={`https://github.com/${result.ownerUsername}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-purple-600 hover:text-purple-700 font-bold text-xs flex items-center gap-1 transition-colors"
                                >
                                    @{result.ownerUsername}
                                    <ExternalLink className="w-3 h-3" />
                                </a>
                            )}
                        </div>
                        {result.repositoryInfo && (
                            <div className="flex gap-4 text-xs font-bold text-slate-500 mb-4">
                                {result.repositoryInfo.stars !== undefined && (
                                    <span className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-slate-100">
                                        <span className="text-amber-500">⭐</span>
                                        {result.repositoryInfo.stars}
                                    </span>
                                )}
                                {result.repositoryInfo.forks !== undefined && (
                                    <span className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-slate-100">
                                        <span className="text-purple-500">🍴</span>
                                        {result.repositoryInfo.forks}
                                    </span>
                                )}
                            </div>
                        )}
                        {result.languages && Object.keys(result.languages).length > 0 && (
                            <div>
                                <div className="flex h-1.5 rounded-full overflow-hidden bg-slate-200">
                                    {Object.entries(result.languages).slice(0, 3).map(([lang, bytes]: [string, any], i) => {
                                        const total: number = Object.values(result.languages).reduce((a: any, b: any) => a + b, 0) as number;
                                        const percent = (bytes / total) * 100;
                                        const colors = ["bg-blue-500", "bg-amber-400", "bg-purple-500"];
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
                                <div className="flex flex-wrap gap-3 mt-3 text-[0.65rem] font-bold text-slate-400">
                                    {Object.keys(result.languages).slice(0, 3).map((lang, i) => (
                                        <span key={lang} className="flex items-center gap-1.5">
                                            <div className={`w-1.5 h-1.5 rounded-full ${["bg-blue-500", "bg-amber-400", "bg-purple-500"][i]}`} />
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
                        className="bg-white rounded-[1.5rem] p-6 border border-slate-100 xl:col-span-2 shadow-sm"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <BarChart3 className="w-5 h-5 text-purple-600" />
                            <p className="text-sm font-black text-slate-900 uppercase tracking-widest">{result.rubric?.name || selectedSkill} Mastery</p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {parsedData.criteriaScores.map((criteria, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.4 + i * 0.1 }}
                                >
                                    <div className="flex justify-between items-center mb-3">
                                        <span className="text-xs text-slate-600 font-bold truncate">{criteria.name}</span>
                                        <div className="flex items-center gap-2 ml-4">
                                            <span className={`text-base font-black ${getScoreColor(criteria.score)}`}>
                                                {criteria.score}
                                            </span>
                                            <span className="text-[0.65rem] font-bold text-slate-300">({criteria.weight}%)</span>
                                        </div>
                                    </div>
                                    <div className="relative w-full h-2 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${criteria.score}%` }}
                                            transition={{ duration: 1, delay: 0.5 + i * 0.1, ease: "easeOut" }}
                                            className={`h-full bg-slate-900 rounded-full`}
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
                        className="bg-slate-50 rounded-[1.5rem] p-6 border border-slate-100"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <FileCode className="w-5 h-5 text-blue-600" />
                            <p className="text-[0.6rem] font-black text-slate-400 uppercase tracking-widest">
                                Evidence Source ({parsedData.files.length} Files)
                            </p>
                        </div>
                        <div className="max-h-48 overflow-y-auto space-y-2 custom-scrollbar">
                            {parsedData.files.slice(0, 5).map((file, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.5 + i * 0.05 }}
                                    className="flex items-center justify-between bg-white rounded-xl p-3 border border-slate-100/50 hover:shadow-sm transition-all"
                                >
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <div className="bg-blue-50 p-1.5 rounded-lg">
                                            <FileCode className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                                        </div>
                                        <span className="text-xs text-slate-700 font-bold truncate">{file.path.split('/').pop()}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-[0.65rem] font-black text-slate-300 ml-4">
                                        <span>{file.lines} LINES</span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* AI Analysis Feedback - Compact */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-white rounded-[2rem] p-8 border border-slate-100 xl:col-span-3 flex flex-col shadow-xl shadow-slate-100"
                >
                    <div className="flex items-center gap-3 mb-8">
                        <TrendingUp className="w-6 h-6 text-emerald-600" />
                        <p className="text-sm font-black text-slate-900 uppercase tracking-widest">Advanced AI Insights</p>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-2">
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
                                    className={`flex items-start gap-4 text-sm p-4 rounded-2xl border ${isPositive ? 'bg-emerald-50 border-emerald-100 text-emerald-800' :
                                        isWarning ? 'bg-amber-50 border-amber-100 text-amber-800' :
                                            isError ? 'bg-red-50 border-red-100 text-red-800' :
                                                'bg-slate-50 border-slate-100 text-slate-700'
                                        } font-medium`}
                                >
                                    <div className={`mt-0.5 flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center font-bold ${isPositive ? 'bg-emerald-100 text-emerald-600' :
                                        isWarning ? 'bg-amber-100 text-amber-600' :
                                            isError ? 'bg-red-100 text-red-600' :
                                                'bg-slate-200 text-slate-500'
                                        }`}>
                                        {isPositive ? '✓' : isWarning ? '⚠' : isError ? '❌' : '•'}
                                    </div>
                                    <span className="flex-1 leading-relaxed">{f.replace(/^[✓⚠❌•]\s*/, '')}</span>
                                </motion.div>
                            );
                        })}
                    </div>
                </motion.div>
            </div>

            {/* Mint Button - Full Width */}
            <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                onClick={onMint}
                disabled={minting || result.score < 70}
                whileHover={!minting && result.score >= 70 ? { y: -1 } : {}}
                whileTap={!minting && result.score >= 70 ? { scale: 0.98 } : {}}
                className={`w-full py-5 rounded-2xl font-black text-xs tracking-[0.3em] text-white shadow-2xl transition-all flex items-center justify-center gap-3 ${result.score < 70
                    ? "bg-zinc-100 text-zinc-400 cursor-not-allowed border border-zinc-200"
                    : "bg-zinc-950 hover:bg-zinc-800"
                    }`}
            >
                {minting ? (
                    <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        MINTING ATTESTATION...
                    </>
                ) : result.score < 70 ? (
                    `INSUFFICIENT DELTA (MIN 70%)`
                ) : (
                    <>
                        <Award className="w-4 h-4" />
                        ATTEST PROOF TO LEDGER
                    </>
                )}
            </motion.button>
        </div>
    );
}

