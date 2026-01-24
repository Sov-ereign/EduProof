"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, CheckCircle, Code, FileQuestion } from "lucide-react";
import MCQTest, { type MCQQuestion } from "./MCQTest";
import CodeEditor, { type CodingChallenge } from "./CodeEditor";

export interface RepoAnalysis {
    files: Array<{
        path: string;
        content: string;
        extension: string;
    }>;
    readme?: string;
    languages?: Record<string, number>;
    skill: string;
    owner?: string;
    repositoryInfo?: any;
}

interface TestFlowContainerProps {
    repoAnalysis: RepoAnalysis;
    skill: string;
    onComplete: (finalScore: number) => void;
}

type TestPhase = "preparing" | "mcq" | "coding" | "completed";

export default function TestFlowContainer({ repoAnalysis, skill, onComplete }: TestFlowContainerProps) {
    const [phase, setPhase] = useState<TestPhase>("preparing");
    const [mcqQuestions, setMcqQuestions] = useState<MCQQuestion[]>([]);
    const [codingChallenges, setCodingChallenges] = useState<CodingChallenge[]>([]);
    const [currentChallengeIndex, setCurrentChallengeIndex] = useState(0);
    const [challengeResults, setChallengeResults] = useState<boolean[]>([]);
    const [mcqScore, setMcqScore] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Generate MCQs on mount
    useEffect(() => {
        generateMCQs();
    }, []);

    const generateMCQs = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch("/api/evaluate/generate-mcqs", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ repoAnalysis, skill })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to generate MCQs");
            }

            const data = await response.json();
            setMcqQuestions(data.questions || []);
            setPhase("mcq");
        } catch (e: any) {
            console.error("Error generating MCQs:", e);
            setError(e.message || "Failed to generate test questions");
        } finally {
            setLoading(false);
        }
    };

    const handleMCQComplete = async (score: number, passed: boolean) => {
        setMcqScore(score);

        if (!passed) {
            // User failed, can retry
            return;
        }

        // Generate coding challenges
        setLoading(true);
        try {
            const response = await fetch("/api/evaluate/generate-coding-challenges", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ repoAnalysis, skill })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to generate coding challenges");
            }

            const data = await response.json();
            setCodingChallenges(data.challenges || []);
            setPhase("coding");
            setCurrentChallengeIndex(0);
            setChallengeResults([]);
        } catch (e: any) {
            console.error("Error generating coding challenges:", e);
            setError(e.message || "Failed to generate coding challenges");
        } finally {
            setLoading(false);
        }
    };

    const handleChallengeComplete = (passed: boolean) => {
        const newResults = [...challengeResults];
        newResults[currentChallengeIndex] = passed;
        setChallengeResults(newResults);

        if (passed && currentChallengeIndex < codingChallenges.length - 1) {
            // Move to next challenge
            setCurrentChallengeIndex(currentChallengeIndex + 1);
        } else if (passed && currentChallengeIndex === codingChallenges.length - 1) {
            // All challenges passed
            setPhase("completed");
            // Calculate final score (MCQ 40% + Coding 60%)
            const finalScore = Math.round((mcqScore || 0) * 0.4 + 100 * 0.6);
            onComplete(finalScore);
        }
    };

    const handleChallengeNext = () => {
        if (currentChallengeIndex < codingChallenges.length - 1) {
            setCurrentChallengeIndex(currentChallengeIndex + 1);
        }
    };

    const handleMCQRetry = () => {
        setMcqScore(null);
        setPhase("mcq");
        generateMCQs();
    };

    if (loading && phase === "preparing") {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-12 h-12 animate-spin text-purple-400 mb-4" />
                <p className="text-gray-400">Preparing your test questions...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-6">
                <p className="text-red-400 font-medium mb-2">Error</p>
                <p className="text-red-300 text-sm">{error}</p>
                <button
                    onClick={() => {
                        setError(null);
                        setPhase("preparing");
                        generateMCQs();
                    }}
                    className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
                >
                    Try Again
                </button>
            </div>
        );
    }

    return (
        <div className="w-full space-y-6">
            {/* Progress Indicator */}
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 border border-slate-200/50 shadow-2xl shadow-slate-900/5 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-50/50 via-transparent to-indigo-50/50 -z-10" />
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <div className={`flex items-center gap-3 transition-all duration-500 ${phase === "mcq" || phase === "coding" || phase === "completed"
                                ? "text-purple-600 scale-105"
                                : "text-slate-400 grayscale"
                            }`}>
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${phase === "mcq" ? "bg-purple-600 text-white shadow-lg shadow-purple-200" : "bg-slate-100"
                                }`}>
                                <FileQuestion className="w-5 h-5" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Phase I</span>
                                <span className="text-sm font-black tracking-tight">Theory Aptitude</span>
                            </div>
                            {phase !== "preparing" && phase !== "mcq" && (
                                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                                    <CheckCircle className="w-5 h-5 text-emerald-500" fill="currentColor" />
                                </motion.div>
                            )}
                        </div>

                        <div className="hidden sm:block w-12 h-px bg-slate-200" />

                        <div className={`flex items-center gap-3 transition-all duration-500 ${phase === "coding" || phase === "completed"
                                ? "text-indigo-600 scale-105"
                                : "text-slate-400 grayscale"
                            }`}>
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${phase === "coding" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" : "bg-slate-100"
                                }`}>
                                <Code className="w-5 h-5" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Phase II</span>
                                <span className="text-sm font-black tracking-tight">Active Execution</span>
                            </div>
                            {phase === "completed" && (
                                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                                    <CheckCircle className="w-5 h-5 text-emerald-500" fill="currentColor" />
                                </motion.div>
                            )}
                        </div>
                    </div>
                    {mcqScore !== null && (
                        <div className="bg-slate-900 text-white px-4 py-2 rounded-xl border border-slate-800 shadow-lg">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">Performance</span>
                            <span className="text-sm font-black font-mono">{mcqScore}% MCQ Accuracy</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Phase Content */}
            <AnimatePresence mode="wait">
                {phase === "mcq" && (
                    <motion.div
                        key="mcq"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                    >
                        <MCQTest
                            questions={mcqQuestions}
                            onComplete={handleMCQComplete}
                            onRetry={handleMCQRetry}
                        />
                    </motion.div>
                )}

                {phase === "coding" && codingChallenges.length > 0 && (
                    <motion.div
                        key="coding"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                    >
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-xl font-bold text-white">
                                Challenge {currentChallengeIndex + 1} of {codingChallenges.length}
                            </h3>
                            <div className="flex gap-2">
                                {codingChallenges.map((_, idx) => (
                                    <div
                                        key={idx}
                                        className={`w-3 h-3 rounded-full ${idx < currentChallengeIndex
                                                ? "bg-green-500"
                                                : idx === currentChallengeIndex
                                                    ? "bg-purple-500"
                                                    : "bg-gray-700"
                                            }`}
                                    />
                                ))}
                            </div>
                        </div>
                        <CodeEditor
                            challenge={codingChallenges[currentChallengeIndex]}
                            language={skill}
                            onComplete={handleChallengeComplete}
                            onNext={handleChallengeNext}
                        />
                    </motion.div>
                )}

                {phase === "completed" && (
                    <motion.div
                        key="completed"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-xl p-8 border-2 border-green-500/50 text-center"
                    >
                        <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                        <h3 className="text-3xl font-bold text-green-400 mb-2">All Tests Passed!</h3>
                        <p className="text-gray-300 mb-4">
                            Congratulations! You've successfully completed all MCQ questions and coding challenges.
                        </p>
                        <div className="bg-gray-900/50 rounded-lg p-4 inline-block">
                            <p className="text-sm text-gray-400 mb-1">Final Score</p>
                            <p className="text-2xl font-bold text-white">
                                {Math.round((mcqScore || 0) * 0.4 + 100 * 0.6)}/100
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

