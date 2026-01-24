// Comprehensive code analyzer for all skill types
// Analyzes actual code files and computes metrics dynamically

export interface FileAnalysis {
    path: string;
    content: string;
    extension: string;
    lines: number;
}

export interface ReactAnalysis {
    componentDesign: {
        score: number;
        feedback: string[];
        metrics: {
            totalComponents: number;
            averageComponentSize: number;
            reusableComponents: number;
            propInterfaces: number;
            componentSeparation: number;
        };
    };
    stateManagement: {
        score: number;
        feedback: string[];
        metrics: {
            useStateCount: number;
            useEffectCount: number;
            useContextCount: number;
            useReducerCount: number;
            customHooks: number;
            propDrillingDepth: number;
            contextUsage: boolean;
        };
    };
    codeQuality: {
        score: number;
        feedback: string[];
        metrics: {
            typeScriptUsage: number;
            complexity: number;
            commentRatio: number;
            namingQuality: number;
            errorHandling: number;
            performanceOptimizations: number;
        };
    };
    userExperience: {
        score: number;
        feedback: string[];
        metrics: {
            loadingStates: number;
            errorStates: number;
            accessibility: number;
            responsiveDesign: number;
            userFeedback: number;
        };
    };
}

export interface RustAnalysis {
    memorySafety: {
        score: number;
        feedback: string[];
        metrics: {
            unsafeBlocks: number;
            unwrapCount: number;
            expectCount: number;
            properErrorHandling: number;
            ownershipPatterns: number;
        };
    };
    codeQuality: {
        score: number;
        feedback: string[];
        metrics: {
            idiomaticPatterns: number;
            complexity: number;
            commentRatio: number;
            documentation: number;
        };
    };
    errorHandling: {
        score: number;
        feedback: string[];
        metrics: {
            resultUsage: number;
            optionUsage: number;
            errorPropagation: number;
            matchStatements: number;
        };
    };
    documentation: {
        score: number;
        feedback: string[];
        metrics: {
            docComments: number;
            examples: number;
            readmeQuality: number;
        };
    };
}

export interface PythonAnalysis {
    codeReadability: {
        score: number;
        feedback: string[];
        metrics: {
            namingQuality: number;
            structure: number;
            commentRatio: number;
            lineLength: number;
        };
    };
    logicCorrectness: {
        score: number;
        feedback: string[];
        metrics: {
            edgeCaseHandling: number;
            errorHandling: number;
            validation: number;
            testCoverage: number;
        };
    };
    useOfConcepts: {
        score: number;
        feedback: string[];
        metrics: {
            advancedFeatures: string[];
            designPatterns: number;
            typeHints: number;
            asyncUsage: number;
        };
    };
    explanationClarity: {
        score: number;
        feedback: string[];
        metrics: {
            docstrings: number;
            comments: number;
            readmeQuality: number;
        };
    };
}

// ==================== REACT ANALYZER ====================

export function analyzeReact(files: FileAnalysis[]): ReactAnalysis {
    const reactFiles = files.filter(f => 
        f.extension === '.tsx' || f.extension === '.jsx' || 
        f.content.includes('react') || f.content.includes('React')
    );

    if (reactFiles.length === 0) {
        return createEmptyReactAnalysis();
    }

    // Component Design Analysis (30%)
    const componentDesign = analyzeComponentDesign(reactFiles);
    
    // State Management Analysis (25%)
    const stateManagement = analyzeStateManagement(reactFiles);
    
    // Code Quality Analysis (25%)
    const codeQuality = analyzeReactCodeQuality(reactFiles);
    
    // User Experience Analysis (20%)
    const userExperience = analyzeUserExperience(reactFiles);

    return {
        componentDesign,
        stateManagement,
        codeQuality,
        userExperience
    };
}

