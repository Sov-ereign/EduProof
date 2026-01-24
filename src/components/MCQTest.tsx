"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, AlertCircle, RotateCcw, Loader2, Sparkles, ChevronRight } from "lucide-react";

export interface MCQQuestion {
    id: string;
    question: string;
    options: string[];
    correctAnswer: number;
    explanation?: string;
}

interface MCQTestProps {
    questions: MCQQuestion[];
    onComplete: (score: number, passed: boolean) => void;
    onRetry?: () => void;
    onNext?: () => void;
}

export default function MCQTest({ questions, onComplete, onRetry, onNext }: MCQTestProps) {
    const [answers, setAnswers] = useState<Record<string, number>>({});
    const [submitted, setSubmitted] = useState(false);
    const [score, setScore] = useState<number | null>(null);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [showAll, setShowAll] = useState(false);

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
        onComplete(calculatedScore, passed);
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
            onComplete(calculatedScore, true); // Always passes with master mode
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
                    className={`rounded-xl p-6 border-2 ${
                        passed
                            ? "bg-green-500/10 border-green-500/50"
                            : "bg-red-500/10 border-red-500/50"
                    }`}
                >
                    <div className="flex items-center gap-4 mb-4">
                        {passed ? (
                            <CheckCircle className="w-12 h-12 text-green-400" />
                        ) : (
                            <XCircle className="w-12 h-12 text-red-400" />
                        )}
                        <div>
                            <h3 className={`text-2xl font-bold ${passed ? "text-green-400" : "text-red-400"}`}>
                                {passed ? "MCQ Test Passed!" : "MCQ Test Failed"}
                            </h3>
                            <p className="text-gray-400">
                                Score: {score}% ({correctCount}/{questions.length} correct)
                            </p>
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
                                className={`p-4 rounded-lg border ${
                                    isCorrect
                                        ? "bg-green-500/10 border-green-500/30"
                                        : "bg-red-500/10 border-red-500/30"
                                }`}
                            >
                                <div className="flex items-start gap-2 mb-2">
                                    {isCorrect ? (
                                        <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                                    ) : (
                                        <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                                    )}
                                    <p className="font-medium text-white">{index + 1}. {q.question}</p>
                                </div>
                                <div className="ml-7 space-y-1">
                                    {q.options.map((option, optIndex) => {
                                        const isUserAnswer = optIndex === userAnswer;
                                        const isCorrectAnswer = optIndex === q.correctAnswer;

                                        return (
                                            <div
                                                key={optIndex}
                                                className={`p-2 rounded ${
                                                    isCorrectAnswer
                                                        ? "bg-green-500/20 text-green-300"
                                                        : isUserAnswer && !isCorrectAnswer
                                                        ? "bg-red-500/20 text-red-300"
                                                        : "bg-gray-800/50 text-gray-400"
                                                }`}
                                            >
                                                {String.fromCharCode(65 + optIndex)}. {option}
                                                {isCorrectAnswer && " ✓"}
                                                {isUserAnswer && !isCorrectAnswer && " (Your answer)"}
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
            {/* Progress Bar */}
            <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-400">
                        Question {currentQuestion + 1} of {questions.length}
                    </span>
                    <span className="text-sm text-gray-400">
                        {Object.keys(answers).length}/{questions.length} answered
                    </span>
                </div>
                <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${((Object.keys(answers).length / questions.length) * 100)}%` }}
                        className="h-full bg-gradient-to-r from-purple-500 to-indigo-500"
                    />
                </div>
            </div>

            {/* Question Display */}
            {!showAll ? (
                // Single question view
                <div className="space-y-4">
                    <motion.div
                        key={currentQuestion}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.1 }}
                        className="bg-gray-900/50 rounded-xl p-6 border border-gray-800"
                    >
                        <h3 className="text-xl font-semibold text-white mb-4">
                            {currentQuestion + 1}. {questions[currentQuestion].question}
                        </h3>
                        <div className="space-y-2">
                            {questions[currentQuestion].options.map((option, index) => {
                                const isSelected = answers[questions[currentQuestion].id] === index;

                                return (
                                    <button
                                        key={index}
                                        onClick={() => handleAnswer(questions[currentQuestion].id, index)}
                                        className={`w-full text-left p-4 rounded-lg border transition ${
                                            isSelected
                                                ? "bg-purple-500/20 border-purple-500 text-white"
                                                : "bg-gray-800/50 border-gray-700 text-gray-300 hover:border-gray-600"
                                        }`}
                                    >
                                        <span className="font-medium mr-2">
                                            {String.fromCharCode(65 + index)}.
                                        </span>
                                        {option}
                                    </button>
                                );
                            })}
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
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleMaster}
                                className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-amber-500 text-white rounded-lg font-bold transition flex items-center gap-2 shadow-lg shadow-yellow-500/30"
                            >
                                <Sparkles className="w-4 h-4" />
                                Master
                            </motion.button>
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
                                                className={`w-full text-left p-3 rounded-lg border transition ${
                                                    isSelected
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
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleMaster}
                            className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-amber-500 text-white rounded-lg font-bold transition flex items-center gap-2 shadow-lg shadow-yellow-500/30"
                        >
                            <Sparkles className="w-4 h-4" />
                            Master Mode
                        </motion.button>
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
                    className={`px-8 py-3 rounded-xl font-bold text-lg transition ${
                        allAnswered && !submitted
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

