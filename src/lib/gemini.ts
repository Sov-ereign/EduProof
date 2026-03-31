import { fetchWithTimeout } from "@/lib/http";
import { logger } from "@/lib/logger";

// OpenRouter API client
function getOpenRouterApiKey() {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
        throw new Error('OPENROUTER_API_KEY is not set in environment variables. Please add it to .env.local');
    }
    return apiKey;
}

// Cache for available model
let cachedModelName: string | null = null;

// Get available model by trying common free models on OpenRouter
async function getAvailableModel(): Promise<string> {
    // Return cached model if available
    if (cachedModelName) {
        return cachedModelName;
    }
    
    const apiKey = getOpenRouterApiKey();
    
    // List of free models to try in order of preference
    const modelsToTry = [
        'tngtech/deepseek-r1t2-chimera:free',      // Primary model (free tier)
        'mistralai/mistral-7b-instruct:free',      // Fallback (free tier)
    ];

    let lastError = null;

    for (const modelName of modelsToTry) {
        try {
            // Test with a tiny prompt
            const response = await fetchWithTimeout('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: modelName,
                    messages: [{ role: 'user', content: 'Hi' }],
                    max_tokens: 10,
                }),
            }, 15000);
            
            if (response.ok) {
                logger.info({ model: modelName }, "openrouter model selected");
                cachedModelName = modelName;
                return modelName;
            }
        } catch (e: any) {
            logger.warn({ model: modelName, err: e }, "openrouter model unavailable, trying fallback");
            lastError = e;
            continue;
        }
    }
    
    throw new Error(
        'No available models found with your OpenRouter API key. ' +
        'Please check: https://openrouter.ai/models for available models.'
    );
}

// Call OpenRouter API
async function callOpenRouter(model: string, messages: Array<{ role: string; content: string }>, maxTokens: number = 2000) {
    const apiKey = getOpenRouterApiKey();
    
    const response = await fetchWithTimeout('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model,
            messages,
            max_tokens: maxTokens,
            temperature: 0.5, // Lower temperature for faster, more deterministic responses
        }),
    }, 25000);
    
    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(`OpenRouter API error: ${error.error?.message || error.error || 'Failed to generate response'}`);
    }
    
    const data = await response.json();
    return data.choices[0]?.message?.content || '';
}

/**
 * Robust JSON parser that handles malformed JSON from AI models
 * Fixes common issues like Python tuples, markdown code blocks, etc.
 * Preserves string contents and handles escaped characters properly.
 */
