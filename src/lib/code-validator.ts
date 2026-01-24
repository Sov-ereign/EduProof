/**
 * Code validator for test case validation without execution
 * Uses pattern matching and structure analysis
 */

export interface TestCase {
    input: any[];
    expectedOutput: any;
    description?: string;
}

export interface ValidationResult {
    passed: boolean;
    passedTests: number;
    totalTests: number;
    results: Array<{
        testCase: number;
        passed: boolean;
        expected: any;
        got?: any;
        error?: string;
    }>;
}

/**
 * Extract function from user code
 */
function extractFunction(code: string, functionName?: string): string | null {
    // Try to find the function by name if provided
    if (functionName) {
        const regex = new RegExp(`(?:function|const|let|var)\\s+${functionName}\\s*[=\\(]`, 'i');
        const match = code.match(regex);
        if (match) {
            const startIndex = match.index!;
            // Find the matching brace
            let braceCount = 0;
            let inString = false;
            let stringChar = '';
            let i = startIndex;
            
            while (i < code.length) {
                const char = code[i];
                if (!inString && (char === '"' || char === "'" || char === '`')) {
                    inString = true;
                    stringChar = char;
                } else if (inString && char === stringChar && code[i - 1] !== '\\') {
                    inString = false;
                } else if (!inString) {
                    if (char === '{') braceCount++;
                    if (char === '}') {
                        braceCount--;
                        if (braceCount === 0) {
                            return code.substring(startIndex, i + 1);
                        }
                    }
                }
                i++;
            }
        }
    }
    
    // Fallback: find the last function definition
    const functionPatterns = [
        /function\s+\w+\s*\([^)]*\)\s*\{[^}]*\}/g,
        /const\s+\w+\s*=\s*(?:async\s+)?\([^)]*\)\s*=>\s*\{[^}]*\}/g,
        /def\s+\w+\s*\([^)]*\)\s*:[\s\S]*?(?=\ndef\s|\nclass\s|$)/g,
        /fn\s+\w+\s*\([^)]*\)\s*->[^{]*\{[^}]*\}/g
    ];
    
    for (const pattern of functionPatterns) {
        const matches = code.match(pattern);
        if (matches && matches.length > 0) {
            return matches[matches.length - 1]; // Return the last match
        }
    }
    
    return code; // Return entire code if no function found
}

/**
 * Simple value comparison with type checking
 */
function deepEqual(a: any, b: any): boolean {
    if (a === b) return true;
    
    if (a === null || b === null) return a === b;
    if (typeof a !== typeof b) return false;
    
    if (Array.isArray(a) && Array.isArray(b)) {
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) {
            if (!deepEqual(a[i], b[i])) return false;
        }
        return true;
    }
    
    if (typeof a === 'object' && typeof b === 'object') {
        const keysA = Object.keys(a);
        const keysB = Object.keys(b);
        if (keysA.length !== keysB.length) return false;
        for (const key of keysA) {
            if (!keysB.includes(key)) return false;
            if (!deepEqual(a[key], b[key])) return false;
        }
        return true;
    }
    
    return false;
}

/**
 * Pattern-based validation: Check if code structure suggests correct implementation
 */
