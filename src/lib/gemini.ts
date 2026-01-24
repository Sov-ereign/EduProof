import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

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

export async function generateMCQs(analysis: RepoAnalysis, skill: string, count: number = 10) {
    const modelsToTry = [
        'gemini-2.0-flash',
        'gemini-1.5-pro',
        'gemini-1.5-flash',
    ];

    let lastError = null;

    for (const modelName of modelsToTry) {
        try {
            const model = genAI.getGenerativeModel({ model: modelName });

            const fileExcerpts = analysis.files.slice(0, 10).map(f => `File: ${f.path}\nContent:\n${f.content.substring(0, 1000)}`).join('\n\n');

            const prompt = `
            You are an expert technical interviewer for ${skill}.
            Based on the following repository context, generate ${count} high-quality multiple-choice questions.
            The questions should test deep understanding of the concepts used in THIS SPECIFIC codebase, not just general ${skill} knowledge.

            REPOSITORY CONTEXT:
            Skill: ${skill}
            README: ${analysis.readme.substring(0, 1000)}
            Top Languages: ${JSON.stringify(analysis.languages)}
            Code Samples:
            ${fileExcerpts}

            FORMAT REQUIREMENTS:
            Return ONLY a JSON array of objects with the following structure:
            [
                {
                    "id": "q1",
                    "question": "The question text...",
                    "options": ["Option A", "Option B", "Option C", "Option D"],
                    "correctAnswer": 0, // index of correct option
                    "explanation": "Brief explanation of why this is correct based on the code or best practices."
                }
            ]
            `;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            // Extract JSON from potential markdown blocks
            const jsonStr = text.includes('```json')
                ? text.split('```json')[1].split('```')[0].trim()
                : text.includes('```')
                    ? text.split('```')[1].split('```')[0].trim()
                    : text.trim();

            return JSON.parse(jsonStr);
        } catch (error) {
            console.error(`Attempt with ${modelName} failed:`, error);
            lastError = error;
            continue;
        }
    }

    throw lastError || new Error("Failed to generate MCQs after multiple attempts");
}

export async function generateCodingChallenges(analysis: RepoAnalysis, skill: string) {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const fileExcerpts = analysis.files.slice(0, 5).map(f => `File: ${f.path}\nContent:\n${f.content.substring(0, 1500)}`).join('\n\n');

    const prompt = `
    Based on the following repository context, create 2 coding challenges for a developer claiming ${skill} expertise.
    These challenges should be similar in style and technology to the existing codebase but ask the user to implement a new utility or feature.

    CONTEXT:
    ${fileExcerpts}

    FORMAT REQUIREMENTS:
    Return ONLY a JSON array:
    [
        {
            "id": "challenge1",
            "title": "A descriptive title",
            "description": "Clear instructions on what to implement",
            "starterCode": "The initial function signature and boilerplate",
            "functionSignature": "functionName(arg1, arg2)", 
            "testCases": [
                { "input": "expected input as string", "output": "expected output as string", "description": "What this tests" }
            ]
        }
    ]
    `;

    try {
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const jsonStr = text.includes('```json')
            ? text.split('```json')[1].split('```')[0].trim()
            : text.includes('```')
                ? text.split('```')[1].split('```')[0].trim()
                : text.trim();
        return JSON.parse(jsonStr);
    } catch (error) {
        console.error("Failed to generate coding challenges:", error);
        // Fallback simple challenges if AI fails
        return [
            {
                id: "fallback-comp",
                title: "Refactor Component Logic",
                description: "Implement a more efficient version of the primary logic found in the repo's main module.",
                starterCode: "// Implement your solution here\nfunction solution() {\n  \n}",
                functionSignature: "solution()",
                testCases: [{ input: "()", output: "true", description: "Base case" }]
            }
        ];
    }
}
