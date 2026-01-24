import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini API client
function getGeminiClient() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error('GEMINI_API_KEY is not set in environment variables. Please add it to .env.local');
    }
    return new GoogleGenerativeAI(apiKey);
}

// Cache for available model to avoid testing every time
let cachedModel: any = null;
let cachedModelName: string | null = null;

// Get available model by trying common model names
async function getAvailableModel(client: GoogleGenerativeAI): Promise<any> {
    // Return cached model if available
    if (cachedModel && cachedModelName) {
        return cachedModel;
    }
    
    // List of models to try in order of preference (gemini-pro is most common)
    const modelsToTry = [
        'gemini-3-pro-preview',
        'gemini-2.5-flash',
        'gemini-2.5-pro',
    ];
    
    for (const modelName of modelsToTry) {
        try {
            const model = client.getGenerativeModel({ model: modelName });
            // Test with a tiny prompt to see if model works (minimal API usage)
            const testResult = await model.generateContent('Hi');
            await testResult.response;
            console.log(`✅ Found working model: ${modelName}`);
            cachedModel = model;
            cachedModelName = modelName;
            return model;
        } catch (e: any) {
            // Try next model
            console.log(`⚠️ Model ${modelName} not available, trying next...`);
            continue;
        }
    }
    
    // If all fail, throw helpful error
    throw new Error(
        'No available Gemini models found with your API key. ' +
        'Tried: gemini-pro, gemini-1.5-flash, gemini-1.5-pro. ' +
        'Please check: https://ai.google.dev/models/gemini for available models. ' +
        'Your API key might need to be regenerated or you may need to enable the API in Google Cloud Console.'
    );
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
    const client = getGeminiClient();
    // Get an available model by trying common names
    const model = await getAvailableModel(client);

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
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

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
        
        // Provide helpful error message if model not found
        if (error.message?.includes('not found') || error.message?.includes('404')) {
            throw new Error(
                `Model 'gemini-1.5-pro' not available with your API key. ` +
                `The error suggests the model name might be different. ` +
                `Please check: https://ai.google.dev/models/gemini for available models. ` +
                `Common model names: gemini-1.5-pro, gemini-1.5-flash, gemini-pro. ` +
                `Original error: ${error.message}`
            );
        }
        
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
    const client = getGeminiClient();
    // Get an available model by trying common names
    const model = await getAvailableModel(client);

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
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

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
        
        // Provide helpful error message if model not found
        if (error.message?.includes('not found') || error.message?.includes('404')) {
            throw new Error(
                `Model 'gemini-1.5-pro' not available with your API key. ` +
                `The error suggests the model name might be different. ` +
                `Please check: https://ai.google.dev/models/gemini for available models. ` +
                `Common model names: gemini-1.5-pro, gemini-1.5-flash, gemini-pro. ` +
                `Original error: ${error.message}`
            );
        }
        
        throw new Error(`Failed to generate coding challenges: ${error.message}`);
    }
}