function validateCodeStructure(code: string, testCases: TestCase[], functionSignature: string): ValidationResult {
    const results: ValidationResult['results'] = [];
    let passedCount = 0;
    
    // Extract expected patterns from test cases
    const expectedReturnTypes = new Set<string>();
    testCases.forEach(tc => {
        const type = typeof tc.expectedOutput;
        expectedReturnTypes.add(type);
    });
    
    // Check if code has return statement (for functions that should return)
    const hasReturn = /return\s+/.test(code);
    const hasMultipleReturns = (code.match(/return\s+/g) || []).length > 1;
    
    // Check for common algorithm patterns
    const hasLoops = /(?:for|while|forEach|map|filter|reduce)\s*\(/.test(code);
    const hasConditionals = /(?:if|else|switch|case)\s*\(?/.test(code);
    
    // For each test case, try to infer if the code would pass
    // This is a simplified validation - we can't actually execute
    testCases.forEach((testCase, index) => {
        // Check if the code structure suggests it handles this case
        let passed = false;
        let error: string | undefined;
        
        // Basic validation: check if code has necessary structure
        if (testCase.expectedOutput !== undefined && testCase.expectedOutput !== null) {
            // Code should have return statement for non-void functions
            if (!hasReturn && expectedReturnTypes.size > 0) {
                error = 'Code appears to be missing return statement';
            } else {
                // For simple cases, check if code structure is reasonable
                // This is a heuristic - actual execution would be better
                passed = hasReturn || hasLoops || hasConditionals;
                
                if (!passed) {
                    error = 'Code structure does not appear to implement the required logic';
                }
            }
        } else {
            // Void function or null return
            passed = true; // Assume passed if no return expected
        }
        
        if (passed) passedCount++;
        
        results.push({
            testCase: index + 1,
            passed,
            expected: testCase.expectedOutput,
            error
        });
    });
    
    return {
        passed: passedCount === testCases.length,
        passedTests: passedCount,
        totalTests: testCases.length,
        results
    };
}

/**
 * Validate code against test cases using pattern matching
 * Note: This is a simplified validator. For production, use actual code execution in a sandbox.
 */
export function validateCode(
    userCode: string,
    testCases: TestCase[],
    functionSignature: string
): ValidationResult {
    if (!userCode || userCode.trim().length === 0) {
        return {
            passed: false,
            passedTests: 0,
            totalTests: testCases.length,
            results: testCases.map((_, i) => ({
                testCase: i + 1,
                passed: false,
                expected: testCases[i].expectedOutput,
                error: 'No code provided'
            }))
        };
    }
    
    if (!testCases || testCases.length === 0) {
        return {
            passed: false,
            passedTests: 0,
            totalTests: 0,
            results: [],
        };
    }
    
    // Extract function name from signature if possible
    const functionNameMatch = functionSignature.match(/(?:function|def|fn|const|let|var)\s+(\w+)/);
    const functionName = functionNameMatch ? functionNameMatch[1] : undefined;
    
    // Extract the function code
    const functionCode = extractFunction(userCode, functionName) || userCode;
    
    // Use structure-based validation
    // In a real implementation, you would execute the code in a sandbox
    return validateCodeStructure(functionCode, testCases, functionSignature);
}

/**
 * Enhanced validation with basic syntax checking
 */
export function validateCodeWithSyntaxCheck(
    userCode: string,
    testCases: TestCase[],
    functionSignature: string,
    language: string = 'javascript'
): ValidationResult {
    // Basic syntax validation
    const syntaxErrors: string[] = [];
    
    // Check for balanced braces
    const openBraces = (userCode.match(/\{/g) || []).length;
    const closeBraces = (userCode.match(/\}/g) || []).length;
    if (openBraces !== closeBraces) {
        syntaxErrors.push('Unbalanced braces');
    }
    
    // Check for balanced parentheses
    const openParens = (userCode.match(/\(/g) || []).length;
    const closeParens = (userCode.match(/\)/g) || []).length;
    if (openParens !== closeParens) {
        syntaxErrors.push('Unbalanced parentheses');
    }
    
    // If there are syntax errors, fail all tests
    if (syntaxErrors.length > 0) {
        return {
            passed: false,
            passedTests: 0,
            totalTests: testCases.length,
            results: testCases.map((tc, i) => ({
                testCase: i + 1,
                passed: false,
                expected: tc.expectedOutput,
                error: `Syntax errors: ${syntaxErrors.join(', ')}`
            }))
        };
    }
    
    // Proceed with structure validation
    return validateCode(userCode, testCases, functionSignature);
}

