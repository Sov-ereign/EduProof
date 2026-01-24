"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Play, CheckCircle, XCircle, Loader2, AlertCircle } from "lucide-react";
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
}

export default function CodeEditor({ challenge, language, onComplete, onNext }: CodeEditorProps) {
    const [code, setCode] = useState(challenge.starterCode || challenge.functionSignature + "\n    pass");
    const [validating, setValidating] = useState(false);
    const [validationResult, setValidationResult] = useState<any>(null);
    const [submitted, setSubmitted] = useState(false);

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

    const canProceed = validationResult?.passed === true;

    return (
        <div className="w-full space-y-4">
            {/* Challenge Header */}
            <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
                <h3 className="text-2xl font-bold text-white mb-2">{challenge.title}</h3>
                <p className="text-gray-300 whitespace-pre-wrap">{challenge.description}</p>
                <div className="mt-4 p-3 bg-gray-800/50 rounded-lg">
                    <p className="text-sm text-gray-400 mb-1">Function Signature:</p>
                    <code className="text-purple-400 font-mono">{challenge.functionSignature}</code>
                </div>
            </div>

            {/* Code Editor */}
            <div className="bg-gray-900/50 rounded-xl border border-gray-800 overflow-hidden">
                <div className="bg-gray-800 px-4 py-2 flex items-center justify-between">
                    <span className="text-sm text-gray-400 font-mono">{language}</span>
                    <button
                        onClick={() => setCode(challenge.starterCode || challenge.functionSignature + "\n    pass")}
                        className="text-xs text-gray-400 hover:text-gray-300 transition"
                    >
                        Reset
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
            <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
                <h4 className="text-lg font-semibold text-white mb-4">Test Cases</h4>
                <div className="space-y-3">
                    {challenge.testCases.map((testCase, index) => {
                        const result = validationResult?.results?.find((r: any) => r.testCase === index + 1);
                        const passed = result?.passed;

                        return (
                            <div
                                key={index}
                                className={`p-4 rounded-lg border ${
                                    submitted
                                        ? passed
                                            ? "bg-green-500/10 border-green-500/30"
                                            : "bg-red-500/10 border-red-500/30"
                                        : "bg-gray-800/50 border-gray-700"
                                }`}
                            >
                                <div className="flex items-start gap-3">
                                    {submitted ? (
                                        passed ? (
                                            <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                                        ) : (
                                            <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                                        )
                                    ) : (
                                        <div className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                    )}
                                    <div className="flex-1">
                                        <p className="text-sm text-gray-400 mb-2">
                                            Test Case {index + 1}
                                            {testCase.description && `: ${testCase.description}`}
                                        </p>
                                        <div className="space-y-1">
                                            <div>
                                                <span className="text-xs text-gray-500">Input: </span>
                                                <code className="text-gray-300 text-sm">
                                                    {JSON.stringify(testCase.input)}
                                                </code>
                                            </div>
                                            <div>
                                                <span className="text-xs text-gray-500">Expected: </span>
                                                <code className="text-gray-300 text-sm">
                                                    {JSON.stringify(testCase.expectedOutput)}
                                                </code>
                                            </div>
                                            {submitted && result && (
                                                <div>
                                                    {result.got !== undefined && (
                                                        <div>
                                                            <span className="text-xs text-gray-500">Got: </span>
                                                            <code className={`text-sm ${
                                                                passed ? "text-green-300" : "text-red-300"
                                                            }`}>
                                                                {JSON.stringify(result.got)}
                                                            </code>
                                                        </div>
                                                    )}
                                                    {result.error && (
                                                        <div className="mt-1">
                                                            <span className="text-xs text-red-400">Error: </span>
                                                            <span className="text-sm text-red-300">{result.error}</span>
                                                        </div>
                                                    )}
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
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {submitted && validationResult && (
                        <div className={`flex items-center gap-2 ${
                            validationResult.passed ? "text-green-400" : "text-red-400"
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
                <button
                    onClick={handleRun}
                    disabled={validating || (submitted && canProceed)}
                    className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition ${
                        validating
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

            {submitted && canProceed && onNext && (
                <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={onNext}
                    className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:opacity-90 text-white rounded-xl font-bold transition"
                >
                    Next Challenge →
                </motion.button>
            )}
        </div>
    );
}

