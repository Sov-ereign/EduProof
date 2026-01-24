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
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
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
            });
            
            if (response.ok) {
                console.log(`✅ Found working model: ${modelName}`);
                cachedModelName = modelName;
                return modelName;
            }
        } catch (e: any) {
            console.log(`⚠️ Model ${modelName} not available, trying next...`);
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
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model,
            messages,
            max_tokens: maxTokens,
            temperature: 0.7,
        }),
    });
    
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
    
    // Remove markdown code blocks
    if (jsonText.includes('```json')) {
        const match = jsonText.match(/```json\s*([\s\S]*?)\s*```/);
        if (match) jsonText = match[1].trim();
    } else if (jsonText.includes('```')) {
        const match = jsonText.match(/```\s*([\s\S]*?)\s*```/);
        if (match) jsonText = match[1].trim();
    }
    
    // Extract JSON by finding the outermost array or object
    // This handles cases where there's extra text before/after
    const extractJSON = (str: string): string => {
        // Find the first [ or {
        const firstBracket = Math.min(
            str.indexOf('[') !== -1 ? str.indexOf('[') : Infinity,
            str.indexOf('{') !== -1 ? str.indexOf('{') : Infinity
        );
        
        if (firstBracket === Infinity) {
            return str;
        }
        
        const startIndex = firstBracket;
        const startChar = str[startIndex];
        const endChar = startChar === '[' ? ']' : '}';
        
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
            
            if (char === '"' && !escapeNext) {
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
        
        return str.substring(startIndex, lastIndex);
    };
    
    // Extract the JSON structure
    jsonText = extractJSON(jsonText);
    
    // Fix Python-style tuples OUTSIDE of strings
    // We need to be careful not to modify string contents
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
                // Match pattern: ( followed by content, followed by )
                // But only if it's in a value context (after : or , or [)
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
    
    jsonText = fixTuples(jsonText);
    
    // Try parsing
    try {
        return JSON.parse(jsonText);
    } catch (parseError: any) {
        // Log the problematic text for debugging
        const errorPos = parseError.message.match(/position (\d+)/)?.[1];
        console.error(`Failed to parse ${context}:`, parseError.message);
        if (errorPos) {
            const pos = parseInt(errorPos);
            const start = Math.max(0, pos - 100);
            const end = Math.min(jsonText.length, pos + 100);
            console.error('Problematic JSON around error position:', jsonText.substring(start, end));
            console.error('Error at position:', pos, 'Character:', jsonText[pos]);
        } else {
            console.error('Problematic JSON text (first 1000 chars):', jsonText.substring(0, 1000));
        }
        
        // Last resort: try to fix common issues
        // Remove any trailing commas before } or ]
        jsonText = jsonText.replace(/,(\s*[}\]])/g, '$1');
        
        try {
            return JSON.parse(jsonText);
        } catch (finalError: any) {
            throw new Error(`Invalid JSON in ${context}: ${parseError.message}. Raw text preview: ${jsonText.substring(0, 500)}`);
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
        console.error('Error generating MCQs:', error);
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

    // Prepare repository context
    const fileSummaries = repoAnalysis.files.slice(0, 5).map(file => {
        const preview = file.content.substring(0, 500);
        return `File: ${file.path}\nPreview:\n${preview}...`;
    }).join('\n\n');

    const readmeContext = repoAnalysis.readme 
        ? `\n\nREADME:\n${repoAnalysis.readme.substring(0, 1000)}`
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

    const prompt = `You are an expert technical interviewer. Based on the following code repository, generate exactly ${count} algorithm/coding challenges that:

1. Are related to the code patterns, concepts, or algorithms found in the repository
2. Test practical coding ability in ${skill}
3. Have clear, unambiguous function signatures
4. Include 3-5 test cases each with inputs and expected outputs
5. Are progressively more challenging

Repository Context:
Skill: ${skill}
Files Analyzed:
${fileSummaries}
${readmeContext}

Function Signature Format Example: ${signatureExample}

Requirements:
- Each challenge should be solvable in 20-50 lines of code
- Test cases should cover edge cases (empty inputs, single elements, etc.)
- Challenges should relate to patterns or concepts seen in the repository
- Provide starter code template if helpful

Return ONLY a valid JSON array in this exact format (no markdown, no code blocks):
[
  {
    "title": "Challenge Title",
    "description": "Detailed problem description explaining what the function should do",
    "functionSignature": "def solve(input: List[int]) -> int:",
    "testCases": [
      {
        "input": [1, 2, 3],
        "expectedOutput": 6,
        "description": "Basic case"
      },
      {
        "input": [],
        "expectedOutput": 0,
        "description": "Empty input"
      }
    ],
    "starterCode": "def solve(input: List[int]) -> int:\n    # Your code here\n    pass"
  },
  ...
]

Generate exactly ${count} challenges.`;

    try {
        const text = await callOpenRouter(model, [
            { role: 'user', content: prompt }
        ], 4000);

        // Parse JSON with robust error handling
        const challenges: CodingChallenge[] = parseJSONSafely(text, 'coding challenges');

        // Validate and add IDs
        if (!Array.isArray(challenges)) {
            throw new Error('Generated challenges are not in array format');
        }

        return challenges.map((c, index) => ({
            id: `challenge-${Date.now()}-${index}`,
            title: c.title,
            description: c.description,
            functionSignature: c.functionSignature,
            testCases: c.testCases || [],
            starterCode: c.starterCode || c.functionSignature + '\n    pass'
        })).slice(0, count);

    } catch (error: any) {
        console.error('Error generating coding challenges:', error);
        throw new Error(`Failed to generate coding challenges: ${error.message}`);
    }
}
