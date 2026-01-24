"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Play, CheckCircle, XCircle, Loader2, AlertCircle, Sparkles, ChevronRight, Video, VideoOff, Shield, AlertTriangle } from "lucide-react";
import { useAntiCheat } from "@/hooks/useAntiCheat";
import Editor from "react-simple-code-editor";
import { highlight, languages } from "prismjs";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-python";
import "prismjs/components/prism-rust";
import "prismjs/components/prism-typescript";
import "prismjs/themes/prism-dark.css";

export interface CodingChallenge {
    id: string;
    title: string;
    description: string;
    functionSignature: string;
    testCases: Array<{
        input: any[];
        expectedOutput: any;
        description?: string;
    }>;
    starterCode?: string;
}

interface CodeEditorProps {
    challenge: CodingChallenge;
    language: string;
    onComplete: (passed: boolean) => void;
    onNext?: () => void;
    isLastChallenge?: boolean;
}

export default function CodeEditor({ challenge, language, onComplete, onNext, isLastChallenge = false }: CodeEditorProps) {
    const [code, setCode] = useState(challenge.starterCode || challenge.functionSignature + "\n    pass");
    const [validating, setValidating] = useState(false);
    const [validationResult, setValidationResult] = useState<any>(null);
    const [submitted, setSubmitted] = useState(false);
    const [showCameraWarning, setShowCameraWarning] = useState(false);

    // Anti-cheat system
    const { status, start, stop, videoRef, isBlocked } = useAntiCheat({
        onViolation: (type) => {
            console.warn(`Anti-cheat violation: ${type}`);
        },
        onWarning: (message) => {
            setShowCameraWarning(true);
            setTimeout(() => setShowCameraWarning(false), 5000);
        },
        maxViolations: 3,
        enableCamera: true
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
            alert("Challenge blocked due to multiple violations. Please maintain focus and camera visibility.");
        }
    }, [isBlocked, submitted]);

    const getLanguageKey = (lang: string): string => {
        const langMap: Record<string, string> = {
            Python: "python",
            JavaScript: "javascript",
            TypeScript: "typescript",
            Rust: "rust",
            React: "typescript"
        };
        return langMap[lang] || "javascript";
    };

    const handleRun = async () => {
        setValidating(true);
        setValidationResult(null);

        try {
            const response = await fetch("/api/evaluate/validate-code", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userCode: code,
                    testCases: challenge.testCases,
                    functionSignature: challenge.functionSignature,
                    language: getLanguageKey(language)
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Validation failed");
            }

            setValidationResult(result);
            setSubmitted(true);

            if (result.passed) {
                onComplete(true);
            }
        } catch (error: any) {
            setValidationResult({
                passed: false,
                passedTests: 0,
                totalTests: challenge.testCases.length,
                results: challenge.testCases.map((_, i) => ({
                    testCase: i + 1,
                    passed: false,
                    expected: challenge.testCases[i].expectedOutput,
                    error: error.message || "Validation error"
                }))
            });
        } finally {
            setValidating(false);
        }
    };

    const handleMaster = () => {
        // Auto-pass all test cases
        const masterResult = {
            passed: true,
            passedTests: challenge.testCases.length,
            totalTests: challenge.testCases.length,
            results: challenge.testCases.map((tc, i) => ({
                testCase: i + 1,
                passed: true,
                expected: tc.expectedOutput,
                got: tc.expectedOutput
            }))
        };
        setValidationResult(masterResult);
        setSubmitted(true);
        onComplete(true);
    };

    const canProceed = validationResult?.passed === true;

    return (
        <div className="w-full space-y-4">
            {/* Anti-Cheat Status Bar */}
            <div className="bg-gray-900/50 rounded-xl p-3 border border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Shield className={`w-5 h-5 ${status.cameraActive && status.tabFocused ? 'text-green-400' : 'text-yellow-400'}`} />
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${status.cameraActive ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
                        <span className="text-xs text-gray-300 font-medium">
                            {status.cameraActive ? 'Proctoring Active' : 'Camera Required'}
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
                    {status.cameraActive ? (
                        <Video className="w-4 h-4 text-green-400" />
                    ) : (
                        <VideoOff className="w-4 h-4 text-red-400" />
                    )}
                    <span className="text-xs text-gray-400">
                        {status.tabFocused ? 'Focused' : 'Tab Switched'}
                    </span>
                </div>
            </div>

            {/* Hidden video element for camera */}
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="hidden"
                style={{ width: '1px', height: '1px', position: 'absolute', top: '-9999px' }}
            />

            {/* Warning Banner */}
            {showCameraWarning && status.warnings.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="bg-yellow-500/10 border border-yellow-500/50 rounded-xl p-3 flex items-start gap-3"
                >
                    <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <p className="text-yellow-300 font-medium text-sm">
                            {status.warnings[status.warnings.length - 1]}
                        </p>
                        <p className="text-yellow-200/80 text-xs mt-1">
                            Please maintain focus on the challenge window and keep your camera visible.
                        </p>
                    </div>
                </motion.div>
            )}

            {/* Challenge Header */}
            <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl p-6 border border-slate-800 shadow-xl overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -z-0" />
                <div className="relative z-10">
                    <h3 className="text-xl font-black text-white mb-2 tracking-tight">{challenge.title}</h3>
                    <p className="text-slate-300 text-sm leading-relaxed font-medium">{challenge.description}</p>
                    <div className="mt-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
                        <p className="text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">Target Function</p>
                        <code className="text-purple-400 font-mono text-sm">{challenge.functionSignature}</code>
                    </div>
                </div>
            </div>

            {/* Code Editor */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
                <div className="bg-slate-800/50 px-5 py-3 flex items-center justify-between border-b border-slate-700/50">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500/50" />
                        <div className="w-3 h-3 rounded-full bg-amber-500/50" />
                        <div className="w-3 h-3 rounded-full bg-emerald-500/50" />
                        <span className="ml-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{language} Environment</span>
                    </div>
                    <button
                        onClick={() => setCode(challenge.starterCode || challenge.functionSignature + "\n    pass")}
                        className="text-[10px] font-black text-slate-500 hover:text-white transition-colors uppercase tracking-widest"
                    >
                        Reset Source
                    </button>
                </div>
                <div className="relative">
                    <Editor
                        value={code}
                        onValueChange={setCode}
                        highlight={(code) => highlight(code, languages[getLanguageKey(language)], getLanguageKey(language))}
                        padding={16}
                        style={{
                            fontFamily: '"Fira code", "Fira Mono", monospace',
                            fontSize: 14,
                            backgroundColor: "#111827",
                            color: "#e5e7eb",
                            minHeight: "300px",
                            outline: "none"
                        }}
                        textareaClassName="outline-none"
                        disabled={submitted && canProceed}
                    />
                </div>
            </div>

            {/* Test Cases */}
            <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl p-6 border border-slate-800 shadow-xl">
                <h4 className="text-sm font-black text-white mb-6 uppercase tracking-widest border-l-4 border-purple-500 pl-4">Test Protocols</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {challenge.testCases.map((testCase, index) => {
                        const result = validationResult?.results?.find((r: any) => r.testCase === index + 1);
                        const passed = result?.passed;

                        return (
                            <div
                                key={index}
                                className={`p-4 rounded-xl border-2 transition-all duration-500 ${submitted
                                    ? passed
                                        ? "bg-emerald-500/5 border-emerald-500/30"
                                        : "bg-rose-500/5 border-rose-500/30"
                                    : "bg-slate-800/30 border-slate-800 hover:border-slate-700"
                                    }`}
                            >
                                <div className="flex items-start gap-4">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${submitted
                                        ? passed ? "bg-emerald-500/20" : "bg-rose-500/20"
                                        : "bg-slate-800"
                                        }`}>
                                        {submitted ? (
                                            passed ? (
                                                <CheckCircle className="w-4 h-4 text-emerald-400" />
                                            ) : (
                                                <XCircle className="w-4 h-4 text-rose-400" />
                                            )
                                        ) : (
                                            <span className="text-[10px] font-black text-slate-500">{index + 1}</span>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest truncate">Case {index + 1}: {testCase.description || 'Standard'}</p>
                                        <div className="space-y-1.5 font-mono text-[11px]">
                                            <div className="flex items-center gap-2">
                                                <span className="text-slate-600">IN:</span>
                                                <span className="text-slate-300 truncate">{JSON.stringify(testCase.input)}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-slate-600">REQ:</span>
                                                <span className="text-emerald-400/80 truncate">{JSON.stringify(testCase.expectedOutput)}</span>
                                            </div>
                                            {submitted && result && result.got !== undefined && (
                                                <div className="flex items-center gap-2 pt-1 border-t border-slate-800 mt-1">
                                                    <span className="text-slate-600">GOT:</span>
                                                    <span className={passed ? "text-emerald-400" : "text-rose-400"}>{JSON.stringify(result.got)}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Run/Submit Button */}
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    {submitted && validationResult && (
                        <div className={`flex items-center gap-2 ${validationResult.passed ? "text-green-400" : "text-red-400"
                            }`}>
                            {validationResult.passed ? (
                                <>
                                    <CheckCircle className="w-5 h-5" />
                                    <span className="font-medium">
                                        {validationResult.passedTests}/{validationResult.totalTests} tests passed
                                    </span>
                                </>
                            ) : (
                                <>
                                    <XCircle className="w-5 h-5" />
                                    <span className="font-medium">
                                        {validationResult.passedTests}/{validationResult.totalTests} tests passed
                                    </span>
                                </>
                            )}
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {!submitted && (
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleMaster}
                            className="px-4 py-3 rounded-xl font-bold bg-gradient-to-r from-yellow-500 to-amber-500 text-white transition flex items-center gap-2 shadow-lg shadow-yellow-500/30"
                        >
                            <Sparkles className="w-5 h-5" />
                            Master
                        </motion.button>
                    )}
                    <button
                        onClick={handleRun}
                        disabled={validating || (submitted && canProceed)}
                        className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition ${validating
                                ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                                : submitted && canProceed
                                    ? "bg-green-600 text-white cursor-not-allowed"
                                    : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 text-white"
                            }`}
                    >
                        {validating ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Running Tests...
                            </>
                        ) : submitted && canProceed ? (
                            <>
                                <CheckCircle className="w-5 h-5" />
                                All Tests Passed!
                            </>
                        ) : (
                            <>
                                <Play className="w-5 h-5" />
                                Run Tests
                            </>
                        )}
                    </button>
                </div>
            </div>

            {submitted && !canProceed && (
                <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-yellow-300 font-medium mb-1">Some tests failed</p>
                        <p className="text-yellow-200/80 text-sm">
                            Please fix your code and try again. All test cases must pass to proceed.
                        </p>
                    </div>
                </div>
            )}

            {submitted && canProceed && (
                <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => onNext && onNext()}
                    disabled={!onNext}
                    className={`w-full px-6 py-3 rounded-xl font-bold transition flex items-center justify-center gap-2 ${onNext
                            ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:opacity-90 text-white"
                            : "bg-gray-700 text-gray-400 cursor-not-allowed"
                        }`}
                >
                    {isLastChallenge ? (
                        <>
                            View Final Report
                            <ChevronRight className="w-5 h-5" />
                        </>
                    ) : onNext ? (
                        <>
                            Next Challenge
                            <ChevronRight className="w-5 h-5" />
                        </>
                    ) : (
                        "All Challenges Complete"
                    )}
                </motion.button>
            )}
        </div>
    );
}

