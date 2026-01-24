"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, CheckCircle, Code, FileQuestion, Award, BarChart3, FileCode, TrendingUp, ExternalLink, Sparkles, XCircle } from "lucide-react";
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
        // Don't auto-proceed, wait for user to click Next button
    };

    const handleMCQNext = async () => {
        if (mcqScore === null || mcqScore < 70) {
            return; // Can't proceed if not passed
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

        // Don't auto-advance, let user click Next
    };

    const handleChallengeNext = () => {
        if (currentChallengeIndex < codingChallenges.length - 1) {
            // Move to next challenge instantly
            setCurrentChallengeIndex(currentChallengeIndex + 1);
        } else {
            // All challenges completed, show final report
            setPhase("completed");
            // Calculate final score (MCQ 40% + Coding 60%)
            const finalScore = Math.round((mcqScore || 0) * 0.4 + 100 * 0.6);
            onComplete(finalScore);
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

    if (loading && phase === "mcq") {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <div className="relative w-24 h-24 mb-6">
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
                    <p className="text-2xl font-black text-white">Generating Coding Challenges...</p>
                    <p className="text-gray-400 font-medium">Creating personalized challenges based on your repository</p>
                </motion.div>
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
            <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-800">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-4">
                        <div className={`flex items-center gap-2 ${
                            phase === "mcq" || phase === "coding" || phase === "completed"
                                ? "text-green-400"
                                : "text-gray-500"
                        }`}>
                            <FileQuestion className="w-5 h-5" />
                            <span className="text-sm font-medium">MCQ Test</span>
                            {phase !== "preparing" && phase !== "mcq" && (
                                <CheckCircle className="w-4 h-4" />
                            )}
                        </div>
                        <div className="w-8 h-0.5 bg-gray-700" />
                        <div className={`flex items-center gap-2 ${
                            phase === "coding" || phase === "completed"
                                ? "text-green-400"
                                : "text-gray-500"
                        }`}>
                            <Code className="w-5 h-5" />
                            <span className="text-sm font-medium">Coding Challenges</span>
                            {phase === "completed" && (
                                <CheckCircle className="w-4 h-4" />
                            )}
                        </div>
                    </div>
                    {mcqScore !== null && (
                        <span className="text-sm text-gray-400">MCQ Score: {mcqScore}%</span>
                    )}
                </div>
            </div>

            {/* Phase Content */}
            <AnimatePresence mode="wait">
                {phase === "mcq" && (
                    <motion.div
                        key="mcq"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.1 }}
                    >
                        <MCQTest
                            questions={mcqQuestions}
                            onComplete={handleMCQComplete}
                            onRetry={handleMCQRetry}
                            onNext={handleMCQNext}
                        />
                    </motion.div>
                )}

                {phase === "coding" && codingChallenges.length > 0 && (
                    <motion.div
                        key="coding"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.1 }}
                    >
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-xl font-bold text-white">
                                Challenge {currentChallengeIndex + 1} of {codingChallenges.length}
                            </h3>
                            <div className="flex gap-2">
                                {codingChallenges.map((_, idx) => (
                                    <div
                                        key={idx}
                                        className={`w-3 h-3 rounded-full ${
                                            idx < currentChallengeIndex
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
                            isLastChallenge={currentChallengeIndex === codingChallenges.length - 1}
                        />
                    </motion.div>
                )}

                {phase === "completed" && (
                    <motion.div
                        key="completed"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="space-y-6"
                    >
                        {/* Success Header */}
                        <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-2xl p-8 border-2 border-green-500/50 text-center">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", delay: 0.2 }}
                            >
                                <CheckCircle className="w-20 h-20 text-green-400 mx-auto mb-4" />
                            </motion.div>
                            <h3 className="text-4xl font-black text-green-400 mb-2">All Tests Passed! 🎉</h3>
                            <p className="text-gray-300 mb-6 text-lg">
                                Congratulations! You've successfully completed all MCQ questions and coding challenges.
                            </p>
                            <div className="bg-gray-900/50 rounded-xl p-6 inline-block border border-green-500/30">
                                <p className="text-sm text-gray-400 mb-2 font-bold uppercase tracking-wider">Final Score</p>
                                <p className="text-5xl font-black text-white">
                                    {Math.round((mcqScore || 0) * 0.4 + 100 * 0.6)}/100
                                </p>
                                <p className="text-xs text-gray-400 mt-2">
                                    MCQ: {mcqScore || 0}% (40%) + Coding: 100% (60%)
                                </p>
                            </div>
                        </div>

                        {/* Comprehensive Analysis Report */}
                        <div className="bg-gray-900/50 rounded-2xl p-6 border border-gray-800">
                            <div className="flex items-center gap-3 mb-6">
                                <BarChart3 className="w-6 h-6 text-purple-400" />
                                <h4 className="text-2xl font-bold text-white">Comprehensive Analysis Report</h4>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                {/* Test Performance Metrics */}
                                <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700">
                                    <h5 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                        <Award className="w-5 h-5 text-yellow-400" />
                                        Test Performance
                                    </h5>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-400">MCQ Score</span>
                                            <span className="text-white font-bold">{mcqScore || 0}%</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-400">MCQ Questions</span>
                                            <span className="text-white font-bold">{mcqQuestions.length}/10</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-400">Coding Challenges</span>
                                            <span className="text-white font-bold">{codingChallenges.length}/3</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-400">Challenges Passed</span>
                                            <span className="text-green-400 font-bold">{challengeResults.filter(r => r).length}/{codingChallenges.length}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Repository Analysis */}
                                <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700">
                                    <h5 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                        <FileCode className="w-5 h-5 text-blue-400" />
                                        Repository Analysis
                                    </h5>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-400">Files Analyzed</span>
                                            <span className="text-white font-bold">{repoAnalysis.files.length}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-400">Skill</span>
                                            <span className="text-white font-bold">{skill}</span>
                                        </div>
                                        {repoAnalysis.owner && (
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-400">Repository Owner</span>
                                                <span className="text-white font-bold">{repoAnalysis.owner}</span>
                                            </div>
                                        )}
                                        {repoAnalysis.languages && Object.keys(repoAnalysis.languages).length > 0 && (
                                            <div>
                                                <span className="text-gray-400 text-sm">Languages: </span>
                                                <span className="text-white font-bold text-sm">
                                                    {Object.keys(repoAnalysis.languages).slice(0, 3).join(", ")}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Detailed Metrics */}
                            <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700 mb-6">
                                <h5 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5 text-green-400" />
                                    Detailed Metrics
                                </h5>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="text-center">
                                        <div className="text-3xl font-black text-purple-400 mb-1">{mcqScore || 0}%</div>
                                        <div className="text-xs text-gray-400 uppercase tracking-wider">MCQ Accuracy</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-3xl font-black text-green-400 mb-1">100%</div>
                                        <div className="text-xs text-gray-400 uppercase tracking-wider">Code Quality</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-3xl font-black text-blue-400 mb-1">{repoAnalysis.files.length}</div>
                                        <div className="text-xs text-gray-400 uppercase tracking-wider">Files Reviewed</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-3xl font-black text-yellow-400 mb-1">
                                            {Math.round((mcqScore || 0) * 0.4 + 100 * 0.6)}%
                                        </div>
                                        <div className="text-xs text-gray-400 uppercase tracking-wider">Overall Score</div>
                                    </div>
                                </div>
                            </div>

                            {/* Test Breakdown */}
                            <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700">
                                <h5 className="text-lg font-bold text-white mb-4">Test Breakdown</h5>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <FileQuestion className="w-5 h-5 text-purple-400" />
                                            <span className="text-white font-medium">MCQ Test</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-gray-400">Score: {mcqScore || 0}%</span>
                                            <CheckCircle className="w-5 h-5 text-green-400" />
                                        </div>
                                    </div>
                                    {codingChallenges.map((challenge, idx) => (
                                        <div key={challenge.id} className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <Code className="w-5 h-5 text-blue-400" />
                                                <span className="text-white font-medium">Challenge {idx + 1}: {challenge.title}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-gray-400">
                                                    {challenge.testCases.length} test cases
                                                </span>
                                                {challengeResults[idx] ? (
                                                    <CheckCircle className="w-5 h-5 text-green-400" />
                                                ) : (
                                                    <XCircle className="w-5 h-5 text-red-400" />
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Certificate & Transaction Info */}
                        <div className="bg-gradient-to-br from-purple-500/10 to-indigo-500/10 rounded-2xl p-6 border border-purple-500/30">
                            <div className="flex items-center gap-3 mb-4">
                                <Sparkles className="w-6 h-6 text-purple-400" />
                                <h4 className="text-xl font-bold text-white">Ready to Mint Credential</h4>
                            </div>
                            <p className="text-gray-300 mb-4">
                                Your comprehensive evaluation is complete. You can now mint your skill credential as a soulbound NFT on the Stellar blockchain.
                            </p>
                            <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700">
                                <p className="text-sm text-gray-400 mb-2">What happens next:</p>
                                <ul className="space-y-2 text-sm text-gray-300">
                                    <li className="flex items-start gap-2">
                                        <span className="text-purple-400 mt-1">•</span>
                                        <span>Click "Mint Credential" to create your on-chain credential</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-purple-400 mt-1">•</span>
                                        <span>Your credential will be permanently stored on Stellar blockchain</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-purple-400 mt-1">•</span>
                                        <span>Employers can verify your skills by checking your wallet address</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

