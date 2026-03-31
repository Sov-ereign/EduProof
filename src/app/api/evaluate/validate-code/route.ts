import { validateCodeWithSyntaxCheck, type TestCase } from '@/lib/code-validator';
import { apiSuccess, parseJsonBody, toErrorResponse } from '@/lib/api-utils';
import { ValidateCodeSchema } from '@/lib/schemas';

export async function POST(request: Request) {
    try {
        const { userCode, testCases, functionSignature, language } = await parseJsonBody(request, ValidateCodeSchema);

        // Validate code against test cases
        const result = validateCodeWithSyntaxCheck(
            userCode,
            testCases as TestCase[],
            functionSignature,
            language || 'javascript'
        );

        return apiSuccess(result);

    } catch (error) {
        return toErrorResponse(error, "Failed to validate code");
    }
}

