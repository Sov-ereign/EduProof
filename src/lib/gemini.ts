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
        input: any[];
        expectedOutput: any;
        description?: string;
    }>;
    starterCode?: string;
}

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

    // Prepare repository context for prompt
    const fileSummaries = repoAnalysis.files.slice(0, 5).map(file => {
        const preview = file.content.substring(0, 500); // First 500 chars
        return `File: ${file.path}\nPreview:\n${preview}...`;
    }).join('\n\n');

    const readmeContext = repoAnalysis.readme 
        ? `\n\nREADME:\n${repoAnalysis.readme.substring(0, 1000)}`
        : '';

    const prompt = `You are an expert technical interviewer. Based on the following code repository analysis, generate exactly ${count} multiple-choice questions that test understanding of:

1. Code structure and patterns used in the repository
2. Key concepts and features demonstrated
3. Logic and implementation details
4. Best practices and coding standards shown

Repository Context:
Skill: ${skill}
Files Analyzed:
${fileSummaries}
${readmeContext}

Requirements:
- Each question should have exactly 4 options (A, B, C, D)
- Questions should be based on actual code patterns, concepts, or logic found in the repository
- Make questions progressively more challenging
- Include a mix of conceptual and practical questions
- One option should be clearly correct, others should be plausible but incorrect

Return ONLY a valid JSON array in this exact format (no markdown, no code blocks):
[
  {
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0,
    "explanation": "Brief explanation of why this is correct"
  },
  ...
]

Generate exactly ${count} questions.`;

    try {
        const text = await callOpenRouter(model, [
            { role: 'user', content: prompt }
        ], 3000);

        // Extract JSON from response (handle markdown code blocks if present)
        let jsonText = text.trim();
        if (jsonText.startsWith('```json')) {
            jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        } else if (jsonText.startsWith('```')) {
            jsonText = jsonText.replace(/```\n?/g, '');
        }

        const questions: MCQQuestion[] = JSON.parse(jsonText);

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

        // Extract JSON from response
        let jsonText = text.trim();
        if (jsonText.startsWith('```json')) {
            jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        } else if (jsonText.startsWith('```')) {
            jsonText = jsonText.replace(/```\n?/g, '');
        }

        const challenges: CodingChallenge[] = JSON.parse(jsonText);

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

