import { NextResponse } from 'next/server';
import { validateCodeWithSyntaxCheck, type TestCase } from '@/lib/code-validator';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { userCode, testCases, functionSignature, language } = body;

        if (!userCode) {
            return NextResponse.json({ 
                error: "userCode is required" 
            }, { status: 400 });
        }

        if (!testCases || !Array.isArray(testCases) || testCases.length === 0) {
            return NextResponse.json({ 
                error: "testCases array is required and must not be empty" 
            }, { status: 400 });
        }

        if (!functionSignature) {
            return NextResponse.json({ 
                error: "functionSignature is required" 
            }, { status: 400 });
        }

        // Validate code against test cases
        const result = validateCodeWithSyntaxCheck(
            userCode,
            testCases as TestCase[],
            functionSignature,
            language || 'javascript'
        );

        return NextResponse.json(result);

    } catch (e: any) {
        console.error('Error validating code:', e);
        return NextResponse.json({
            error: e.message || "Failed to validate code",
        }, { status: 500 });
    }
}

