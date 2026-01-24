import { NextResponse } from 'next/server';
import { generateMCQs, type RepoAnalysis } from '@/lib/gemini';

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

        // Generate MCQs using Gemini
        const questions = await generateMCQs(repoAnalysis as RepoAnalysis, skill, 10);

        return NextResponse.json({
            questions,
            count: questions.length
        });

    } catch (e: any) {
        console.error('Error generating MCQs:', e);
        return NextResponse.json({
            error: e.message || "Failed to generate MCQs",
        }, { status: 500 });
    }
}

