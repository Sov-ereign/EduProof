import { NextResponse } from 'next/server';
import { generateCodingChallenges, type RepoAnalysis } from '@/lib/gemini';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { repoAnalysis, skill } = body;

        if (!repoAnalysis) {
            return NextResponse.json({ 
                error: "repoAnalysis is required" 
            }, { status: 400 });
        }

        if (!skill) {
            return NextResponse.json({ 
                error: "skill is required" 
            }, { status: 400 });
        }

        // Validate repoAnalysis structure
        if (!repoAnalysis.files || !Array.isArray(repoAnalysis.files)) {
            return NextResponse.json({ 
                error: "Invalid repoAnalysis: files array is required" 
            }, { status: 400 });
        }

        if (repoAnalysis.files.length === 0) {
            return NextResponse.json({ 
                error: "No source files found in repository analysis" 
            }, { status: 400 });
        }

        // Generate coding challenges using Gemini
        const challenges = await generateCodingChallenges(repoAnalysis as RepoAnalysis, skill, 3);

        return NextResponse.json({
            challenges,
            count: challenges.length
        });

    } catch (e: any) {
        console.error('Error generating coding challenges:', e);
        
        // Provide more helpful error messages
        let errorMessage = e.message || "Failed to generate coding challenges";
        
        // Check if it's a JSON parsing error
        if (errorMessage.includes('Invalid JSON') || errorMessage.includes('JSON')) {
            errorMessage = "The AI model returned invalid JSON. Please try again. If this persists, the model may be experiencing issues.";
        }
        
        return NextResponse.json({
            error: errorMessage,
            details: process.env.NODE_ENV === 'development' ? e.stack : undefined
        }, { status: 500 });
    }
}