function parseJSONSafely(text: string, context: string = 'JSON'): any {
    let jsonText = text.trim();
    
    // Strategy 1: Try direct parse first (fastest path for valid JSON)
    try {
        return JSON.parse(jsonText);
    } catch {
        // Continue to cleanup strategies
    }
    
    // Strategy 2: Remove markdown code blocks
    if (jsonText.includes('```json')) {
        const match = jsonText.match(/```json\s*([\s\S]*?)\s*```/);
        if (match) {
            jsonText = match[1].trim();
            try {
                return JSON.parse(jsonText);
            } catch {
                // Continue
            }
        }
    } else if (jsonText.includes('```')) {
        const match = jsonText.match(/```[a-z]*\s*([\s\S]*?)\s*```/);
        if (match) {
            jsonText = match[1].trim();
            try {
                return JSON.parse(jsonText);
            } catch {
                // Continue
            }
        }
    }
    
    // Strategy 3: Extract JSON by finding the outermost array or object
    // This handles cases where there's extra text before/after
    const extractJSON = (str: string): string | null => {
        // Find the first [ or {
        let firstBracket = Infinity;
        let startChar = '';
        let endChar = '';
        
        const arrayIndex = str.indexOf('[');
        const objectIndex = str.indexOf('{');
        
        if (arrayIndex !== -1 && arrayIndex < firstBracket) {
            firstBracket = arrayIndex;
            startChar = '[';
            endChar = ']';
        }
        if (objectIndex !== -1 && objectIndex < firstBracket) {
            firstBracket = objectIndex;
            startChar = '{';
            endChar = '}';
        }
        
        if (firstBracket === Infinity) {
            return null;
        }
        
        const startIndex = firstBracket;
        
        // Track depth, but be careful inside strings
        let depth = 0;
        let inString = false;
        let escapeNext = false;
        let lastIndex = startIndex;
        
        for (let i = startIndex; i < str.length; i++) {
            const char = str[i];
            
            if (escapeNext) {
                escapeNext = false;
                continue;
            }
            
            if (char === '\\') {
                escapeNext = true;
                continue;
            }
            
            if (char === '"') {
                inString = !inString;
                continue;
            }
            
            if (!inString) {
                if (char === startChar) {
                    depth++;
                } else if (char === endChar) {
                    depth--;
                    if (depth === 0) {
                        lastIndex = i + 1;
                        break;
                    }
                }
            }
        }
        
        if (depth !== 0) {
            return null; // Unmatched brackets
        }
        
        return str.substring(startIndex, lastIndex);
    };
    
    // Try extracting JSON
    const extracted = extractJSON(jsonText);
    if (extracted) {
        jsonText = extracted;
        try {
            return JSON.parse(jsonText);
        } catch {
            // Continue to fix strategies
        }
    }
    
    // Strategy 4: Quick fixes - remove trailing commas and try parse
    let cleaned = jsonText.replace(/,(\s*[}\]])/g, '$1');
    
    try {
        return JSON.parse(cleaned);
    } catch {
        // Continue to tuple fixing only if needed
    }
    
    // Strategy 5: Fix Python-style tuples OUTSIDE of strings only
    const fixTuples = (str: string): string => {
        let result = '';
        let inString = false;
        let escapeNext = false;
        let i = 0;
        
        while (i < str.length) {
            const char = str[i];
            
            if (escapeNext) {
                result += char;
                escapeNext = false;
                i++;
                continue;
            }
            
            if (char === '\\') {
                result += char;
                escapeNext = true;
                i++;
                continue;
            }
            
            if (char === '"') {
                inString = !inString;
                result += char;
                i++;
                continue;
            }
            
            if (!inString) {
                // Look for tuples: (value1, value2, ...)
                // Only if it's in a value context (after : or , or [)
                if (char === '(' && (i === 0 || /[\[:,\s]/.test(str[i - 1]))) {
                    // Find the matching closing parenthesis
                    let tupleDepth = 1;
                    let tupleStart = i;
                    let tupleEnd = i + 1;
                    let tupleInString = false;
                    let tupleEscape = false;
                    
                    for (let j = i + 1; j < str.length && tupleDepth > 0; j++) {
                        const tupleChar = str[j];
                        
                        if (tupleEscape) {
                            tupleEscape = false;
                            continue;
                        }
                        
                        if (tupleChar === '\\') {
                            tupleEscape = true;
                            continue;
                        }
                        
                        if (tupleChar === '"') {
                            tupleInString = !tupleInString;
                            continue;
                        }
                        
                        if (!tupleInString) {
                            if (tupleChar === '(') {
                                tupleDepth++;
                            } else if (tupleChar === ')') {
                                tupleDepth--;
                                if (tupleDepth === 0) {
                                    tupleEnd = j + 1;
                                    break;
                                }
                            }
                        }
                    }
                    
                    if (tupleDepth === 0) {
                        // Extract tuple content
                        const tupleContent = str.substring(tupleStart + 1, tupleEnd - 1);
                        // Replace tuple with array
                        result += '[' + tupleContent + ']';
                        i = tupleEnd;
                        continue;
                    }
                }
            }
            
            result += char;
            i++;
        }
        
        return result;
    };
    
    cleaned = fixTuples(cleaned);
    
    // Strategy 6: Final parse attempt with all fixes
    try {
        return JSON.parse(cleaned);
    } catch (parseError: any) {
        // Log detailed error information
        const errorPos = parseError.message.match(/position (\d+)/)?.[1];
        logger.error({ err: parseError, context }, "failed to parse model JSON output");
        
        if (errorPos) {
            const pos = parseInt(errorPos);
            const start = Math.max(0, pos - 200);
            const end = Math.min(cleaned.length, pos + 200);
            logger.error(
                {
                    context,
                    preview: cleaned.substring(start, end),
                    position: pos,
                    character: cleaned[pos],
                    charCode: cleaned.charCodeAt(pos),
                },
                "problematic JSON near parser error position",
            );
        } else {
            logger.error({ context, preview: cleaned.substring(0, 2000) }, "problematic JSON preview");
        }
        
        // Strategy 7: Fix escaped quotes in arrays (common AI mistake)
        // The AI sometimes returns [\"value\"] instead of ["value"]
        // We need to fix this by processing arrays character by character
        let finalAttempt = cleaned;
        
        // Process the string to fix escaped quotes inside arrays
        let result = '';
        let i = 0;
        let inArray = false;
        let arrayDepth = 0;
        let inString = false;
        let escapeNext = false;
        
        while (i < finalAttempt.length) {
            const char = finalAttempt[i];
            const nextChar = i + 1 < finalAttempt.length ? finalAttempt[i + 1] : '';
            
            if (escapeNext) {
                // If we're inside an array and see \", replace with just "
                if (inArray && char === '"') {
                    result += '"';
                } else {
                    result += '\\' + char;
                }
                escapeNext = false;
                i++;
                continue;
            }
            
            if (char === '\\') {
                escapeNext = true;
                i++;
                continue;
            }
            
            if (char === '"') {
                inString = !inString;
                result += char;
                i++;
                continue;
            }
            
            if (!inString) {
                if (char === '[') {
                    arrayDepth++;
                    inArray = true;
                    result += char;
                    i++;
                    continue;
                }
                
                if (char === ']') {
                    arrayDepth--;
                    if (arrayDepth === 0) {
                        inArray = false;
                    }
                    result += char;
                    i++;
                    continue;
                }
            }
            
            result += char;
            i++;
        }
        
        finalAttempt = result;
        
        try {
            return JSON.parse(finalAttempt);
        } catch (finalError: any) {
            // Strategy 8: Ultra-lenient cleanup - remove unwanted symbols but keep structure
            let ultraLenient = finalAttempt;
            
            // Remove markdown code block markers if still present
            ultraLenient = ultraLenient.replace(/```json\s*/g, '');
            ultraLenient = ultraLenient.replace(/```\s*/g, '');
            ultraLenient = ultraLenient.replace(/`/g, '');
            
            // Remove any backslashes before quotes in array contexts (more aggressive)
            // Pattern: find [ ... ] and fix \" to " inside
            ultraLenient = ultraLenient.replace(/\[([^\]]*)\]/g, (match, content) => {
                // Replace all \" with " inside array brackets
                const fixed = content.replace(/\\"/g, '"');
                return '[' + fixed + ']';
            });
            
            // Fix escaped quotes in object values that are clearly wrong
            // Pattern: "key": \"value\" should become "key": "value"  
            ultraLenient = ultraLenient.replace(/:\s*\\"/g, ': "');
            
            // Last resort: if we're here, be very aggressive with array-like patterns
            // But preserve valid JSON string escapes
            // Only do this if previous attempts failed
            
            // Fix common issues: remove trailing commas more aggressively
            ultraLenient = ultraLenient.replace(/,(\s*[}\]])/g, '$1');
            
            // Remove any control characters except newlines and tabs
            ultraLenient = ultraLenient.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');
            
            try {
                return JSON.parse(ultraLenient);
            } catch {
                // Strategy 9: Try to extract and parse partial JSON
                // Extract just the array part if it exists
                const arrayMatch = ultraLenient.match(/\[[\s\S]*\]/);
                if (arrayMatch) {
                    try {
                        const partial = arrayMatch[0];
                        // One more aggressive cleanup on the partial
                        const cleanedPartial = partial
                            .replace(/\\"/g, '"')  // Remove all escaped quotes
                            .replace(/,(\s*[}\]])/g, '$1')  // Remove trailing commas
                            .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');  // Remove control chars
                        
                        const parsed = JSON.parse(cleanedPartial);
                        if (Array.isArray(parsed) && parsed.length > 0) {
                            logger.warn({ context, itemCount: parsed.length }, "parsed partial JSON fallback");
                            return parsed;
                        }
                    } catch {
                        // Continue to next strategy
                    }
                }
                
                // Strategy 10: Last resort - try to manually construct valid objects from fragments
                // Extract individual challenge objects even if array is broken
                const objectMatches = ultraLenient.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g);
                if (objectMatches && objectMatches.length > 0) {
                    const validObjects: any[] = [];
                    for (const objStr of objectMatches) {
                        try {
                            // Clean up the object string
                            let cleanObj = objStr
                                .replace(/\\"/g, '"')
                                .replace(/,(\s*[}])/g, '$1')
                                .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');
                            
                            const parsed = JSON.parse(cleanObj);
                            // Validate it has required fields
                            if (parsed.title || parsed.description || parsed.functionSignature) {
                                validObjects.push(parsed);
                            }
                        } catch {
                            // Skip this object, continue with others
                            continue;
                        }
                    }
                    
                    if (validObjects.length > 0) {
                        logger.warn({ context, itemCount: validObjects.length }, "extracted valid JSON objects from malformed output");
                        return validObjects;
                    }
                }
                
                // All strategies failed - but let's still try to provide useful error
                logger.error({ context, preview: ultraLenient.substring(0, 500) }, "all JSON parsing strategies failed");
                
                // Don't throw - return empty array or try one more time with very basic cleanup
                // This allows the retry mechanism to kick in
                throw new Error(
                    `Invalid JSON in ${context} after all cleanup attempts: ${parseError.message}. ` +
                    `Raw text preview (first 1000 chars): ${text.substring(0, 1000)}`
                );
            }
        }
    }
}

export interface RepoAnalysis {
    files: Array<{ path: string; content: string; extension: string }>;
    readme: string;
    languages: Record<string, number>;
    skill: string;
    owner: string;
    repositoryInfo?: {
        name: string;
        fullName: string;
        description: string;
        stars: number;
        forks: number;
    };
}

export interface MCQQuestion {
    id: string;
    question: string;
    options: string[];
    correctAnswer: number; // index of correct option
    explanation?: string;
}

export interface CodingChallenge {
    id: string;
    title: string;
    description: string;
    functionSignature: string;
    testCases: Array<{
        input: any;
        expectedOutput: any;
        description?: string;
    }>;
    starterCode?: string;
}

/**
 * Generate MCQ questions based on repository analysis
 */
export async function generateMCQs(
    repoAnalysis: RepoAnalysis,
    skill: string,
    count: number = 10
): Promise<MCQQuestion[]> {
    // Get an available model
    const model = await getAvailableModel();

    // Prepare repository context
    const fileExcerpts = repoAnalysis.files.slice(0, 10).map(f => 
        `File: ${f.path}\nContent:\n${f.content.substring(0, 1000)}`
    ).join('\n\n');

    const readmeContext = repoAnalysis.readme 
        ? `\n\nREADME:\n${repoAnalysis.readme.substring(0, 1000)}`
        : '';

    const prompt = `You are an expert technical interviewer for ${skill}.
Based on the following repository context, generate ${count} high-quality multiple-choice questions.
The questions should test deep understanding of the concepts used in THIS SPECIFIC codebase, not just general ${skill} knowledge.

REPOSITORY CONTEXT:
Skill: ${skill}
${readmeContext}
Top Languages: ${JSON.stringify(repoAnalysis.languages)}
Code Samples:
${fileExcerpts}

FORMAT REQUIREMENTS:
Return ONLY a JSON array of objects with the following structure:
[
    {
        "id": "q1",
        "question": "The question text...",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctAnswer": 0,
        "explanation": "Brief explanation of why this is correct based on the code or best practices."
    }
]`;

    try {
        const text = await callOpenRouter(model, [
            { role: 'user', content: prompt }
        ], 3000);

        // Parse JSON with robust error handling
        const questions: MCQQuestion[] = parseJSONSafely(text, 'MCQ questions');

        // Validate and add IDs
        if (!Array.isArray(questions)) {
            throw new Error('Generated questions are not in array format');
        }

        return questions.map((q, index) => ({
            id: `mcq-${Date.now()}-${index}`,
            question: q.question,
            options: q.options || [],
            correctAnswer: q.correctAnswer ?? 0,
            explanation: q.explanation || ''
        })).slice(0, count);

    } catch (error: any) {
        logger.error({ err: error }, "error generating MCQs");
        throw new Error(`Failed to generate MCQs: ${error.message}`);
    }
}

/**
 * Generate coding challenges based on repository analysis
 */
export async function generateCodingChallenges(
    repoAnalysis: RepoAnalysis,
    skill: string,
    count: number = 3
): Promise<CodingChallenge[]> {
    // Get an available model
    const model = await getAvailableModel();

    // Prepare repository context (optimized for speed - less context)
    const fileSummaries = repoAnalysis.files.slice(0, 3).map(file => {
        const preview = file.content.substring(0, 300);
        return `File: ${file.path}\n${preview}...`;
    }).join('\n');

    const readmeContext = repoAnalysis.readme 
        ? `\nREADME: ${repoAnalysis.readme.substring(0, 500)}`
        : '';

    // Determine function signature format based on skill
    const signatureExamples: Record<string, string> = {
        Python: 'def function_name(param1: type, param2: type) -> return_type:',
        JavaScript: 'function functionName(param1, param2) { }',
        TypeScript: 'function functionName(param1: type, param2: type): returnType { }',
        Rust: 'fn function_name(param1: Type, param2: Type) -> ReturnType { }',
        React: 'function ComponentName(props: PropsType): JSX.Element { }'
    };

    const signatureExample = signatureExamples[skill] || signatureExamples.Python;

    const prompt = `Generate exactly ${count} coding challenges for ${skill} based on this repository:

Context:
${fileSummaries}${readmeContext}

Format: ${signatureExample}

Requirements:
- Related to repository patterns
- 3-5 test cases each
- Solvable in 20-50 lines

CRITICAL: Return ONLY valid JSON array, no markdown. Use ["value"] NOT [\\"value\\"]. Start with [ and end with ].

Example format:
[{"title":"Title","description":"Desc","functionSignature":"def f(x):","testCases":[{"input":[1,2],"expectedOutput":3}],"starterCode":"def f(x):\\n    pass"}]

Generate ${count} challenges. JSON only, no other text.`;

    // Retry logic for handling malformed JSON responses
    const maxRetries = 3;
    let lastError: any = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const text = await callOpenRouter(model, [
                { role: 'user', content: prompt }
            ], 3000); // Reduced from 4000 for faster generation

            // Log raw response for debugging (only in dev mode and first attempt)
            if (attempt === 1 && process.env.NODE_ENV === 'development') {
                logger.debug({ preview: text.substring(0, 300) }, "raw coding challenge response preview");
            }

            // Parse JSON with robust error handling
            const challenges: CodingChallenge[] = parseJSONSafely(text, 'coding challenges');

            // Validate and add IDs
            if (!Array.isArray(challenges)) {
                throw new Error('Generated challenges are not in array format');
            }

            // Validate challenge structure
            const validChallenges = challenges.filter(c => 
                c.title && 
                c.description && 
                c.functionSignature && 
                Array.isArray(c.testCases) && 
                c.testCases.length > 0
            );

            if (validChallenges.length === 0) {
                throw new Error('No valid challenges generated');
            }

            return validChallenges.map((c, index) => ({
                id: `challenge-${Date.now()}-${index}`,
                title: c.title || `Challenge ${index + 1}`,
                description: c.description || '',
                functionSignature: c.functionSignature || '',
                testCases: (c.testCases || []).map((tc: any) => ({
                    input: tc.input,
                    expectedOutput: tc.expectedOutput,
                    description: tc.description || ''
                })),
                starterCode: c.starterCode || c.functionSignature + '\n    pass'
            })).slice(0, count);

        } catch (error: any) {
            lastError = error;
            logger.error({ err: error, attempt, maxRetries }, "error generating coding challenges");
            
            if (attempt < maxRetries) {
                // Wait before retry (shorter delays for faster retries)
                await new Promise(resolve => setTimeout(resolve, 300 * attempt));
                logger.warn({ nextAttempt: attempt + 1, maxRetries }, "retrying coding challenge generation");
            }
        }
    }
    
    // All retries failed
    logger.error({ err: lastError }, "failed to generate coding challenges after retries");
    throw new Error(`Failed to generate coding challenges: ${lastError?.message || 'Unknown error'}`);
}
