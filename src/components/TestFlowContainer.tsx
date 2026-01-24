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
    const [generatingReport, setGeneratingReport] = useState(false);
    const [mcqCorrectCount, setMcqCorrectCount] = useState<number>(0);
    const [mcqGenerated, setMcqGenerated] = useState(false);
    const [finalScoreBreakdown, setFinalScoreBreakdown] = useState<any>(null);
    const [codeQualityFeedback, setCodeQualityFeedback] = useState<string[]>([]);
    const [codeReadability, setCodeReadability] = useState<any>(null);
    const [repoQuality, setRepoQuality] = useState<any>(null);

    // Generate MCQs on mount (only once)
    useEffect(() => {
        if (!mcqGenerated) {
            generateMCQs();
            setMcqGenerated(true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
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

    const handleMCQComplete = async (score: number, passed: boolean, correctCount?: number) => {
        setMcqScore(score);
        if (correctCount !== undefined) {
            setMcqCorrectCount(correctCount);
        }
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

    const handleChallengeNext = async () => {
        if (currentChallengeIndex < codingChallenges.length - 1) {
            // Move to next challenge instantly
            setCurrentChallengeIndex(currentChallengeIndex + 1);
        } else {
            // All challenges completed, calculate final score with new breakdown
            setGeneratingReport(true);
            setLoading(true);
            
            try {
                // Import analysis functions
                const { analyzeCodeReadability, analyzeRepoQuality } = await import('@/lib/repo-analyzer');
                
                // Calculate MCQ + Coding score (80 points combined) FIRST
                const mcqPercentage = mcqScore || 0;
                const codingPassed = challengeResults.filter(r => r).length;
                const codingTotal = codingChallenges.length;
                const codingPercentage = codingTotal > 0 ? (codingPassed / codingTotal) * 100 : 0;
                
                // Combined MCQ + Coding: 80 points
                // Split: MCQ 40 points, Coding 40 points
                const mcqContribution = (mcqPercentage / 100) * 40;
                const codingContribution = (codingPercentage / 100) * 40;
                const testScore = mcqContribution + codingContribution;
                
                // Debug logging
                console.log('📊 Score Calculation Debug:', {
                    mcqPercentage,
                    mcqContribution,
                    codingPercentage,
                    codingContribution,
                    testScore,
                    filesCount: repoAnalysis.files?.length || 0
                });
                
                // Calculate code readability score (10 points)
                const readability = analyzeCodeReadability(repoAnalysis.files || []);
                setCodeReadability(readability);
                
                // Calculate repo quality score (10 points)
                const quality = analyzeRepoQuality(repoAnalysis.readme, repoAnalysis.repositoryInfo);
                setRepoQuality(quality);
                
                // Code Readability: 10 points
                const readabilityScore = readability.score;
                
                // Repo Quality: 10 points
                const qualityScore = quality.score;
                
                // Debug logging
                console.log('📊 Final Score Breakdown:', {
                    testScore,
                    readabilityScore,
                    qualityScore,
                    total: testScore + readabilityScore + qualityScore
                });
                
                // Final score
                const finalScore = Math.round(testScore + readabilityScore + qualityScore);
                
                // Create breakdown
                const breakdown = {
                    test: {
                        mcq: {
                            score: mcqPercentage,
                            correct: mcqCorrectCount,
                            total: mcqQuestions.length,
                            contribution: mcqContribution,
                            maxPoints: 40
                        },
                        coding: {
                            score: codingPercentage,
                            passed: codingPassed,
                            total: codingTotal,
                            allPassed: codingPassed === codingTotal,
                            contribution: codingContribution,
                            maxPoints: 40
                        },
                        total: testScore,
                        maxPoints: 80
                    },
                    readability: {
                        score: readabilityScore,
                        maxPoints: 10,
                        ratio: readability.ratio,
                        codeLines: readability.codeLines,
                        commentLines: readability.commentLines,
                        feedback: readability.feedback
                    },
                    repoQuality: {
                        score: qualityScore,
                        maxPoints: 10,
                        feedback: quality.feedback
                    },
                    final: finalScore
                };
                
                setFinalScoreBreakdown(breakdown);
                
                // Small delay for better UX
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                setPhase("completed");
                onComplete(finalScore);
            } catch (error: any) {
                console.error("Error calculating final score:", error);
                setError(error.message || "Failed to generate final report");
            } finally {
                setLoading(false);
                setGeneratingReport(false);
            }
        }
    };

    const handleMCQRetry = () => {
        setMcqScore(null);
        setMcqCorrectCount(0);
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

    if (generatingReport) {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <div className="relative w-24 h-24 mb-6">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 border-4 border-green-200 border-t-green-600 rounded-full"
                    />
                    <motion.div
                        animate={{ rotate: -360 }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-4 border-4 border-emerald-200 border-t-emerald-600 rounded-full"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center">
                            <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
                        </div>
                    </div>
                </div>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center space-y-2"
                >
                    <p className="text-2xl font-black text-white">Report is being generated...</p>
                    <p className="text-gray-400 font-medium">Compiling your comprehensive evaluation results</p>
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
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.1 }}
                    >
                        <MCQTest
                            questions={mcqQuestions}
                            onComplete={(score, passed, correctCount) => handleMCQComplete(score, passed, correctCount)}
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
                                    {finalScoreBreakdown ? finalScoreBreakdown.final : 0}/100
                                </p>
                                <p className="text-xs text-gray-400 mt-2">
                                    {finalScoreBreakdown ? (
                                        <>
                                            Tests: {Math.round(finalScoreBreakdown.test.total)}/80 + 
                                            Readability: {Math.round(finalScoreBreakdown.readability.score)}/10 + 
                                            Repo Quality: {Math.round(finalScoreBreakdown.repoQuality.score)}/10
                                        </>
                                    ) : (
                                        "Calculating..."
                                    )}
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
                                            <span className="text-gray-400">MCQ Correct</span>
                                            <span className="text-white font-bold">{mcqCorrectCount}/{mcqQuestions.length}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-400">MCQ Points</span>
                                            <span className="text-white font-bold">
                                                {finalScoreBreakdown ? Math.round(finalScoreBreakdown.test.mcq.contribution) : 0}/40
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-400">Coding Challenges</span>
                                            <span className="text-white font-bold">{codingChallenges.length}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-400">All Test Cases Passed</span>
                                            <span className={`font-bold ${finalScoreBreakdown?.test.coding.allPassed ? 'text-green-400' : 'text-yellow-400'}`}>
                                                {finalScoreBreakdown?.test.coding.allPassed ? '✓ Yes' : '✗ No'} ({challengeResults.filter(r => r).length}/{codingChallenges.length})
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-400">Coding Points</span>
                                            <span className="text-white font-bold">
                                                {finalScoreBreakdown ? Math.round(finalScoreBreakdown.test.coding.contribution) : 0}/40
                                            </span>
                                        </div>
                                        <div className="pt-2 border-t border-gray-700">
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-300 font-bold">Total Test Score</span>
                                                <span className="text-white font-bold text-lg">
                                                    {finalScoreBreakdown ? Math.round(finalScoreBreakdown.test.total) : 0}/80
                                                </span>
                                            </div>
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
                                        {repoAnalysis.repositoryInfo?.name && (
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-400">Repository Name</span>
                                                <span className="text-white font-bold">{repoAnalysis.repositoryInfo.name}</span>
                                            </div>
                                        )}
                                        {repoAnalysis.repositoryInfo?.fullName && (
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-400">Full Name</span>
                                                <span className="text-white font-bold text-sm">{repoAnalysis.repositoryInfo.fullName}</span>
                                            </div>
                                        )}
                                        {repoAnalysis.repositoryInfo?.description && (
                                            <div>
                                                <span className="text-gray-400 text-sm block mb-1">Description</span>
                                                <span className="text-white font-bold text-sm">{repoAnalysis.repositoryInfo.description}</span>
                                            </div>
                                        )}
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
                                        {repoAnalysis.repositoryInfo?.stars !== undefined && (
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-400">Stars</span>
                                                <span className="text-white font-bold">{repoAnalysis.repositoryInfo.stars}</span>
                                            </div>
                                        )}
                                        {repoAnalysis.repositoryInfo?.forks !== undefined && (
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-400">Forks</span>
                                                <span className="text-white font-bold">{repoAnalysis.repositoryInfo.forks}</span>
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

                            {/* Code Readability Analysis */}
                            {codeReadability && (
                                <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700 mb-6">
                                    <h5 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                        <FileCode className="w-5 h-5 text-blue-400" />
                                        Code Readability Analysis
                                        <span className="ml-auto text-sm font-bold text-blue-400">
                                            {Math.round(codeReadability.score)}/10 points
                                        </span>
                                    </h5>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-400">Code Lines</span>
                                            <span className="text-white font-bold">{codeReadability.codeLines}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-400">Comment Lines</span>
                                            <span className="text-white font-bold">{codeReadability.commentLines}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-400">Comment Ratio</span>
                                            <span className="text-white font-bold">{codeReadability.ratio.toFixed(1)}%</span>
                                        </div>
                                        <div className="pt-3 border-t border-gray-700 space-y-2">
                                            {codeReadability.feedback.map((fb: string, i: number) => (
                                                <p key={i} className="text-sm text-gray-300">{fb}</p>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Repository Quality Analysis */}
                            {repoQuality && (
                                <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700 mb-6">
                                    <h5 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                        <TrendingUp className="w-5 h-5 text-green-400" />
                                        Repository Quality
                                        <span className="ml-auto text-sm font-bold text-green-400">
                                            {Math.round(repoQuality.score)}/10 points
                                        </span>
                                    </h5>
                                    <div className="space-y-3">
                                        {repoAnalysis.repositoryInfo && (
                                            <>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-gray-400">Stars</span>
                                                    <span className="text-white font-bold">{repoAnalysis.repositoryInfo.stars || 0}</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-gray-400">Forks</span>
                                                    <span className="text-white font-bold">{repoAnalysis.repositoryInfo.forks || 0}</span>
                                                </div>
                                            </>
                                        )}
                                        <div className="pt-3 border-t border-gray-700 space-y-2">
                                            {repoQuality.feedback.map((fb: string, i: number) => (
                                                <p key={i} className="text-sm text-gray-300">{fb}</p>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Point-by-Point Summary */}
                            <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700 mb-6">
                                <h5 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                    <BarChart3 className="w-5 h-5 text-purple-400" />
                                    Point-by-Point Summary
                                </h5>
                                <div className="space-y-3">
                                    <div className="flex items-start gap-3 p-3 bg-gray-900/50 rounded-lg">
                                        <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <span className="text-white font-bold">MCQ Assessment: </span>
                                            <span className="text-gray-300">
                                                Answered {mcqCorrectCount} out of {mcqQuestions.length} questions correctly, achieving a score of {mcqScore || 0}%.
                                                {mcqScore && mcqScore >= 70 ? " Passed the theoretical knowledge assessment." : " Did not meet the 70% passing threshold."}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 p-3 bg-gray-900/50 rounded-lg">
                                        <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <span className="text-white font-bold">Coding Challenges: </span>
                                            <span className="text-gray-300">
                                                Completed {challengeResults.filter(r => r).length} out of {codingChallenges.length} coding challenges successfully.
                                                {challengeResults.filter(r => r).length === codingChallenges.length ? " All challenges passed, demonstrating strong practical coding skills." : " Some challenges need improvement."}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 p-3 bg-gray-900/50 rounded-lg">
                                        <CheckCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <span className="text-white font-bold">Repository Analysis: </span>
                                            <span className="text-gray-300">
                                                Analyzed {repoAnalysis.files.length} files from the repository.
                                                {repoAnalysis.repositoryInfo?.description && ` Repository focuses on: ${repoAnalysis.repositoryInfo.description.substring(0, 100)}${repoAnalysis.repositoryInfo.description.length > 100 ? '...' : ''}`}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 p-3 bg-gray-900/50 rounded-lg">
                                        <CheckCircle className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <span className="text-white font-bold">Overall Performance: </span>
                                            <span className="text-gray-300">
                                                Final score: {finalScoreBreakdown ? finalScoreBreakdown.final : 0}/100.
                                                Breakdown: Tests {finalScoreBreakdown ? Math.round(finalScoreBreakdown.test.total) : 0}/80, 
                                                Readability {codeReadability ? Math.round(codeReadability.score) : 0}/10, 
                                                Repo Quality {repoQuality ? Math.round(repoQuality.score) : 0}/10.
                                                {finalScoreBreakdown && finalScoreBreakdown.final >= 70 ? " Excellent performance across all assessment criteria." : " Good effort with room for improvement in certain areas."}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Score Breakdown */}
                            <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700 mb-6">
                                <h5 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                    <BarChart3 className="w-5 h-5 text-purple-400" />
                                    Score Breakdown
                                </h5>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="text-center">
                                        <div className="text-3xl font-black text-purple-400 mb-1">
                                            {finalScoreBreakdown ? Math.round(finalScoreBreakdown.test.total) : 0}
                                        </div>
                                        <div className="text-xs text-gray-400 uppercase tracking-wider">Tests (80 max)</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-3xl font-black text-blue-400 mb-1">
                                            {codeReadability ? Math.round(codeReadability.score) : 0}
                                        </div>
                                        <div className="text-xs text-gray-400 uppercase tracking-wider">Readability (10 max)</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-3xl font-black text-green-400 mb-1">
                                            {repoQuality ? Math.round(repoQuality.score) : 0}
                                        </div>
                                        <div className="text-xs text-gray-400 uppercase tracking-wider">Repo Quality (10 max)</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-3xl font-black text-yellow-400 mb-1">
                                            {finalScoreBreakdown ? finalScoreBreakdown.final : 0}
                                        </div>
                                        <div className="text-xs text-gray-400 uppercase tracking-wider">Final Score</div>
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

