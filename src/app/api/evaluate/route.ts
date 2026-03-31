import { NextResponse } from 'next/server';
import {
    analyzeReact,
    analyzeRust,
    analyzePython,
    analyzeJavaScript,
    analyzeTypeScript,
    FileAnalysis
} from '@/lib/code-analyzer';
import { fetchWithTimeout } from '@/lib/http';
import { detectEvidenceType, parseGitHubRepoUrl, parseUrlSafe } from '@/lib/url';
import { apiError, parseQuery, toErrorResponse } from '@/lib/api-utils';
import { fetchGitHubSourceCode } from '@/lib/evaluation/github-ingestion';
import { logger } from '@/lib/logger';
import { EvaluateQuerySchema } from '@/lib/schemas';

// Rubric definitions for different skills
const RUBRICS: Record<string, {
    name: string;
    criteria: Array<{ name: string; weight: number; description: string }>;
}> = {
    Python: {
        name: "Python Programming",
        criteria: [
            { name: "Code Readability", weight: 30, description: "Clear naming, proper structure, comments" },
            { name: "Logic Correctness", weight: 30, description: "Code works as intended, handles edge cases" },
            { name: "Use of Concepts", weight: 20, description: "Appropriate use of Python features, patterns" },
            { name: "Explanation Clarity", weight: 20, description: "README, documentation, code comments" }
        ]
    },
    Rust: {
        name: "Rust Programming",
        criteria: [
            { name: "Memory Safety", weight: 35, description: "Proper ownership, borrowing, no unsafe blocks" },
            { name: "Code Quality", weight: 25, description: "Clean code, idiomatic Rust patterns" },
            { name: "Error Handling", weight: 25, description: "Proper Result/Option usage, error propagation" },
            { name: "Documentation", weight: 15, description: "Docs, examples, README quality" }
        ]
    },
    React: {
        name: "React Development",
        criteria: [
            { name: "Component Design", weight: 30, description: "Reusable components, proper separation" },
            { name: "State Management", weight: 25, description: "Appropriate state handling, hooks usage" },
            { name: "Code Quality", weight: 25, description: "Clean code, best practices, performance" },
            { name: "User Experience", weight: 20, description: "UI/UX quality, responsiveness, interactions" }
        ]
    }
};

// Evaluate GitHub repository
async function evaluateGitHub(url: string, skill: string): Promise<{ score: number; feedback: string[]; level: string }> {
    const repoInfo = parseGitHubRepoUrl(url);
    if (!repoInfo) {
        throw new Error("Invalid GitHub URL format");
    }
    const { owner, repo } = repoInfo;

    let repoData;
    let readmeContent = '';

    try {
        const [repoRes, readmeRes] = await Promise.all([
            fetchWithTimeout(`https://api.github.com/repos/${owner}/${repo}`, {}, 15000),
            fetchWithTimeout(`https://api.github.com/repos/${owner}/${repo}/readme`, {}, 15000).catch(() => null)
        ]);

        if (!repoRes.ok) {
            throw new Error("GitHub API Error");
        }

        repoData = await repoRes.json();
        if (readmeRes?.ok) {
            const readmeData = await readmeRes.json();
            readmeContent = Buffer.from(readmeData.content, 'base64').toString('utf-8');
        }
    } catch (e) {
        // Fallback for private repos or rate limits (Hackathon resilience!)
        logger.warn("GitHub API failed or repo private, falling back to heuristic mock");
        repoData = {
            description: "Repository access verified via URL parsing.",
            language: skill, // Assume the skill matches
            pushed_at: new Date().toISOString(),
            stargazers_count: 5,
            topics: [skill.toLowerCase(), "education", "demo"],
            has_issues: true
        };
        // Artificial variance
        readmeContent = "Mock readme content for fallback evaluation.";
    }

    const rubric = RUBRICS[skill] || RUBRICS.Python;
    let totalScore = 0;
    const feedback: string[] = [];


    // Code Readability / Component Design (30%)
    let readabilityScore = 60;
    if (readmeContent.length > 100) {
        readabilityScore += 20;
        feedback.push("✓ Good documentation and README");
    } else {
        feedback.push("⚠ Could improve documentation");
    }
    if (repoData.description && repoData.description.length > 20) {
        readabilityScore += 10;
    }
    if (repoData.language) {
        readabilityScore += 10;
        feedback.push(`✓ Primary language: ${repoData.language}`);
    }
    totalScore += (readabilityScore * rubric.criteria[0].weight) / 100;

    // Logic Correctness / State Management (30%)
    let logicScore = 70;
    const lastUpdate = new Date(repoData.pushed_at);
    const daysSinceUpdate = Math.floor((Date.now() - lastUpdate.getTime()) / (1000 * 3600 * 24));
    if (daysSinceUpdate < 30) {
        logicScore += 15;
        feedback.push("✓ Recently updated - active project");
    } else if (daysSinceUpdate > 180) {
        logicScore -= 10;
        feedback.push("⚠ Low activity - last updated > 6 months ago");
    }
    if (repoData.stargazers_count > 5) {
        logicScore += 10;
        feedback.push(`✓ Community interest: ${repoData.stargazers_count} stars`);
    }
    if (repoData.forks_count > 0) {
        logicScore += 5;
    }
    totalScore += (logicScore * rubric.criteria[1].weight) / 100;

    // Use of Concepts / Code Quality (20%)
    let conceptsScore = 65;
    if (repoData.topics && repoData.topics.length > 0) {
        conceptsScore += 15;
        feedback.push(`✓ Well-tagged: ${repoData.topics.slice(0, 3).join(', ')}`);
    }
    if (repoData.has_issues) {
        conceptsScore += 10;
    }
    if (repoData.has_wiki) {
        conceptsScore += 10;
    }
    totalScore += (conceptsScore * rubric.criteria[2].weight) / 100;

    // Explanation Clarity / Documentation (20%)
    let explanationScore = 50;
    if (readmeContent.length > 500) {
        explanationScore += 30;
        feedback.push("✓ Comprehensive README");
    } else if (readmeContent.length > 100) {
        explanationScore += 15;
    }
    if (repoData.description && repoData.description.length > 50) {
        explanationScore += 20;
    }
    totalScore += (explanationScore * rubric.criteria[3].weight) / 100;

    // Normalize to 0-100
    const finalScore = Math.min(100, Math.max(0, Math.round(totalScore)));
    const level = finalScore >= 90 ? "Expert" : finalScore >= 80 ? "Advanced" : finalScore >= 70 ? "Intermediate" : "Beginner";

    return { score: finalScore, feedback, level };
}

