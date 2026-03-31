import { generateCodingChallenges, type RepoAnalysis } from '@/lib/gemini';
import { apiError, apiSuccess, parseJsonBody, toErrorResponse } from '@/lib/api-utils';
import { GenerateQuestionsSchema } from '@/lib/schemas';

export async function POST(request: Request) {
    try {
        const { repoAnalysis, skill } = await parseJsonBody(request, GenerateQuestionsSchema);

        if (repoAnalysis.files.length === 0) {
            return apiError("No source files found in repository analysis", 400, "NO_SOURCE_FILES");
        }

        // Generate 1 coding challenge with multiple test cases (not 3 separate challenges)
        const challenges = await generateCodingChallenges(repoAnalysis as RepoAnalysis, skill, 1);

        return apiSuccess({
            challenges,
            count: challenges.length
        });

    } catch (error) {
        return toErrorResponse(error, "Failed to generate coding challenges");
    }
}

