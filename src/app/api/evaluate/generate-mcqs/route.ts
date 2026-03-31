import { generateMCQs, type RepoAnalysis } from '@/lib/gemini';
import { apiError, apiSuccess, parseJsonBody, toErrorResponse } from '@/lib/api-utils';
import { GenerateQuestionsSchema } from '@/lib/schemas';

export async function POST(request: Request) {
    try {
        const { repoAnalysis, skill } = await parseJsonBody(request, GenerateQuestionsSchema);

        if (repoAnalysis.files.length === 0) {
            return apiError("No source files found in repository analysis", 400, "NO_SOURCE_FILES");
        }

        // Generate MCQs using Gemini
        const questions = await generateMCQs(repoAnalysis as RepoAnalysis, skill, 10);

        return apiSuccess({
            questions,
            count: questions.length
        });

    } catch (error) {
        return toErrorResponse(error, "Failed to generate MCQs");
    }
}

