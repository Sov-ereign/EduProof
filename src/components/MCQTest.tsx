"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, AlertCircle, RotateCcw, Loader2, Sparkles, ChevronRight, Video, VideoOff, Shield, AlertTriangle } from "lucide-react";
import { useAntiCheat } from "@/hooks/useAntiCheat";

export interface MCQQuestion {
    id: string;
    question: string;
    options: string[];
    correctAnswer: number;
    explanation?: string;
}

interface MCQTestProps {
    questions: MCQQuestion[];
    onComplete: (score: number, passed: boolean, correctCount?: number) => void;
    onRetry?: () => void;
    onNext?: () => void;
}

export default function MCQTest({ questions, onComplete, onRetry, onNext }: MCQTestProps) {
    const [answers, setAnswers] = useState<Record<string, number>>({});
    const [submitted, setSubmitted] = useState(false);
    const [score, setScore] = useState<number | null>(null);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [showAll, setShowAll] = useState(false);
    const [showCameraWarning, setShowCameraWarning] = useState(false);

    // Anti-cheat system
    const { status, start, stop, isBlocked } = useAntiCheat({
        onViolation: (type) => {
            console.warn(`Anti-cheat violation: ${type}`);
        },
        onWarning: (message) => {
            setShowCameraWarning(true);
            setTimeout(() => setShowCameraWarning(false), 5000);
        },
        maxViolations: 3
    });

    // Start anti-cheat when component mounts
    useEffect(() => {
        start();
        return () => {
            stop();
        };
    }, [start, stop]);

    // Block submission if too many violations
    useEffect(() => {
        if (isBlocked && !submitted) {
            alert("Test blocked due to multiple violations. Please maintain focus and camera visibility.");
        }
    }, [isBlocked, submitted]);

    const handleAnswer = (questionId: string, answerIndex: number) => {
        if (submitted) return;
        setAnswers(prev => ({ ...prev, [questionId]: answerIndex }));
    };

    const handleSubmit = () => {
        if (Object.keys(answers).length < questions.length) {
            alert("Please answer all questions before submitting.");
            return;
        }

        // Calculate score
        let correct = 0;
        questions.forEach(q => {
            if (answers[q.id] === q.correctAnswer) {
                correct++;
            }
        });

        const calculatedScore = Math.round((correct / questions.length) * 100);
        setScore(calculatedScore);
        setSubmitted(true);

        // Check if passed (≥70%)
        const passed = calculatedScore >= 70;
        onComplete(calculatedScore, passed, correct);
    };

    const handleRetry = () => {
        setAnswers({});
        setSubmitted(false);
        setScore(null);
        setCurrentQuestion(0);
        if (onRetry) {
            onRetry();
        }
    };

    const handleMaster = () => {
        // Auto-select all correct answers
        const masterAnswers: Record<string, number> = {};
        questions.forEach(q => {
            masterAnswers[q.id] = q.correctAnswer;
        });
        setAnswers(masterAnswers);

        // Auto-submit with full marks after a brief delay
        setTimeout(() => {
            const calculatedScore = 100; // Full marks
            setScore(calculatedScore);
            setSubmitted(true);
            onComplete(calculatedScore, true, questions.length); // Always passes with master mode
        }, 500);
    };

    const handleNext = () => {
        if (currentQuestion < questions.length - 1) {
            setCurrentQuestion(currentQuestion + 1);
        }
    };

    const handlePrevious = () => {
        if (currentQuestion > 0) {
            setCurrentQuestion(currentQuestion - 1);
        }
    };

    const allAnswered = Object.keys(answers).length === questions.length;

    if (submitted && score !== null) {
        const passed = score >= 70;
        const correctCount = questions.filter(q => answers[q.id] === q.correctAnswer).length;

        return (
            <div className="w-full">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`rounded-[2rem] p-10 border-2 shadow-2xl overflow-hidden relative ${passed
                        ? "bg-emerald-500/5 border-emerald-500/30"
                        : "bg-rose-500/5 border-rose-500/30"
                        }`}
                >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-slate-900/50 -z-10 blur-3xl opacity-20" />
                    <div className="flex flex-col md:flex-row items-center gap-8 mb-10 relative z-10">
                        <div className={`w-24 h-24 rounded-3xl flex items-center justify-center shadow-lg ${passed ? "bg-emerald-500" : "bg-rose-500"
                            }`}>
                            {passed ? (
                                <CheckCircle className="w-12 h-12 text-white" />
                            ) : (
                                <XCircle className="w-12 h-12 text-white" />
                            )}
                        </div>
                        <div className="text-center md:text-left">
                            <h3 className={`text-4xl font-black mb-2 tracking-tight ${passed ? "text-emerald-500" : "text-rose-500"}`}>
                                {passed ? "Phase I: Cleared" : "Phase I: Failed"}
                            </h3>
                            <div className="flex items-center gap-3 justify-center md:justify-start">
                                <span className="text-slate-400 font-bold uppercase tracking-widest text-xs">Aptitude Score:</span>
                                <span className={`text-2xl font-black ${passed ? "text-emerald-400" : "text-rose-400"}`}>
                                    {score}%
                                </span>
                                <span className="text-slate-600 font-medium bg-slate-800 px-3 py-1 rounded-full text-[10px] uppercase tracking-tighter">
                                    {correctCount}/{questions.length} CORRECT
                                </span>
                            </div>
                        </div>
                    </div>

                    {!passed && (
                        <div className="mt-4">
                            <p className="text-red-300 mb-2">
                                You need at least 70% to proceed. You scored {score}%.
                            </p>
                            <button
                                onClick={handleRetry}
                                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center gap-2 transition"
                            >
                                <RotateCcw className="w-4 h-4" />
                                Retry Test
                            </button>
                        </div>
                    )}

                    {passed && (
                        <div className="mt-4">
                            <p className="text-green-300 mb-4">
                                Great job! You can now proceed to the coding challenges.
                            </p>
                            {onNext && (
                                <motion.button
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    onClick={onNext}
                                    className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:opacity-90 text-white rounded-xl font-bold transition flex items-center justify-center gap-2"
                                >
                                    Continue to Coding Challenges
                                    <ChevronRight className="w-5 h-5" />
                                </motion.button>
                            )}
                        </div>
                    )}
                </motion.div>

                {/* Show detailed results */}
                <div className="mt-6 space-y-4">
                    <h4 className="text-lg font-semibold text-gray-300">Question Review</h4>
                    {questions.map((q, index) => {
                        const userAnswer = answers[q.id];
                        const isCorrect = userAnswer === q.correctAnswer;

                        return (
                            <motion.div
                                key={q.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className={`p-6 rounded-2xl border-2 transition-all relative overflow-hidden ${isCorrect
                                    ? "bg-emerald-500/5 border-emerald-500/10"
                                    : "bg-rose-500/5 border-rose-500/10"
                                    }`}
                            >
                                <div className="flex items-start gap-4 mb-6">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isCorrect ? "bg-emerald-500/20" : "bg-rose-500/20"
                                        }`}>
                                        {isCorrect ? (
                                            <CheckCircle className="w-5 h-5 text-emerald-500" />
                                        ) : (
                                            <XCircle className="w-5 h-5 text-rose-500" />
                                        )}
                                    </div>
                                    <p className="font-bold text-slate-900 text-lg leading-tight pt-1">{index + 1}. {q.question}</p>
                                </div>
                                <div className="ml-14 space-y-2">
                                    {q.options.map((option, optIndex) => {
                                        const isUserAnswer = optIndex === userAnswer;
                                        const isCorrectAnswer = optIndex === q.correctAnswer;

                                        return (
                                            <div
                                                key={optIndex}
                                                className={`p-4 rounded-xl text-sm font-bold border-2 transition-all ${isCorrectAnswer
                                                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                                                    : isUserAnswer && !isCorrectAnswer
                                                        ? "bg-rose-50 border-rose-200 text-rose-700"
                                                        : "bg-slate-50 border-slate-100 text-slate-400"
                                                    }`}
                                            >
                                                <span className="opacity-50 mr-3">{String.fromCharCode(65 + optIndex)}.</span> {option}
                                                {isCorrectAnswer && <CheckCircle className="w-4 h-4 inline ml-2" />}
                                                {isUserAnswer && !isCorrectAnswer && " (MISS)"}
                                            </div>
                                        );
                                    })}
                                </div>
                                {q.explanation && (
                                    <p className="ml-7 mt-2 text-sm text-gray-400 italic">
                                        {q.explanation}
                                    </p>
                                )}
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        );
    }

    return (
        <div className="w-full">
            {/* Anti-Cheat Status Bar */}
            <div className="mb-4 bg-gray-900/50 rounded-xl p-3 border border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Shield className={`w-5 h-5 ${status.tabFocused ? 'text-green-400' : 'text-yellow-400'}`} />
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${status.tabFocused ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'}`} />
                        <span className="text-xs text-gray-300 font-medium">
                            {status.tabFocused ? 'Tab Monitoring Active' : 'Tab Switch Detected'}
                        </span>
                    </div>
                    {status.violations > 0 && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-red-500/20 border border-red-500/50 rounded-lg">
                            <AlertTriangle className="w-3 h-3 text-red-400" />
                            <span className="text-xs text-red-400 font-bold">
                                {status.violations}/{3} Violations
                            </span>
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">
                        {status.tabFocused ? 'Focused' : 'Tab Switched'}
                    </span>
                </div>
            </div>



            {/* Warning Banner */}
            {showCameraWarning && status.warnings.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mb-4 bg-yellow-500/10 border border-yellow-500/50 rounded-xl p-3 flex items-start gap-3"
                >
                    <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <p className="text-yellow-300 font-medium text-sm">
                            {status.warnings[status.warnings.length - 1]}
                        </p>
                        <p className="text-yellow-200/80 text-xs mt-1">
                            Please maintain focus on the test window.
                        </p>
                    </div>
                </motion.div>
            )}

            {/* Progress Bar */}
            <div className="mb-10 bg-white/50 backdrop-blur-md p-6 rounded-2xl border border-slate-200/50 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">
                            Aptitude Protocol
                        </span>
                        <span className="text-xl font-black text-slate-900">
                            Question {currentQuestion + 1} <span className="text-slate-300">/ {questions.length}</span>
                        </span>
                    </div>
                    <div className="text-right">
                        <span className="block text-2xl font-black text-purple-600">
                            {Math.round((Object.keys(answers).length / questions.length) * 100)}%
                        </span>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Analyzed
                        </span>
                    </div>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50 relative">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${((Object.keys(answers).length / questions.length) * 100)}%` }}
                        className="h-full bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 relative z-10"
                    />
                    <div className="absolute inset-0 bg-slate-200/50 animate-pulse" />
                </div>
            </div>

            {/* Question Display */}
            {!showAll ? (
                // Single question view
                <div className="space-y-6">
                    <motion.div
                        key={currentQuestion}
                        initial={{ opacity: 0, scale: 0.98, x: 20 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.98, x: -20 }}
                        className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-xl relative overflow-hidden group"
                    >
                        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-50 rounded-full blur-3xl -z-0 opacity-50 group-hover:opacity-100 transition-opacity" />

                        <div className="relative z-10">
                            <span className="inline-block px-3 py-1 bg-purple-50 text-purple-600 rounded-lg text-[10px] font-black uppercase tracking-widest mb-6 border border-purple-100">
                                Question {currentQuestion + 1}
                            </span>
                            <h3 className="text-2xl font-black text-slate-900 mb-10 leading-snug">
                                {questions[currentQuestion].question}
                            </h3>
                            <div className="grid grid-cols-1 gap-3">
                                {questions[currentQuestion].options.map((option, index) => {
                                    const isSelected = answers[questions[currentQuestion].id] === index;

                                    return (
                                        <motion.button
                                            key={index}
                                            whileHover={{ x: 8 }}
                                            whileTap={{ scale: 0.99 }}
                                            onClick={() => handleAnswer(questions[currentQuestion].id, index)}
                                            className={`w-full text-left p-5 rounded-2xl border-2 transition-all relative overflow-hidden flex items-center gap-4 ${isSelected
                                                ? "border-purple-600 bg-purple-50 text-purple-900 shadow-lg shadow-purple-100"
                                                : "bg-slate-50 border-slate-100 text-slate-600 hover:border-slate-300 hover:bg-white"
                                                }`}
                                        >
                                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0 ${isSelected ? "bg-purple-600 text-white" : "bg-slate-200 text-slate-500"
                                                }`}>
                                                {String.fromCharCode(65 + index)}
                                            </div>
                                            <span className="font-bold flex-1">{option}</span>
                                            {isSelected && <CheckCircle className="w-5 h-5 text-purple-600" />}
                                        </motion.button>
                                    );
                                })}
                            </div>
                        </div>
                    </motion.div>

                    {/* Navigation */}
                    <div className="flex justify-between items-center gap-3">
                        <button
                            onClick={handlePrevious}
                            disabled={currentQuestion === 0}
                            className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition flex items-center gap-2"
                        >
                            <ChevronRight className="w-4 h-4 rotate-180" />
                            Previous
                        </button>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowAll(true)}
                                className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition"
                            >
                                Show All
                            </button>
                        </div>
                        <button
                            onClick={handleNext}
                            disabled={currentQuestion === questions.length - 1}
                            className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition flex items-center gap-2"
                        >
                            Next
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            ) : (
                // All questions view
                <div className="space-y-4">
                    {questions.map((q, index) => {
                        const userAnswer = answers[q.id];

                        return (
                            <motion.div
                                key={q.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="bg-gray-900/50 rounded-xl p-6 border border-gray-800"
                            >
                                <h3 className="text-lg font-semibold text-white mb-3">
                                    {index + 1}. {q.question}
                                </h3>
                                <div className="space-y-2">
                                    {q.options.map((option, optIndex) => {
                                        const isSelected = userAnswer === optIndex;

                                        return (
                                            <button
                                                key={optIndex}
                                                onClick={() => handleAnswer(q.id, optIndex)}
                                                className={`w-full text-left p-3 rounded-lg border transition ${isSelected
                                                    ? "bg-purple-500/20 border-purple-500 text-white"
                                                    : "bg-gray-800/50 border-gray-700 text-gray-300 hover:border-gray-600"
                                                    }`}
                                            >
                                                <span className="font-medium mr-2">
                                                    {String.fromCharCode(65 + optIndex)}.
                                                </span>
                                                {option}
                                            </button>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        );
                    })}
                    <div className="flex justify-between items-center gap-3">
                        <button
                            onClick={() => setShowAll(false)}
                            className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition"
                        >
                            Back to Single View
                        </button>
                    </div>
                </div>
            )}

            {/* Submit Button */}
            <div className="mt-6 flex justify-center gap-3">
                {!allAnswered && (
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleMaster}
                        className="px-6 py-3 rounded-xl font-bold text-base bg-gradient-to-r from-yellow-500 to-amber-500 text-white transition flex items-center gap-2 shadow-lg shadow-yellow-500/30"
                    >
                        <Sparkles className="w-5 h-5" />
                        Master Mode
                    </motion.button>
                )}
                <button
                    onClick={handleSubmit}
                    disabled={!allAnswered || submitted}
                    className={`px-8 py-3 rounded-xl font-bold text-lg transition ${allAnswered && !submitted
                        ? "bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 text-white"
                        : "bg-gray-800 text-gray-500 cursor-not-allowed"
                        }`}
                >
                    {submitted ? "Submitted" : "Submit Answers"}
                </button>
            </div>

            {!allAnswered && (
                <div className="mt-4 flex items-center gap-2 text-yellow-400 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    Please answer all {questions.length} questions before submitting.
                </div>
            )}
        </div>
    );
}