function analyzeComponentDesign(files: FileAnalysis[]) {
    let totalComponents = 0;
    let totalLines = 0;
    let reusableComponents = 0;
    let propInterfaces = 0;
    const componentSizes: number[] = [];

    for (const file of files) {
        const content = file.content;
        
        // Count components (function components, class components, arrow functions)
        const functionComponents = (content.match(/export\s+(?:const|function)\s+\w+\s*[:=]/g) || []).length;
        const classComponents = (content.match(/export\s+class\s+\w+\s+extends\s+React\.Component/g) || []).length;
        const arrowComponents = (content.match(/export\s+const\s+\w+\s*[:=]\s*\(/g) || []).length;
        totalComponents += functionComponents + classComponents + arrowComponents;

        // Check for prop interfaces/types
        const interfaces = (content.match(/interface\s+\w+Props/g) || []).length;
        const types = (content.match(/type\s+\w+Props\s*=/g) || []).length;
        propInterfaces += interfaces + types;

        // Check for reusable components (exported, have props)
        const exportedWithProps = (content.match(/export\s+(?:const|function)\s+\w+.*Props/g) || []).length;
        reusableComponents += exportedWithProps;

        // Component size analysis
        const lines = content.split('\n').length;
        totalLines += lines;
        if (functionComponents + classComponents + arrowComponents > 0) {
            componentSizes.push(lines);
        }
    }

    const averageComponentSize = componentSizes.length > 0 
        ? componentSizes.reduce((a, b) => a + b, 0) / componentSizes.length 
        : 0;

    // Component separation score (lower is better for single responsibility)
    const componentSeparation = averageComponentSize < 200 ? 100 : 
                               averageComponentSize < 400 ? 70 : 
                               averageComponentSize < 600 ? 40 : 10;

    let score = 50;
    const feedback: string[] = [];

    if (totalComponents > 0) {
        score += Math.min(20, totalComponents * 2);
        feedback.push(`✓ Found ${totalComponents} component(s)`);
    } else {
        feedback.push("⚠ No React components detected");
    }

    if (propInterfaces > 0) {
        score += 15;
        feedback.push(`✓ ${propInterfaces} component(s) with typed props`);
    } else {
        feedback.push("⚠ No prop interfaces/types found - consider adding TypeScript types");
    }

    if (reusableComponents > 0) {
        score += 15;
        feedback.push(`✓ ${reusableComponents} reusable component(s) with props`);
    }

    if (averageComponentSize > 0) {
        if (averageComponentSize < 200) {
            score += 10;
            feedback.push(`✓ Good component size (avg ${Math.round(averageComponentSize)} lines)`);
        } else if (averageComponentSize < 400) {
            feedback.push(`⚠ Components are getting large (avg ${Math.round(averageComponentSize)} lines)`);
        } else {
            score -= 10;
            feedback.push(`❌ Components too large (avg ${Math.round(averageComponentSize)} lines) - consider splitting`);
        }
    }

    return {
        score: Math.min(100, Math.max(0, score)),
        feedback,
        metrics: {
            totalComponents,
            averageComponentSize: Math.round(averageComponentSize),
            reusableComponents,
            propInterfaces,
            componentSeparation
        }
    };
}

function analyzeStateManagement(files: FileAnalysis[]) {
    let useStateCount = 0;
    let useEffectCount = 0;
    let useContextCount = 0;
    let useReducerCount = 0;
    let customHooks = 0;
    let contextUsage = false;
    let maxPropDepth = 0;

    for (const file of files) {
        const content = file.content;
        
        useStateCount += (content.match(/\buseState\s*\(/g) || []).length;
        useEffectCount += (content.match(/\buseEffect\s*\(/g) || []).length;
        useContextCount += (content.match(/\buseContext\s*\(/g) || []).length;
        useReducerCount += (content.match(/\buseReducer\s*\(/g) || []).length;
        
        // Custom hooks (functions starting with "use")
        customHooks += (content.match(/\bconst\s+use[A-Z]\w+\s*=/g) || []).length;
        customHooks += (content.match(/\bfunction\s+use[A-Z]\w+\s*\(/g) || []).length;
        
        // Context API usage
        if (content.includes('createContext') || content.includes('useContext')) {
            contextUsage = true;
        }

        // Simple prop drilling detection (count props passed through)
        const propPassing = (content.match(/\.\.\.\w+/g) || []).length;
        maxPropDepth = Math.max(maxPropDepth, propPassing);
    }

    let score = 50;
    const feedback: string[] = [];

    // Hook usage
    if (useStateCount > 0) {
        score += 10;
        feedback.push(`✓ Uses useState (${useStateCount} instance(s))`);
    } else {
        feedback.push("⚠ No useState found - consider using state management");
    }

    if (useEffectCount > 0) {
        score += 10;
        feedback.push(`✓ Uses useEffect (${useEffectCount} instance(s))`);
    }

    if (useContextCount > 0 || contextUsage) {
        score += 15;
        feedback.push(`✓ Uses Context API for state sharing`);
    } else if (maxPropDepth > 3) {
        score -= 10;
        feedback.push(`⚠ Potential prop drilling (depth: ${maxPropDepth}) - consider Context API`);
    }

    if (useReducerCount > 0) {
        score += 10;
        feedback.push(`✓ Uses useReducer for complex state`);
    }

    if (customHooks > 0) {
        score += 15;
        feedback.push(`✓ ${customHooks} custom hook(s) - excellent reusability`);
    }

    // State management quality
    const totalHooks = useStateCount + useEffectCount + useContextCount + useReducerCount;
    if (totalHooks === 0) {
        score -= 20;
        feedback.push("❌ No React hooks detected");
    } else if (totalHooks > 10) {
        feedback.push(`ℹ Heavy hook usage (${totalHooks} total) - ensure proper organization`);
    }

    return {
        score: Math.min(100, Math.max(0, score)),
        feedback,
        metrics: {
            useStateCount,
            useEffectCount,
            useContextCount,
            useReducerCount,
            customHooks,
            propDrillingDepth: maxPropDepth,
            contextUsage
        }
    };
}

function analyzeReactCodeQuality(files: FileAnalysis[]) {
    let typeScriptUsage = 0;
    let totalComplexity = 0;
    let totalComments = 0;
    let totalLines = 0;
    let errorHandling = 0;
    let performanceOptimizations = 0;
    let namingQuality = 0;

    for (const file of files) {
        const content = file.content;
        const lines = content.split('\n');
        totalLines += lines.length;

        // TypeScript usage
        if (file.extension === '.tsx' || file.extension === '.ts') {
            const typeAnnotations = (content.match(/:\s*\w+[\[\]<>|&]?/g) || []).length;
            const interfaces = (content.match(/interface\s+\w+/g) || []).length;
            const types = (content.match(/type\s+\w+\s*=/g) || []).length;
            typeScriptUsage += typeAnnotations + interfaces * 5 + types * 5;
        }

        // Complexity (control flow)
        const ifStatements = (content.match(/\bif\s*\(/g) || []).length;
        const loops = (content.match(/\b(for|while|map|filter|reduce)\s*\(/g) || []).length;
        const ternaries = (content.match(/\?.*:/g) || []).length;
        totalComplexity += ifStatements + loops + ternaries;

        // Comments
        const singleLineComments = (content.match(/\/\/.*/g) || []).length;
        const multiLineComments = (content.match(/\/\*[\s\S]*?\*\//g) || []).length;
        totalComments += singleLineComments + multiLineComments;

        // Error handling
        if (content.includes('try') && content.includes('catch')) {
            errorHandling += (content.match(/\btry\s*{/g) || []).length;
        }
        if (content.includes('ErrorBoundary') || content.includes('error')) {
            errorHandling += 2;
        }

        // Performance optimizations
        if (content.includes('useMemo')) performanceOptimizations++;
        if (content.includes('useCallback')) performanceOptimizations++;
        if (content.includes('React.memo')) performanceOptimizations++;
        if (content.includes('lazy') && content.includes('Suspense')) performanceOptimizations += 2;

        // Naming quality (camelCase, PascalCase for components)
        const componentNames = (content.match(/(?:export\s+)?(?:const|function|class)\s+([A-Z][a-zA-Z0-9]*)/g) || []).length;
        const goodVariableNames = (content.match(/\b[a-z][a-zA-Z0-9]*\s*[:=]/g) || []).length;
        namingQuality += componentNames * 2 + goodVariableNames;
    }

    const complexity = totalComplexity / Math.max(1, files.length);
    const commentRatio = totalLines > 0 ? totalComments / totalLines : 0;
    const avgNamingQuality = namingQuality / Math.max(1, files.length);

    let score = 50;
    const feedback: string[] = [];

    // TypeScript usage
    if (typeScriptUsage > 20) {
        score += 20;
        feedback.push(`✓ Excellent TypeScript usage (${typeScriptUsage} type annotations)`);
    } else if (typeScriptUsage > 5) {
        score += 10;
        feedback.push(`✓ Good TypeScript usage (${typeScriptUsage} type annotations)`);
    } else {
        feedback.push("⚠ Limited TypeScript usage - consider adding more types");
    }

    // Complexity
    if (complexity < 10) {
        score += 10;
        feedback.push(`✓ Low complexity (${Math.round(complexity)} avg per file)`);
    } else if (complexity > 30) {
        score -= 10;
        feedback.push(`⚠ High complexity (${Math.round(complexity)} avg per file) - consider refactoring`);
    }

    // Comments
    if (commentRatio > 0.1) {
        score += 10;
        feedback.push(`✓ Good documentation (${Math.round(commentRatio * 100)}% comment ratio)`);
    } else if (commentRatio < 0.05) {
        feedback.push("⚠ Low comment density - consider adding more documentation");
    }

    // Error handling
    if (errorHandling > 0) {
        score += 10;
        feedback.push(`✓ Error handling present (${errorHandling} instance(s))`);
    } else {
        feedback.push("⚠ No error handling detected - consider adding try/catch or ErrorBoundary");
    }

    // Naming quality
    if (avgNamingQuality > 10) {
        score += 5;
        feedback.push(`✓ Good naming conventions`);
    }

    // Performance
    if (performanceOptimizations > 0) {
        score += 10;
        feedback.push(`✓ Performance optimizations (useMemo, useCallback, etc.)`);
    } else {
        feedback.push("ℹ Consider performance optimizations for expensive operations");
    }

    return {
        score: Math.min(100, Math.max(0, score)),
        feedback,
        metrics: {
            typeScriptUsage,
            complexity: Math.round(complexity),
            commentRatio: Math.round(commentRatio * 100) / 100,
            namingQuality: Math.round(avgNamingQuality),
            errorHandling,
            performanceOptimizations
        }
    };
}

function analyzeUserExperience(files: FileAnalysis[]) {
    let loadingStates = 0;
    let errorStates = 0;
    let accessibility = 0;
    let responsiveDesign = 0;
    let userFeedback = 0;

    for (const file of files) {
        const content = file.content.toLowerCase();
        
        // Loading states
        if (content.includes('loading') || content.includes('isloading') || content.includes('spinner')) {
            loadingStates += (content.match(/loading|isloading|spinner/g) || []).length;
        }

        // Error states
        if (content.includes('error') || content.includes('errormessage') || content.includes('errorboundary')) {
            errorStates += (content.match(/error|errormessage|errorboundary/g) || []).length;
        }

        // Accessibility
        if (content.includes('aria-') || content.includes('role=') || content.includes('alt=')) {
            accessibility += (content.match(/aria-|role=|alt=/g) || []).length;
        }
        if (content.includes('semantic') || content.includes('<main>') || content.includes('<nav>')) {
            accessibility += 2;
        }

        // Responsive design
        if (content.includes('responsive') || content.includes('mobile') || content.includes('breakpoint')) {
            responsiveDesign += 2;
        }
        if (content.includes('@media') || content.includes('tailwind') || content.includes('sm:') || content.includes('md:')) {
            responsiveDesign += 3;
        }

        // User feedback
        if (content.includes('toast') || content.includes('notification') || content.includes('alert')) {
            userFeedback += 2;
        }
        if (content.includes('onclick') || content.includes('onhover') || content.includes('transition')) {
            userFeedback += 1;
        }
    }

    let score = 50;
    const feedback: string[] = [];

    if (loadingStates > 0) {
        score += 15;
        feedback.push(`✓ Loading states implemented (${loadingStates} instance(s))`);
    } else {
        feedback.push("⚠ No loading states detected - users need feedback during async operations");
    }

    if (errorStates > 0) {
        score += 15;
        feedback.push(`✓ Error handling for users (${errorStates} instance(s))`);
    } else {
        feedback.push("⚠ No error states detected - users should see error messages");
    }

    if (accessibility > 5) {
        score += 15;
        feedback.push(`✓ Good accessibility features (${accessibility} instance(s))`);
    } else if (accessibility > 0) {
        score += 5;
        feedback.push(`⚠ Limited accessibility (${accessibility} instance(s)) - consider adding more ARIA labels`);
    } else {
        feedback.push("⚠ No accessibility features detected - add ARIA labels and semantic HTML");
    }

    if (responsiveDesign > 0) {
        score += 10;
        feedback.push(`✓ Responsive design considerations present`);
    } else {
        feedback.push("⚠ No responsive design detected - ensure mobile compatibility");
    }

    if (userFeedback > 0) {
        score += 5;
        feedback.push(`✓ User feedback mechanisms present`);
    }

    return {
        score: Math.min(100, Math.max(0, score)),
        feedback,
        metrics: {
            loadingStates,
            errorStates,
            accessibility,
            responsiveDesign,
            userFeedback
        }
    };
}

function createEmptyReactAnalysis(): ReactAnalysis {
    return {
        componentDesign: { score: 0, feedback: ["❌ No React files found"], metrics: { totalComponents: 0, averageComponentSize: 0, reusableComponents: 0, propInterfaces: 0, componentSeparation: 0 } },
        stateManagement: { score: 0, feedback: ["❌ No React files found"], metrics: { useStateCount: 0, useEffectCount: 0, useContextCount: 0, useReducerCount: 0, customHooks: 0, propDrillingDepth: 0, contextUsage: false } },
        codeQuality: { score: 0, feedback: ["❌ No React files found"], metrics: { typeScriptUsage: 0, complexity: 0, commentRatio: 0, namingQuality: 0, errorHandling: 0, performanceOptimizations: 0 } },
        userExperience: { score: 0, feedback: ["❌ No React files found"], metrics: { loadingStates: 0, errorStates: 0, accessibility: 0, responsiveDesign: 0, userFeedback: 0 } }
    };
}

// ==================== RUST ANALYZER ====================

export function analyzeRust(files: FileAnalysis[]): RustAnalysis {
    const rustFiles = files.filter(f => f.extension === '.rs');

    if (rustFiles.length === 0) {
        return createEmptyRustAnalysis();
    }

    const memorySafety = analyzeRustMemorySafety(rustFiles);
    const codeQuality = analyzeRustCodeQuality(rustFiles);
    const errorHandling = analyzeRustErrorHandling(rustFiles);
    const documentation = analyzeRustDocumentation(rustFiles);

    return { memorySafety, codeQuality, errorHandling, documentation };
}

function analyzeRustMemorySafety(files: FileAnalysis[]) {
    let unsafeBlocks = 0;
    let unwrapCount = 0;
    let expectCount = 0;
    let properErrorHandling = 0;
    let ownershipPatterns = 0;

    for (const file of files) {
        const content = file.content;
        
        unsafeBlocks += (content.match(/\bunsafe\s*{/g) || []).length;
        unwrapCount += (content.match(/\.unwrap\(\)/g) || []).length;
        expectCount += (content.match(/\.expect\(/g) || []).length;
        
        // Proper error handling
        if (content.includes('Result') && (content.includes('?') || content.includes('match'))) {
            properErrorHandling += (content.match(/\bResult\s*</g) || []).length;
        }
        if (content.includes('Option') && (content.includes('match') || content.includes('if let'))) {
            properErrorHandling += (content.match(/\bOption\s*</g) || []).length;
        }

        // Ownership patterns
        if (content.includes('&') || content.includes('&mut')) {
            ownershipPatterns += (content.match(/&\s*\w+|&mut\s+\w+/g) || []).length;
        }
        if (content.includes('move') || content.includes('clone')) {
            ownershipPatterns += 2;
        }
    }

    let score = 50;
    const feedback: string[] = [];

    if (unsafeBlocks > 0) {
        score -= unsafeBlocks * 10;
        feedback.push(`⚠ Found ${unsafeBlocks} unsafe block(s) - use with caution`);
    } else {
        score += 20;
        feedback.push(`✓ No unsafe blocks - excellent memory safety`);
    }

    if (unwrapCount > 10) {
        score -= 15;
        feedback.push(`⚠ High unwrap usage (${unwrapCount}) - consider proper error handling`);
    } else if (unwrapCount > 0) {
        feedback.push(`ℹ Some unwrap() calls (${unwrapCount}) - acceptable for prototyping`);
    } else {
        score += 10;
        feedback.push(`✓ No unwrap() calls - proper error handling`);
    }

    if (expectCount > 0) {
        score += 5;
        feedback.push(`✓ Uses expect() with messages (${expectCount})`);
    }

    if (properErrorHandling > 0) {
        score += 20;
        feedback.push(`✓ Proper error handling with Result/Option (${properErrorHandling} instance(s))`);
    } else {
        feedback.push("⚠ Limited error handling - use Result and Option types");
    }

    if (ownershipPatterns > 0) {
        score += 10;
        feedback.push(`✓ Good ownership patterns (${ownershipPatterns} instance(s))`);
    }

    return {
        score: Math.min(100, Math.max(0, score)),
        feedback,
        metrics: { unsafeBlocks, unwrapCount, expectCount, properErrorHandling, ownershipPatterns }
    };
}

function analyzeRustCodeQuality(files: FileAnalysis[]) {
    let idiomaticPatterns = 0;
    let totalComplexity = 0;
    let totalComments = 0;
    let totalLines = 0;
    let documentation = 0;

    for (const file of files) {
        const content = file.content;
        const lines = content.split('\n');
        totalLines += lines.length;

        // Idiomatic patterns
        if (content.includes('match')) idiomaticPatterns += (content.match(/\bmatch\s+/g) || []).length;
        if (content.includes('if let')) idiomaticPatterns += (content.match(/\bif\s+let\s+/g) || []).length;
        if (content.includes('while let')) idiomaticPatterns += (content.match(/\bwhile\s+let\s+/g) || []).length;
        if (content.includes('impl')) idiomaticPatterns += (content.match(/\bimpl\s+/g) || []).length;
        if (content.includes('trait')) idiomaticPatterns += (content.match(/\btrait\s+/g) || []).length;

        // Complexity
        totalComplexity += (content.match(/\bif\s*\(|\bfor\s+|\bwhile\s+|\bmatch\s+/g) || []).length;

        // Comments
        totalComments += (content.match(/\/\/.*|\/\*[\s\S]*?\*\//g) || []).length;

        // Documentation
        documentation += (content.match(/\/\/\/.*|#\[doc\s*=\s*"/g) || []).length;
    }

    const complexity = totalComplexity / Math.max(1, files.length);
    const commentRatio = totalLines > 0 ? totalComments / totalLines : 0;

    let score = 50;
    const feedback: string[] = [];

    if (idiomaticPatterns > 5) {
        score += 20;
        feedback.push(`✓ Excellent idiomatic Rust (${idiomaticPatterns} patterns)`);
    } else if (idiomaticPatterns > 0) {
        score += 10;
        feedback.push(`✓ Good Rust patterns (${idiomaticPatterns})`);
    }

    if (complexity < 15) {
        score += 10;
        feedback.push(`✓ Manageable complexity (${Math.round(complexity)} avg)`);
    } else if (complexity > 30) {
        score -= 10;
        feedback.push(`⚠ High complexity (${Math.round(complexity)} avg)`);
    }

    if (commentRatio > 0.1) {
        score += 10;
        feedback.push(`✓ Good documentation (${Math.round(commentRatio * 100)}% comments)`);
    }

    if (documentation > 0) {
        score += 10;
        feedback.push(`✓ Doc comments present (${documentation})`);
    }

    return {
        score: Math.min(100, Math.max(0, score)),
        feedback,
        metrics: { idiomaticPatterns, complexity: Math.round(complexity), commentRatio: Math.round(commentRatio * 100) / 100, documentation }
    };
}

function analyzeRustErrorHandling(files: FileAnalysis[]) {
    let resultUsage = 0;
    let optionUsage = 0;
    let errorPropagation = 0;
    let matchStatements = 0;

    for (const file of files) {
        const content = file.content;
        
        resultUsage += (content.match(/\bResult\s*</g) || []).length;
        optionUsage += (content.match(/\bOption\s*</g) || []).length;
        errorPropagation += (content.match(/\?/g) || []).length;
        matchStatements += (content.match(/\bmatch\s+/g) || []).length;
    }

    let score = 50;
    const feedback: string[] = [];

    if (resultUsage > 0) {
        score += 20;
        feedback.push(`✓ Uses Result type (${resultUsage} instance(s))`);
    } else {
        feedback.push("⚠ No Result type usage - essential for error handling");
    }

    if (optionUsage > 0) {
        score += 10;
        feedback.push(`✓ Uses Option type (${optionUsage} instance(s))`);
    }

    if (errorPropagation > 0) {
        score += 15;
        feedback.push(`✓ Error propagation with ? operator (${errorPropagation} instance(s))`);
    }

    if (matchStatements > 0) {
        score += 10;
        feedback.push(`✓ Pattern matching for error handling (${matchStatements} instance(s))`);
    }

    return {
        score: Math.min(100, Math.max(0, score)),
        feedback,
        metrics: { resultUsage, optionUsage, errorPropagation, matchStatements }
    };
}

function analyzeRustDocumentation(files: FileAnalysis[]) {
    let docComments = 0;
    let examples = 0;
    let readmeQuality = 0;

    for (const file of files) {
        const content = file.content;
        
        docComments += (content.match(/\/\/\/.*|#\[doc\s*=\s*"/g) || []).length;
        examples += (content.match(/#\[cfg\(test\)\]|#\[test\]/g) || []).length;
    }

    let score = 50;
    const feedback: string[] = [];

    if (docComments > 5) {
        score += 25;
        feedback.push(`✓ Excellent documentation (${docComments} doc comments)`);
    } else if (docComments > 0) {
        score += 10;
        feedback.push(`✓ Some documentation (${docComments} doc comments)`);
    } else {
        feedback.push("⚠ No doc comments found - add /// documentation");
    }

    if (examples > 0) {
        score += 15;
        feedback.push(`✓ Includes tests/examples (${examples})`);
    }

    return {
        score: Math.min(100, Math.max(0, score)),
        feedback,
        metrics: { docComments, examples, readmeQuality }
    };
}

function createEmptyRustAnalysis(): RustAnalysis {
    return {
        memorySafety: { score: 0, feedback: ["❌ No Rust files found"], metrics: { unsafeBlocks: 0, unwrapCount: 0, expectCount: 0, properErrorHandling: 0, ownershipPatterns: 0 } },
        codeQuality: { score: 0, feedback: ["❌ No Rust files found"], metrics: { idiomaticPatterns: 0, complexity: 0, commentRatio: 0, documentation: 0 } },
        errorHandling: { score: 0, feedback: ["❌ No Rust files found"], metrics: { resultUsage: 0, optionUsage: 0, errorPropagation: 0, matchStatements: 0 } },
        documentation: { score: 0, feedback: ["❌ No Rust files found"], metrics: { docComments: 0, examples: 0, readmeQuality: 0 } }
    };
}

// ==================== PYTHON ANALYZER ====================

export function analyzePython(files: FileAnalysis[]): PythonAnalysis {
    const pythonFiles = files.filter(f => f.extension === '.py');

    if (pythonFiles.length === 0) {
        return createEmptyPythonAnalysis();
    }

    const codeReadability = analyzePythonReadability(pythonFiles);
    const logicCorrectness = analyzePythonLogic(pythonFiles);
    const useOfConcepts = analyzePythonConcepts(pythonFiles);
    const explanationClarity = analyzePythonDocumentation(pythonFiles);

    return { codeReadability, logicCorrectness, useOfConcepts, explanationClarity };
}

function analyzePythonReadability(files: FileAnalysis[]) {
    let namingQuality = 0;
    let structure = 0;
    let totalComments = 0;
    let totalLines = 0;
    let longLines = 0;

    for (const file of files) {
        const content = file.content;
        const lines = content.split('\n');
        totalLines += lines.length;

        // Naming quality (snake_case for functions/variables, PascalCase for classes)
        const functions = (content.match(/\bdef\s+[a-z_][a-z0-9_]*\s*\(/g) || []).length;
        const classes = (content.match(/\bclass\s+[A-Z][a-zA-Z0-9]*\s*:/g) || []).length;
        namingQuality += functions + classes * 2;

        // Structure (functions, classes, modules)
        structure += functions + classes;
        if (content.includes('if __name__')) structure += 2;

        // Comments
        totalComments += (content.match(/#.*/g) || []).length;

        // Line length (PEP 8: max 79 chars)
        for (const line of lines) {
            if (line.length > 100) longLines++;
        }
    }

    const commentRatio = totalLines > 0 ? totalComments / totalLines : 0;
    const avgNaming = namingQuality / Math.max(1, files.length);

    let score = 50;
    const feedback: string[] = [];

    if (avgNaming > 5) {
        score += 20;
        feedback.push(`✓ Good naming conventions (${Math.round(avgNaming)} identifiers)`);
    } else {
        feedback.push("⚠ Consider improving naming conventions");
    }

    if (structure > 5) {
        score += 15;
        feedback.push(`✓ Well-structured code (${structure} functions/classes)`);
    }

    if (commentRatio > 0.15) {
        score += 15;
        feedback.push(`✓ Excellent documentation (${Math.round(commentRatio * 100)}% comments)`);
    } else if (commentRatio > 0.05) {
        score += 5;
        feedback.push(`✓ Some documentation (${Math.round(commentRatio * 100)}% comments)`);
    } else {
        feedback.push("⚠ Low comment density - add more documentation");
    }

    if (longLines > 0) {
        score -= Math.min(10, longLines);
        feedback.push(`⚠ ${longLines} line(s) exceed 100 characters (PEP 8: max 79)`);
    } else {
        score += 5;
        feedback.push(`✓ Good line length compliance`);
    }

    return {
        score: Math.min(100, Math.max(0, score)),
        feedback,
        metrics: {
            namingQuality: Math.round(avgNaming),
            structure,
            commentRatio: Math.round(commentRatio * 100) / 100,
            lineLength: longLines
        }
    };
}

function analyzePythonLogic(files: FileAnalysis[]) {
    let edgeCaseHandling = 0;
    let errorHandling = 0;
    let validation = 0;
    let testCoverage = 0;

    for (const file of files) {
        const content = file.content;
        
        // Edge case handling
        if (content.includes('if') && (content.includes('None') || content.includes('empty') || content.includes('len'))) {
            edgeCaseHandling += (content.match(/\bif\s+.*(?:None|empty|len)/g) || []).length;
        }

        // Error handling
        if (content.includes('try') && content.includes('except')) {
            errorHandling += (content.match(/\btry\s*:/g) || []).length;
        }
        if (content.includes('raise')) {
            errorHandling += (content.match(/\braise\s+/g) || []).length;
        }

        // Validation
        if (content.includes('assert') || content.includes('isinstance') || content.includes('validate')) {
            validation += (content.match(/\bassert\s+|\bisinstance\s*\(/g) || []).length;
        }

        // Tests
        if (content.includes('test_') || content.includes('unittest') || content.includes('pytest')) {
            testCoverage += 2;
        }
    }

    let score = 50;
    const feedback: string[] = [];

    if (edgeCaseHandling > 0) {
        score += 15;
        feedback.push(`✓ Edge case handling (${edgeCaseHandling} instance(s))`);
    } else {
        feedback.push("⚠ Consider edge case handling (None, empty, etc.)");
    }

    if (errorHandling > 0) {
        score += 20;
        feedback.push(`✓ Error handling with try/except (${errorHandling} instance(s))`);
    } else {
        feedback.push("⚠ No error handling detected - add try/except blocks");
    }

    if (validation > 0) {
        score += 10;
        feedback.push(`✓ Input validation (${validation} instance(s))`);
    }

    if (testCoverage > 0) {
        score += 15;
        feedback.push(`✓ Tests present (test coverage indicators found)`);
    } else {
        feedback.push("⚠ No tests detected - consider adding unit tests");
    }

    return {
        score: Math.min(100, Math.max(0, score)),
        feedback,
        metrics: { edgeCaseHandling, errorHandling, validation, testCoverage }
    };
}

function analyzePythonConcepts(files: FileAnalysis[]) {
    const advancedFeatures: string[] = [];
    let designPatterns = 0;
    let typeHints = 0;
    let asyncUsage = 0;

    for (const file of files) {
        const content = file.content;
        
        // Advanced features
        if (content.includes('@') && content.includes('def')) {
            advancedFeatures.push('Decorators');
        }
        if (content.includes('yield')) {
            advancedFeatures.push('Generators');
        }
        if (content.includes('[') && content.includes('for') && content.includes('in')) {
            advancedFeatures.push('List Comprehensions');
        }
        if (content.includes('async') && content.includes('await')) {
            asyncUsage++;
            advancedFeatures.push('Async/Await');
        }
        if (content.includes('lambda')) {
            advancedFeatures.push('Lambda Functions');
        }
        if (content.includes('with') && content.includes('as')) {
            advancedFeatures.push('Context Managers');
        }

        // Design patterns
        if (content.includes('__init__') && content.includes('self')) {
            designPatterns++;
        }
        if (content.includes('@staticmethod') || content.includes('@classmethod')) {
            designPatterns++;
        }

        // Type hints
        typeHints += (content.match(/:\s*\w+[\[\]|]|->\s*\w+/g) || []).length;
    }

    const uniqueFeatures = [...new Set(advancedFeatures)];

    let score = 50;
    const feedback: string[] = [];

    if (uniqueFeatures.length > 3) {
        score += 25;
        feedback.push(`✓ Excellent use of Python features: ${uniqueFeatures.join(', ')}`);
    } else if (uniqueFeatures.length > 0) {
        score += 15;
        feedback.push(`✓ Uses advanced features: ${uniqueFeatures.join(', ')}`);
    } else {
        feedback.push("⚠ Limited use of Python features - explore decorators, generators, etc.");
    }

    if (designPatterns > 0) {
        score += 10;
        feedback.push(`✓ Design patterns present (${designPatterns})`);
    }

    if (typeHints > 5) {
        score += 15;
        feedback.push(`✓ Good type hints (${typeHints} annotations)`);
    } else if (typeHints > 0) {
        score += 5;
        feedback.push(`✓ Some type hints (${typeHints} annotations)`);
    } else {
        feedback.push("⚠ No type hints - consider adding type annotations");
    }

    if (asyncUsage > 0) {
        score += 10;
        feedback.push(`✓ Async/await usage (${asyncUsage} instance(s))`);
    }

    return {
        score: Math.min(100, Math.max(0, score)),
        feedback,
        metrics: {
            advancedFeatures: uniqueFeatures,
            designPatterns,
            typeHints,
            asyncUsage
        }
    };
}

function analyzePythonDocumentation(files: FileAnalysis[]) {
    let docstrings = 0;
    let comments = 0;
    let readmeQuality = 0;

    for (const file of files) {
        const content = file.content;
        
        // Docstrings (triple quotes)
        docstrings += (content.match(/"""[^]*?"""|'''[^]*?'''/g) || []).length;
        
        // Comments
        comments += (content.match(/#.*/g) || []).length;
    }

    let score = 50;
    const feedback: string[] = [];

    if (docstrings > 5) {
        score += 30;
        feedback.push(`✓ Excellent documentation (${docstrings} docstrings)`);
    } else if (docstrings > 0) {
        score += 15;
        feedback.push(`✓ Some docstrings (${docstrings})`);
    } else {
        feedback.push("⚠ No docstrings found - add function/class documentation");
    }

    if (comments > 10) {
        score += 10;
        feedback.push(`✓ Good inline comments (${comments})`);
    }

    return {
        score: Math.min(100, Math.max(0, score)),
        feedback,
        metrics: { docstrings, comments, readmeQuality }
    };
}

function createEmptyPythonAnalysis(): PythonAnalysis {
    return {
        codeReadability: { score: 0, feedback: ["❌ No Python files found"], metrics: { namingQuality: 0, structure: 0, commentRatio: 0, lineLength: 0 } },
        logicCorrectness: { score: 0, feedback: ["❌ No Python files found"], metrics: { edgeCaseHandling: 0, errorHandling: 0, validation: 0, testCoverage: 0 } },
        useOfConcepts: { score: 0, feedback: ["❌ No Python files found"], metrics: { advancedFeatures: [], designPatterns: 0, typeHints: 0, asyncUsage: 0 } },
        explanationClarity: { score: 0, feedback: ["❌ No Python files found"], metrics: { docstrings: 0, comments: 0, readmeQuality: 0 } }
    };
}

// ==================== JAVASCRIPT/TYPESCRIPT ANALYZER ====================

export function analyzeJavaScript(files: FileAnalysis[]): PythonAnalysis {
    const jsFiles = files.filter(f => f.extension === '.js' || f.extension === '.mjs');
    
    // Reuse Python structure for JS (similar metrics)
    return analyzePython(files); // Temporary - can be customized
}

export function analyzeTypeScript(files: FileAnalysis[]): PythonAnalysis {
    const tsFiles = files.filter(f => f.extension === '.ts' || f.extension === '.tsx');
    
    // Similar to Python but with TypeScript-specific checks
    return analyzePython(files); // Temporary - can be customized
}