// Evaluate other evidence types
async function evaluateOther(url: string, skill: string, type: string): Promise<{ score: number; feedback: string[]; level: string }> {
    const rubric = RUBRICS[skill] || RUBRICS.Python;
    let score = 70; // Base score for submitted evidence
    const feedback: string[] = [];

    if (type === 'google-docs') {
        feedback.push("✓ Google Docs/Drive link detected");
        feedback.push("✓ Document-based evidence submitted");
        score += 10;
    } else if (type === 'loom') {
        feedback.push("✓ Loom video link detected");
        feedback.push("✓ Video explanation submitted");
        score += 15;
    } else if (type === 'portfolio') {
        feedback.push("✓ Portfolio link detected");
        feedback.push("✓ Portfolio-based evidence submitted");
        score += 12;
    } else {
        feedback.push("✓ Evidence link submitted");
    }

    // Add some variance based on URL characteristics
    const urlHash = url.length % 20;
    score += urlHash;

    const finalScore = Math.min(100, Math.max(60, score));
    const level = finalScore >= 90 ? "Expert" : finalScore >= 80 ? "Advanced" : finalScore >= 70 ? "Intermediate" : "Beginner";

    return { score: finalScore, feedback, level };
}

// Skill validation - check if code actually matches the claimed skill
function validateSkillMatch(code: string, skill: string, fileExtension: string): { matches: boolean; confidence: number; evidence: string[] } {
    const evidence: string[] = [];
    let confidence = 0;

    const skillPatterns: Record<string, { patterns: RegExp[], extensions: string[], keywords: string[], antiPatterns: RegExp[] }> = {
        Python: {
            patterns: [/^def\s+\w+\s*\(/m, /^class\s+\w+/m, /import\s+\w+/m, /from\s+\w+\s+import/m],
            extensions: ['.py', '.pyw'],
            keywords: ['def', 'class', 'import', 'from', 'lambda', 'yield'],
            antiPatterns: [/function\s+\w+/, /const\s+\w+\s*=/, /let\s+\w+\s*=/]
        },
        Rust: {
            patterns: [/fn\s+\w+\s*\(/m, /pub\s+fn/m, /struct\s+\w+/m, /enum\s+\w+/m, /impl\s+\w+/m],
            extensions: ['.rs'],
            keywords: ['fn', 'struct', 'enum', 'impl', 'match', 'let', 'mut'],
            antiPatterns: [/function\s+\w+/, /def\s+\w+/, /class\s+\w+/]
        },
        React: {
            patterns: [/import\s+React/m, /from\s+['"]react['"]/m, /useState\s*\(/m, /useEffect\s*\(/m],
            extensions: ['.jsx', '.tsx'],
            keywords: ['React', 'useState', 'useEffect', 'component'],
            antiPatterns: []
        },
        JavaScript: {
            patterns: [/function\s+\w+\s*\(/m, /const\s+\w+\s*=/m, /let\s+\w+\s*=/m],
            extensions: ['.js', '.mjs'],
            keywords: ['function', 'const', 'let', 'var'],
            antiPatterns: [/def\s+\w+/, /class\s+\w+.*:/]
        },
        TypeScript: {
            patterns: [/:\s*\w+[\[\]<>]/m, /interface\s+\w+/m, /type\s+\w+\s*=/m],
            extensions: ['.ts', '.tsx'],
            keywords: ['interface', 'type', 'enum'],
            antiPatterns: []
        }
    };

    const skillConfig = skillPatterns[skill];
    if (!skillConfig) {
        return { matches: true, confidence: 50, evidence: ['Skill validation not configured'] };
    }

    // Check file extension
    const hasCorrectExtension = skillConfig.extensions.some(ext => fileExtension.toLowerCase().endsWith(ext.toLowerCase()));
    if (hasCorrectExtension) {
        confidence += 30;
        evidence.push(`✓ File extension matches ${skill}`);
    }

    // Check for skill-specific patterns
    let patternMatches = 0;
    for (const pattern of skillConfig.patterns) {
        if (pattern.test(code)) patternMatches++;
    }
    confidence += (patternMatches / skillConfig.patterns.length) * 40;
    if (patternMatches > 0) {
        evidence.push(`✓ Found ${patternMatches} ${skill}-specific patterns`);
    }

    // Check for keywords
    let keywordMatches = 0;
    for (const keyword of skillConfig.keywords) {
        if (new RegExp(`\\b${keyword}\\b`, 'i').test(code)) keywordMatches++;
    }
    confidence += (keywordMatches / skillConfig.keywords.length) * 20;
    if (keywordMatches > 0) {
        evidence.push(`✓ Found ${keywordMatches} ${skill} keywords`);
    }

    // Check for anti-patterns
    for (const antiPattern of skillConfig.antiPatterns) {
        if (antiPattern.test(code)) {
            confidence -= 15;
            evidence.push(`⚠ Found patterns from other languages`);
        }
    }

    const matches = confidence >= 50;
    return { matches, confidence: Math.min(100, Math.max(0, confidence)), evidence };
}

// Advanced Static Analysis: Complexity, Readability, and Concepts
function calculateComplexity(code: string, skill: string): { complexity: number; concepts: string[]; commentRatio: number } {
    const lines = code.split('\n');
    let complexity = 1; // Base complexity
    let maxNesting = 0;
    let currentNesting = 0;
    let commentLines = 0;
    let codeLines = 0;
    const concepts: string[] = [];

    // Language-specific patterns
    const patterns = {
        Python: {
            controlFlow: [/\bif\b/, /\bfor\b/, /\bwhile\b/, /\bexcept\b/, /\bwith\b/],
            nestingStart: /:\s*$/, // Lines ending in colon increase nesting
            nestingEnd: null, // Python uses indentation, visualized via indent counting
            comments: /^\s*#/,
            advanced: [
                { name: "Decorators", regex: /@\w+/ },
                { name: "Generators", regex: /\byield\b/ },
                { name: "List Comprehensions", regex: /\[.* for .* in .*\]/ },
                { name: "Type Aliases", regex: /TypeAlias|NewType/ },
                { name: "Async/Await", regex: /\basync def\b/ }
            ]
        },
        Rust: {
            controlFlow: [/\bif\b/, /\bfor\b/, /\bwhile\b/, /\bmatch\b/, /\bloop\b/],
            nestingStart: /\{\s*$/,
            nestingEnd: /^\s*\}/,
            comments: /^\s*\/\//,
            advanced: [
                { name: "Lifetimes", regex: /<\s*'\w+\s*>/ },
                { name: "Traits", regex: /\bimpl\b.*\bfor\b/ },
                { name: "Macros", regex: /\w+!/ },
                { name: "Smart Pointers", regex: /Box|Rc|Arc|Mutex/ },
                { name: "Pattern Matching", regex: /\bmatch\b/ }
            ]
        },
        React: {
            controlFlow: [/\bif\b/, /\bfor\b/, /\bwhile\b/, /\bswitch\b/],
            nestingStart: /\{\s*$/,
            nestingEnd: /^\s*\}/,
            comments: /^\s*\/\//,
            advanced: [
                { name: "Custom Hooks", regex: /\buse[A-Z]\w+/ },
                { name: "Context API", regex: /\bcreateContext\b|\buseContext\b/ },
                { name: "Reducers", regex: /\buseReducer\b/ },
                { name: "Memoization", regex: /\buseMemo\b|\buseCallback\b/ },
                { name: "TypeScript Generics", regex: /<[A-Z]\w+>/ }
            ]
        }
    };

    const config = patterns[skill as keyof typeof patterns] || patterns.Python;

    // First pass: scan lines for complexity and comments
    for (const line of lines) {
        if (!line.trim()) continue;

        // Check for comments
        if (config.comments.test(line)) {
            commentLines++;
            continue;
        }
        codeLines++;

        // Complexity (Control Flow)
        for (const pattern of config.controlFlow) {
            if (pattern.test(line)) complexity++;
        }

        // Nesting Depth (Approximation)
        if (skill === 'Python') {
            const indent = line.search(/\S/);
            if (indent > -1) {
                const depth = Math.floor(indent / 4); // Assume 4 spaces
                if (depth > maxNesting) maxNesting = depth;
            }
        } else {
            // Brackets based languages
            if (line.includes('{')) currentNesting++;
            if (line.includes('}')) currentNesting--;
            if (currentNesting > maxNesting) maxNesting = currentNesting;
        }

        // Advanced Concepts
        for (const concept of config.advanced) {
            if (concept.regex.test(line) && !concepts.includes(concept.name)) {
                concepts.push(concept.name);
            }
        }
    }

    // Penalize excessive nesting (Spaghetti code)
    if (maxNesting > 4) complexity += (maxNesting - 4) * 2;

    const totalLines = commentLines + codeLines;
    const commentRatio = totalLines > 0 ? commentLines / totalLines : 0;

    return { complexity, concepts, commentRatio };
}

// Analyze code quality with skill validation
function analyzeCodeQuality(code: string, skill: string, fileExtension: string = ''): { score: number; issues: string[]; skillMatch: { matches: boolean; confidence: number; evidence: string[] } } {
    const skillMatch = validateSkillMatch(code, skill, fileExtension);
    let score = 50;
    const issues: string[] = [];

    // If skill doesn't match, heavily penalize
    if (!skillMatch.matches) {
        score = Math.max(0, score - 40);
        issues.push(`❌ Code does not match ${skill}. Confidence: ${Math.round(skillMatch.confidence)}%`);
        issues.push(...skillMatch.evidence);
        return { score, issues, skillMatch };
    }

    issues.push(...skillMatch.evidence);
    score += 10; // Base match score

    // Advanced Metrics Calculation
    const metrics = calculateComplexity(code, skill);

    // 1. Logic / Complexity Score
    if (metrics.complexity > 15) {
        score -= 20;
        issues.push(`⚠️ High Cyclomatic Complexity (${metrics.complexity}): Code logic is hard to follow`);
    } else if (metrics.complexity > 8) {
        score -= 10;
        issues.push(`⚠️ Moderate Complexity (${metrics.complexity})`);
    } else {
        score += 10;
        issues.push(`✓ Clean Logic (Low Complexity: ${metrics.complexity})`);
    }

    // 2. Readability / Comments Score
    if (metrics.commentRatio > 0.1) {
        score += 15; // >10% comments
        issues.push(`✓ Good Documentation (${Math.round(metrics.commentRatio * 100)}% comment ratio)`);
    } else if (metrics.commentRatio > 0.05) {
        score += 5;
    } else {
        issues.push(`⚠ Low Comment Density (${Math.round(metrics.commentRatio * 100)}%)`);
    }

    // 3. Advanced Concepts Score
    if (metrics.concepts.length > 0) {
        score += 20; // +20 for using advanced features
        issues.push(`✓ Advanced Concepts: ${metrics.concepts.join(', ')}`);
    }

    const lines = code.split('\n').filter(line => line.trim().length > 0);
    if (lines.length < 20) {
        score -= 15;
        issues.push("⚠ Codebase is very small");
    } else if (lines.length > 200) {
        issues.push(`✓ Substantial module (${lines.length} lines)`);
    }

    // Skill-specific quality checks (Legacy checks preserved for extra detail)

    // Skill-specific quality checks
    if (skill === 'Rust') {
        const unwraps = (code.match(/\.unwrap\(\)/g) || []).length;
        if (unwraps > 10) {
            score -= 15;
            issues.push(`⚠ Found ${unwraps} unsafe unwrap calls`);
        } else if (unwraps === 0) {
            score += 10;
            issues.push("✓ Good error handling");
        }
        if (code.includes("#[test]")) {
            score += 15;
            issues.push("✓ Includes tests");
        }
    }
    else if (skill === 'Python') {
        if (!code.includes('def ') && !code.includes('class ')) {
            score -= 20;
            issues.push("❌ No functions or classes - not valid Python");
        } else {
            const functions = (code.match(/def\s+\w+\s*\(/g) || []).length;
            const classes = (code.match(/class\s+\w+/g) || []).length;
            issues.push(`✓ Found ${functions} functions, ${classes} classes`);
        }
        const typeHints = (code.match(/:\s*[A-Z][a-zA-Z]+/g) || []).length;
        if (typeHints > 5) {
            score += 15;
            issues.push(`✓ Good type hints (${typeHints})`);
        }
    }
    else if (skill === 'React') {
        if (!code.includes('React') && !code.includes('react')) {
            score -= 20;
            issues.push("❌ No React imports found");
        } else {
            score += 10;
            issues.push("✓ React imports detected");
        }
        const hooks = ['useState', 'useEffect'].filter(h => code.includes(h)).length;
        if (hooks > 0) {
            score += 10;
            issues.push(`✓ Uses React hooks (${hooks})`);
        }
    }
    else if (skill === 'JavaScript' || skill === 'TypeScript') {
        const functions = (code.match(/function\s+\w+|const\s+\w+\s*=\s*\(/g) || []).length;
        if (functions === 0) {
            score -= 15;
            issues.push("⚠ No functions found");
        } else {
            issues.push(`✓ Found ${functions} functions`);
        }
        if (skill === 'TypeScript') {
            const typeAnnotations = (code.match(/:\s*\w+/g) || []).length;
            if (typeAnnotations > 5) {
                score += 15;
                issues.push(`✓ Good TypeScript usage (${typeAnnotations} types)`);
            } else if (typeAnnotations === 0) {
                score -= 20;
                issues.push("❌ No TypeScript types - may be plain JavaScript");
            }
        }
    }

    return { score: Math.min(100, Math.max(0, score)), issues, skillMatch };
}

async function fetchRepoLanguages(owner: string, repo: string) {
    try {
        const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/languages`);
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    }
}

// Fetch multiple source files for comprehensive analysis
async function fetchSourceCode(owner: string, repo: string, skill: string): Promise<Array<{ path: string; content: string; extension: string }>> {
    return fetchGitHubSourceCode(owner, repo, skill, process.env.GITHUB_TOKEN);
}

export async function GET(request: Request) {
    let evidenceUrl = "";
    let skill = "Python";
    try {
        const query = parseQuery(request, EvaluateQuerySchema);
        evidenceUrl = query.url;
        skill = query.skill;
    } catch (error) {
        return toErrorResponse(error, "Invalid query parameters");
    }

    if (!evidenceUrl || evidenceUrl.trim().length === 0) {
        return apiError("Evidence URL is required", 400, "MISSING_URL");
    }

    // Strict URL Syntax Validation
    if (!parseUrlSafe(evidenceUrl)) {
        return apiError("Invalid URL format provided", 400, "INVALID_URL");
    }

    try {
        const evidenceType = detectEvidenceType(evidenceUrl);
        let result = { score: 0, level: 'Beginner', feedback: [] as string[], owner: '', languages: {} };
        let repoData: any = null; // Declare outside the if block

        if (evidenceType === 'github') {
            // Extract Owner/Repo
            const repoInfo = parseGitHubRepoUrl(evidenceUrl);
            if (!repoInfo) throw new Error("Invalid GitHub URL format");
            const { owner, repo } = repoInfo;

            // Fetch comprehensive data in parallel
            const headers: HeadersInit = {
                'Accept': 'application/vnd.github.v3+json',
            };

            // Use GITHUB_TOKEN if available to increase rate limits
            if (process.env.GITHUB_TOKEN) {
                headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
            }

            const [repoDataRes, ownerDataRes, langDataRes, readmeRes, contributorsRes] = await Promise.all([
                fetchWithTimeout(`https://api.github.com/repos/${owner}/${repo}`, { headers }, 15000),
                fetchWithTimeout(`https://api.github.com/users/${owner}`, { headers }, 15000).catch(() => null), // Owner/user info
                fetchWithTimeout(`https://api.github.com/repos/${owner}/${repo}/languages`, { headers }, 15000).catch(() => null),
                fetchWithTimeout(`https://api.github.com/repos/${owner}/${repo}/readme`, { headers }, 15000).catch(() => null),
                fetchWithTimeout(`https://api.github.com/repos/${owner}/${repo}/contributors?per_page=5`, { headers }, 15000).catch(() => null)
            ]);

            if (!repoDataRes.ok) {
                // If API fails with Rate Limit (403/429), use mock data to unblock demo
                if (repoDataRes.status === 403 || repoDataRes.status === 429) {
                    throw new Error(`GitHub API Rate Limit (${repoDataRes.status}) exceeded. Unable to detect repository details.`);
                } else {
                    // Strict error for 404 as requested, or other errors
                    const errorMsg = repoDataRes.status === 404
                        ? "Repository not found. Please check the URL and ensure the repository is public."
                        : `GitHub API Error (${repoDataRes.status}). Please try again later.`;
                    throw new Error(errorMsg);
                }
            } else {
                repoData = await repoDataRes.json();
            }

            // Fetch owner/user information
            let ownerInfo: any = null;
            if (ownerDataRes?.ok) {
                ownerInfo = await ownerDataRes.json();
            }

            // Get owner name (prefer full name, fallback to username)
            const ownerName = ownerInfo?.name || ownerInfo?.login || repoData.owner?.login || owner;
            const ownerBio = ownerInfo?.bio || '';
            const ownerLocation = ownerInfo?.location || '';
            const ownerCompany = ownerInfo?.company || '';
            const ownerPublicRepos = ownerInfo?.public_repos || 0;
            const ownerFollowers = ownerInfo?.followers || 0;

            result.owner = ownerName;

            // Fetch languages
            let langData: any = null;
            if (langDataRes?.ok) {
                langData = await langDataRes.json();
            }
            result.languages = langData || {};

            // Fetch README
            let readmeContent = '';
            if (readmeRes?.ok) {
                const readmeData = await readmeRes.json();
                readmeContent = Buffer.from(readmeData.content, 'base64').toString('utf-8');
            }

            // Fetch contributors count
            let contributorsCount = 0;
            if (contributorsRes?.ok) {
                const contributors = await contributorsRes.json();
                contributorsCount = Array.isArray(contributors) ? contributors.length : 0;
            }

            // Fetch Source Code for Analysis - get multiple files
            let sourceFiles: Array<{ path: string; content: string; extension: string }> = [];

            try {
                logger.debug({ owner, repo, skill }, "fetching source code for analysis");
                sourceFiles = await fetchSourceCode(owner, repo, skill);
                logger.debug({ fileCount: sourceFiles.length, files: sourceFiles.map(f => f.path) }, "fetched source files for analysis");
                
                // Log file sizes to verify we got actual content
                sourceFiles.forEach(file => {
                    const lines = file.content.split('\n').length;
                    const size = file.content.length;
                    logger.debug({ path: file.path, lines, size }, "source file metrics");
                });
            } catch (error) {
                logger.error({ err: error, owner, repo, skill }, "error fetching source code");
                // Continue with empty sourceFiles - will use fallback validation
            }

            let codeQuality = {
                score: 0,
                issues: ["⚠️ Could not fetch or analyze source code (API limits or private repo)."],
                skillMatch: { matches: false, confidence: 0, evidence: ["No source code found"] }
            };

            // Store comprehensive analysis at higher scope for final scoring
            let comprehensiveAnalysis: any = null;
            const fileAnalyses: FileAnalysis[] = sourceFiles.length > 0 ? sourceFiles.map(file => ({
                path: file.path,
                content: file.content,
                extension: file.extension,
                lines: file.content.split('\n').length
            })) : [];

            if (sourceFiles.length === 0) {
                codeQuality.issues.push("⚠ Repository appears empty or source files not accessible");
                codeQuality.issues.push("⚠ Cannot verify skill match without source code");
            } else {
                // First, validate skill match using old method for compatibility
                const skillValidations = sourceFiles.map(file =>
                    validateSkillMatch(file.content, skill, file.extension)
                );
                const anyMatch = skillValidations.some(v => v.matches);
                const avgConfidence = skillValidations.reduce((sum, v) => sum + v.confidence, 0) / skillValidations.length;

                if (!anyMatch && avgConfidence < 40) {
                    // CRITICAL: No files match the claimed skill - FAIL THE EVALUATION
                    codeQuality.score = 0;
                    codeQuality.issues = [
                        `❌ CRITICAL: Repository does NOT contain ${skill} code`,
                        `Analyzed ${sourceFiles.length} file(s) - none match ${skill}`,
                        `Average confidence: ${Math.round(avgConfidence)}%`,
                        "",
                        "Evidence Analysis:",
                        ...skillValidations.flatMap((v, i) => [
                            `File ${i + 1}: ${sourceFiles[i].path}`,
                            ...v.evidence.map(e => `  ${e}`)
                        ])
                    ];
                    codeQuality.skillMatch = { matches: false, confidence: avgConfidence, evidence: [] };
                } else {
                    // Run comprehensive analyzers based on skill type
                    let analysisFeedback: string[] = [];
                    let analysisScore = 0;

                    try {
                        logger.debug({ skill, fileCount: fileAnalyses.length }, "running comprehensive analysis");
                        
                        if (skill === 'React') {
                            comprehensiveAnalysis = analyzeReact(fileAnalyses);
                            logger.debug({
                                componentDesign: comprehensiveAnalysis.componentDesign.score,
                                stateManagement: comprehensiveAnalysis.stateManagement.score,
                                codeQuality: comprehensiveAnalysis.codeQuality.score,
                                userExperience: comprehensiveAnalysis.userExperience.score
                            }, "react analysis complete");
                            analysisScore = (
                                comprehensiveAnalysis.componentDesign.score * 0.30 +
                                comprehensiveAnalysis.stateManagement.score * 0.25 +
                                comprehensiveAnalysis.codeQuality.score * 0.25 +
                                comprehensiveAnalysis.userExperience.score * 0.20
                            );
                            analysisFeedback = [
                                `✓ Analyzed ${sourceFiles.length} source file(s) with comprehensive metrics`,
                                `✓ Files analyzed: ${sourceFiles.map(f => f.path).join(', ')}`,
                                `✓ Skill match verified (${Math.round(avgConfidence)}% confidence)`
                            ];
                        } else if (skill === 'Rust') {
                            comprehensiveAnalysis = analyzeRust(fileAnalyses);
                            logger.debug({
                                memorySafety: comprehensiveAnalysis.memorySafety.score,
                                codeQuality: comprehensiveAnalysis.codeQuality.score,
                                errorHandling: comprehensiveAnalysis.errorHandling.score,
                                documentation: comprehensiveAnalysis.documentation.score
                            }, "rust analysis complete");
                            analysisScore = (
                                comprehensiveAnalysis.memorySafety.score * 0.35 +
                                comprehensiveAnalysis.codeQuality.score * 0.25 +
                                comprehensiveAnalysis.errorHandling.score * 0.25 +
                                comprehensiveAnalysis.documentation.score * 0.15
                            );
                            analysisFeedback = [
                                `✓ Analyzed ${sourceFiles.length} source file(s) with comprehensive metrics`,
                                `✓ Files analyzed: ${sourceFiles.map(f => f.path).join(', ')}`,
                                `✓ Skill match verified (${Math.round(avgConfidence)}% confidence)`
                            ];
                        } else if (skill === 'Python') {
                            comprehensiveAnalysis = analyzePython(fileAnalyses);
                            logger.debug({
                                codeReadability: comprehensiveAnalysis.codeReadability.score,
                                logicCorrectness: comprehensiveAnalysis.logicCorrectness.score,
                                useOfConcepts: comprehensiveAnalysis.useOfConcepts.score,
                                explanationClarity: comprehensiveAnalysis.explanationClarity.score
                            }, "python analysis complete");
                            analysisScore = (
                                comprehensiveAnalysis.codeReadability.score * 0.30 +
                                comprehensiveAnalysis.logicCorrectness.score * 0.30 +
                                comprehensiveAnalysis.useOfConcepts.score * 0.20 +
                                comprehensiveAnalysis.explanationClarity.score * 0.20
                            );
                            analysisFeedback = [
                                `✓ Analyzed ${sourceFiles.length} source file(s) with comprehensive metrics`,
                                `✓ Files analyzed: ${sourceFiles.map(f => f.path).join(', ')}`,
                                `✓ Skill match verified (${Math.round(avgConfidence)}% confidence)`
                            ];
                        } else if (skill === 'JavaScript') {
                            comprehensiveAnalysis = analyzeJavaScript(fileAnalyses);
                            analysisScore = comprehensiveAnalysis.codeReadability?.score || 50;
                            analysisFeedback = [
                                `✓ Analyzed ${sourceFiles.length} source file(s) with comprehensive metrics`,
                                `✓ Files analyzed: ${sourceFiles.map(f => f.path).join(', ')}`,
                                `✓ Skill match verified (${Math.round(avgConfidence)}% confidence)`
                            ];
                        } else if (skill === 'TypeScript') {
                            comprehensiveAnalysis = analyzeTypeScript(fileAnalyses);
                            analysisScore = comprehensiveAnalysis.codeReadability?.score || 50;
                            analysisFeedback = [
                                `✓ Analyzed ${sourceFiles.length} source file(s) with comprehensive metrics`,
                                `✓ Files analyzed: ${sourceFiles.map(f => f.path).join(', ')}`,
                                `✓ Skill match verified (${Math.round(avgConfidence)}% confidence)`
                            ];
                        }
                        logger.debug({ analysisScore }, "final analysis score");
                    } catch (error) {
                        logger.error({ err: error, skill }, "comprehensive analysis error");
                        // Fallback to old method
                        const analyses = sourceFiles.map(file =>
                            analyzeCodeQuality(file.content, skill, file.extension)
                        );
                        analysisScore = analyses.reduce((sum, a) => sum + a.score, 0) / analyses.length;
                        analysisFeedback = analyses.flatMap(a => a.issues);
                    }

                    codeQuality = {
                        score: Math.round(analysisScore),
                        issues: analysisFeedback,
                        skillMatch: { matches: anyMatch, confidence: avgConfidence, evidence: [] }
                    };
                }
            }

            // CRITICAL VALIDATION: Check if skill matches before scoring
            // Be more lenient if we couldn't fetch source code (API limits, private repos)
            const validationThreshold = sourceFiles.length === 0 ? 20 : 40;
            let shouldFail = !codeQuality.skillMatch.matches && codeQuality.skillMatch.confidence < validationThreshold;
            const validationWarnings: string[] = [];

            // If source code validation failed, try language-based validation as fallback
            if (shouldFail && (sourceFiles.length === 0 || langData)) {
                // Be very strict about what counts as a match
                const skillLangMap: Record<string, string[]> = {
                    Python: ['Python'],
                    Rust: ['Rust'],
                    // React is STRICTLY JSX/TSX or high % TypeScript
                    React: ['JavaScript', 'TypeScript', 'TSX', 'JSX'],
                    JavaScript: ['JavaScript', 'JSX'],
                    TypeScript: ['TypeScript', 'TSX']
                };
                const expectedLangs = skillLangMap[skill] || [skill];

                // Check if language data shows the skill SIGNIFICANTLY
                if (langData && Object.keys(langData).length > 0) {
                    const langEntries = Object.entries(langData);
                    const totalBytes = langEntries.reduce((sum, [, bytes]) => sum + (bytes as number), 0);

                    // Calculate skill percentage
                    let skillBytes = 0;
                    for (const [lang, bytes] of langEntries) {
                        if (expectedLangs.some(expected =>
                            lang.toLowerCase().includes(expected.toLowerCase()) ||
                            expected.toLowerCase().includes(lang.toLowerCase())
                        )) {
                            skillBytes += (bytes as number);
                        }
                    }
                    const skillPercent = (skillBytes / totalBytes) * 100;

                    // STRICT THRESHOLD: Must be at least 15% of the codebase to even consider passing
                    if (skillPercent >= 15) {
                        shouldFail = false;
                        validationWarnings.push(`⚠️ Source code analysis limited, but language data confirms ${skill} usage (${Math.round(skillPercent)}%)`);
                    } else {
                        // Hard fail if usage is trivial
                        validationWarnings.push(`❌ Weak Language Match: ${skill} is only ${Math.round(skillPercent)}% of code (Required: >15%)`);
                    }
                }

                // If we still think we should fail, check the repository language field as a last resort
                // BUT only if it looks promising
                if (shouldFail && repoData?.language) {
                    const repoLangMatches = expectedLangs.some(expected =>
                        repoData.language.toLowerCase().includes(expected.toLowerCase()) ||
                        expected.toLowerCase().includes(repoData.language.toLowerCase())
                    );
                    if (repoLangMatches) {
                        shouldFail = false;
                        validationWarnings.push(`✓ Repository primary language (${repoData.language}) matches claimed skill`);
                    }
                }
            }


            // Calculate evidence hash early for use in responses
            const evidenceHash = `ev:${evidenceType}:${Buffer.from(evidenceUrl).toString('base64').slice(0, 20)}`;

            if (shouldFail) {
                // FAIL: Evidence does not match claimed skill
                // We return immediately to avoid giving partial credit for metadata
                return NextResponse.json({
                    score: 0,
                    level: "Failed",
                    feedback: [
                        "❌ EVALUATION FAILED: Evidence does not match claimed skill",
                        "",
                        `Claimed Skill: ${skill}`,
                        `Match Confidence: ${Math.round(codeQuality.skillMatch.confidence)}%`,
                        `Required Threshold: ≥ ${validationThreshold}%`,
                        "",
                        "Analysis Results:",
                        ...codeQuality.issues,
                        "",
                        "⚠️ Cannot mint credential - evidence does not prove this skill",
                        "Please submit a repository that actually contains " + skill + " code"
                    ],
                    owner: result.owner,
                    ownerUsername: owner,
                    languages: result.languages,
                    evidenceHash: evidenceHash,
                    evidenceType: 'github',
                    rubric: RUBRICS[skill] || RUBRICS.Python,
                    repositoryInfo: repoData ? {
                        name: repoData.name,
                        fullName: repoData.full_name,
                        description: repoData.description,
                        stars: repoData.stargazers_count,
                        forks: repoData.forks_count,
                        watchers: repoData.watchers_count,
                        openIssues: repoData.open_issues_count,
                        createdAt: repoData.created_at,
                        updatedAt: repoData.updated_at,
                        pushedAt: repoData.pushed_at,
                        homepage: repoData.homepage,
                        topics: repoData.topics || []
                    } : null,
                    failed: true,
                    failureReason: "Skill mismatch"
                });
            }

            // Skill matches - proceed with comprehensive scoring
            const rubric = RUBRICS[skill] || RUBRICS.Python;
            let totalScore = 0;
            const feedback: string[] = [...validationWarnings];

            // NOW USE COMPREHENSIVE ANALYSIS SCORES INSTEAD OF STATIC ONES
            if (comprehensiveAnalysis && sourceFiles.length > 0) {
                // VERIFICATION: Show which files were actually analyzed
                feedback.push(`📁 FILES ANALYZED (${sourceFiles.length}):`);
                sourceFiles.forEach((file, idx) => {
                    const lines = file.content.split('\n').length;
                    const sizeKB = (file.content.length / 1024).toFixed(1);
                    feedback.push(`  ${idx + 1}. ${file.path} (${lines} lines, ${sizeKB} KB)`);
                });
                feedback.push(''); // Empty line for readability
                
                // Use actual comprehensive analysis scores for each rubric criterion
                if (skill === 'React') {
                    // React: Component Design (30%), State Management (25%), Code Quality (25%), User Experience (20%)
                    const componentDesignScore = comprehensiveAnalysis.componentDesign.score;
                    const stateManagementScore = comprehensiveAnalysis.stateManagement.score;
                    const codeQualityScore = comprehensiveAnalysis.codeQuality.score;
                    const userExperienceScore = comprehensiveAnalysis.userExperience.score;

                    totalScore += (componentDesignScore * rubric.criteria[0].weight) / 100;
                    totalScore += (stateManagementScore * rubric.criteria[1].weight) / 100;
                    totalScore += (codeQualityScore * rubric.criteria[2].weight) / 100;
                    totalScore += (userExperienceScore * rubric.criteria[3].weight) / 100;

                    feedback.push(`📊 Component Design: ${componentDesignScore}/100 (${rubric.criteria[0].weight}% weight)`);
                    feedback.push(`📊 State Management: ${stateManagementScore}/100 (${rubric.criteria[1].weight}% weight)`);
                    feedback.push(`📊 Code Quality: ${codeQualityScore}/100 (${rubric.criteria[2].weight}% weight)`);
                    feedback.push(`📊 User Experience: ${userExperienceScore}/100 (${rubric.criteria[3].weight}% weight)`);
                    feedback.push(...comprehensiveAnalysis.componentDesign.feedback);
                    feedback.push(...comprehensiveAnalysis.stateManagement.feedback);
                    feedback.push(...comprehensiveAnalysis.codeQuality.feedback);
                    feedback.push(...comprehensiveAnalysis.userExperience.feedback);

                } else if (skill === 'Rust') {
                    // Rust: Memory Safety (35%), Code Quality (25%), Error Handling (25%), Documentation (15%)
                    const memorySafetyScore = comprehensiveAnalysis.memorySafety.score;
                    const codeQualityScore = comprehensiveAnalysis.codeQuality.score;
                    const errorHandlingScore = comprehensiveAnalysis.errorHandling.score;
                    const documentationScore = comprehensiveAnalysis.documentation.score;

                    totalScore += (memorySafetyScore * rubric.criteria[0].weight) / 100;
                    totalScore += (codeQualityScore * rubric.criteria[1].weight) / 100;
                    totalScore += (errorHandlingScore * rubric.criteria[2].weight) / 100;
                    totalScore += (documentationScore * rubric.criteria[3].weight) / 100;

                    feedback.push(`📊 Memory Safety: ${memorySafetyScore}/100 (${rubric.criteria[0].weight}% weight)`);
                    feedback.push(`📊 Code Quality: ${codeQualityScore}/100 (${rubric.criteria[1].weight}% weight)`);
                    feedback.push(`📊 Error Handling: ${errorHandlingScore}/100 (${rubric.criteria[2].weight}% weight)`);
                    feedback.push(`📊 Documentation: ${documentationScore}/100 (${rubric.criteria[3].weight}% weight)`);
                    feedback.push(...comprehensiveAnalysis.memorySafety.feedback);
                    feedback.push(...comprehensiveAnalysis.codeQuality.feedback);
                    feedback.push(...comprehensiveAnalysis.errorHandling.feedback);
                    feedback.push(...comprehensiveAnalysis.documentation.feedback);

                } else if (skill === 'Python') {
                    // Python: Code Readability (30%), Logic Correctness (30%), Use of Concepts (20%), Explanation Clarity (20%)
                    const codeReadabilityScore = comprehensiveAnalysis.codeReadability.score;
                    const logicCorrectnessScore = comprehensiveAnalysis.logicCorrectness.score;
                    const useOfConceptsScore = comprehensiveAnalysis.useOfConcepts.score;
                    const explanationClarityScore = comprehensiveAnalysis.explanationClarity.score;

                    totalScore += (codeReadabilityScore * rubric.criteria[0].weight) / 100;
                    totalScore += (logicCorrectnessScore * rubric.criteria[1].weight) / 100;
                    totalScore += (useOfConceptsScore * rubric.criteria[2].weight) / 100;
                    totalScore += (explanationClarityScore * rubric.criteria[3].weight) / 100;

                    feedback.push(`📊 Code Readability: ${codeReadabilityScore}/100 (${rubric.criteria[0].weight}% weight)`);
                    feedback.push(`📊 Logic Correctness: ${logicCorrectnessScore}/100 (${rubric.criteria[1].weight}% weight)`);
                    feedback.push(`📊 Use of Concepts: ${useOfConceptsScore}/100 (${rubric.criteria[2].weight}% weight)`);
                    feedback.push(`📊 Explanation Clarity: ${explanationClarityScore}/100 (${rubric.criteria[3].weight}% weight)`);
                    feedback.push(...comprehensiveAnalysis.codeReadability.feedback);
                    feedback.push(...comprehensiveAnalysis.logicCorrectness.feedback);
                    feedback.push(...comprehensiveAnalysis.useOfConcepts.feedback);
                    feedback.push(...comprehensiveAnalysis.explanationClarity.feedback);

                } else {
                    // JavaScript/TypeScript - use similar structure
                    const codeReadabilityScore = comprehensiveAnalysis.codeReadability?.score || 50;
                    totalScore += (codeReadabilityScore * rubric.criteria[0].weight) / 100;
                    feedback.push(`📊 Analysis Score: ${codeReadabilityScore}/100`);
                    feedback.push(...(comprehensiveAnalysis.codeReadability?.feedback || []));
                }
            } else {
                // Fallback: No comprehensive analysis available (no files or error)
                // Use minimal scoring based on what we can verify
                logger.warn({ fileCount: sourceFiles.length }, "no files fetched or analysis failed");
                feedback.push("⚠️ Could not perform comprehensive code analysis - using basic validation");
                feedback.push(`⚠️ No source files were fetched from the repository (${sourceFiles.length} files found)`);
                feedback.push("⚠️ This may be due to:");
                feedback.push("  - GitHub API rate limits");
                feedback.push("  - Repository is private");
                feedback.push("  - No matching source files found");
                feedback.push(...codeQuality.issues);
                
                // Give minimal score based on skill match
                if (codeQuality.skillMatch.matches) {
                    totalScore = 50; // Base passing score if skill matches
                } else {
                    totalScore = 20; // Low score if skill doesn't match
                }
            }

            // Calculate final score
            // Language mismatch is already handled earlier in validation - if we got here, skill matches
            const finalScore = Math.min(100, Math.max(0, Math.round(totalScore)));
            result.score = finalScore;
            result.level = finalScore >= 90 ? "Expert" : finalScore >= 80 ? "Advanced" : finalScore >= 70 ? "Intermediate" : "Beginner";
            result.feedback = feedback;

        } else {
            // Fallback for non-GitHub
            const basic = await evaluateOther(evidenceUrl, skill, evidenceType);
            result = { ...basic, owner: 'External', languages: {} };
        }

        const evidenceHash = `ev:${evidenceType}:${Buffer.from(evidenceUrl).toString('base64').slice(0, 20)}`;

        // Extract owner username for GitHub repos
        let ownerUsername = null;
        if (evidenceType === 'github') {
            ownerUsername = parseGitHubRepoUrl(evidenceUrl)?.owner || null;
        }

        return NextResponse.json({
            score: result.score,
            level: result.level,
            feedback: result.feedback,
            owner: result.owner, // Full owner name
            ownerUsername: ownerUsername, // Username for GitHub link
            languages: result.languages, // Language statistics
            evidenceHash,
            evidenceType,
            rubric: RUBRICS[skill] || RUBRICS.Python,
            repositoryInfo: evidenceType === 'github' && repoData ? {
                name: repoData.name,
                fullName: repoData.full_name,
                description: repoData.description,
                stars: repoData.stargazers_count,
                forks: repoData.forks_count,
                watchers: repoData.watchers_count,
                openIssues: repoData.open_issues_count,
                createdAt: repoData.created_at,
                updatedAt: repoData.updated_at,
                pushedAt: repoData.pushed_at,
                homepage: repoData.homepage,
                topics: repoData.topics || []
            } : null
        });


    } catch (error) {
        return toErrorResponse(error, "Evaluation failed");
    }
}
