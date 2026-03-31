import type { RepoAnalysis } from '@/lib/gemini';
import {
    analyzeReact,
    analyzeRust,
    analyzePython,
    analyzeJavaScript,
    analyzeTypeScript,
    FileAnalysis
} from '@/lib/code-analyzer';
import { apiSuccess, parseJsonBody, toErrorResponse } from '@/lib/api-utils';
import { logger } from '@/lib/logger';
import { FinalScoreSchema } from '@/lib/schemas';

export async function POST(request: Request) {
    try {
        const { repoAnalysis, skill, mcqScore, codingScore } = await parseJsonBody(request, FinalScoreSchema);

        // Convert repoAnalysis files to FileAnalysis format
        const fileAnalyses: FileAnalysis[] = repoAnalysis.files.map((file: any) => ({
            path: file.path,
            content: file.content,
            extension: file.extension,
            lines: file.content.split('\n').length
        }));

        // Analyze code quality using code-analyzer
        let codeQualityScore = 50; // Default score if analysis fails
        let codeQualityFeedback: string[] = [];

        try {
            let comprehensiveAnalysis: any = null;

            if (skill === 'React') {
                comprehensiveAnalysis = analyzeReact(fileAnalyses);
                // Average of all React metrics
                const avgScore = (
                    comprehensiveAnalysis.componentDesign.score +
                    comprehensiveAnalysis.stateManagement.score +
                    comprehensiveAnalysis.codeQuality.score +
                    comprehensiveAnalysis.userExperience.score
                ) / 4;
                codeQualityScore = avgScore;
                codeQualityFeedback = [
                    ...comprehensiveAnalysis.componentDesign.feedback.slice(0, 2),
                    ...comprehensiveAnalysis.stateManagement.feedback.slice(0, 2),
                    ...comprehensiveAnalysis.codeQuality.feedback.slice(0, 2),
                    ...comprehensiveAnalysis.userExperience.feedback.slice(0, 2)
                ];
            } else if (skill === 'Rust') {
                comprehensiveAnalysis = analyzeRust(fileAnalyses);
                const avgScore = (
                    comprehensiveAnalysis.memorySafety.score +
                    comprehensiveAnalysis.codeQuality.score +
                    comprehensiveAnalysis.errorHandling.score +
                    comprehensiveAnalysis.documentation.score
                ) / 4;
                codeQualityScore = avgScore;
                codeQualityFeedback = [
                    ...comprehensiveAnalysis.memorySafety.feedback.slice(0, 2),
                    ...comprehensiveAnalysis.codeQuality.feedback.slice(0, 2),
                    ...comprehensiveAnalysis.errorHandling.feedback.slice(0, 2),
                    ...comprehensiveAnalysis.documentation.feedback.slice(0, 2)
                ];
            } else if (skill === 'Python') {
                comprehensiveAnalysis = analyzePython(fileAnalyses);
                const avgScore = (
                    comprehensiveAnalysis.codeReadability.score +
                    comprehensiveAnalysis.logicCorrectness.score +
                    comprehensiveAnalysis.useOfConcepts.score +
                    comprehensiveAnalysis.explanationClarity.score
                ) / 4;
                codeQualityScore = avgScore;
                codeQualityFeedback = [
                    ...comprehensiveAnalysis.codeReadability.feedback.slice(0, 2),
                    ...comprehensiveAnalysis.logicCorrectness.feedback.slice(0, 2),
                    ...comprehensiveAnalysis.useOfConcepts.feedback.slice(0, 2),
                    ...comprehensiveAnalysis.explanationClarity.feedback.slice(0, 2)
                ];
            } else if (skill === 'JavaScript') {
                comprehensiveAnalysis = analyzeJavaScript(fileAnalyses);
                codeQualityScore = comprehensiveAnalysis.codeReadability?.score || 50;
                codeQualityFeedback = comprehensiveAnalysis.codeReadability?.feedback || [];
            } else if (skill === 'TypeScript') {
                comprehensiveAnalysis = analyzeTypeScript(fileAnalyses);
                codeQualityScore = comprehensiveAnalysis.codeReadability?.score || 50;
                codeQualityFeedback = comprehensiveAnalysis.codeReadability?.feedback || [];
            }
        } catch (error) {
            logger.warn({ err: error }, "code quality analysis failed");
            codeQualityFeedback.push('⚠️ Could not perform comprehensive code analysis');
        }

        // Calculate final score with proper weights:
        // MCQ: 40% (tests theoretical knowledge)
        // Coding Challenges: 50% (tests practical coding ability)
        // Code Quality: 10% (bonus for code quality in repository)
        // This ensures perfect MCQ + perfect coding = 90, code quality can add up to 10 more points
        
        const mcqWeight = 0.40;
        const codingWeight = 0.50;
        const codeQualityWeight = 0.10;

        // Normalize code quality score (scale it so it contributes 0-10 points)
        // If code quality is 100, it adds 10 points. If it's 50, it adds 5 points.
        const codeQualityContribution = (codeQualityScore / 100) * (codeQualityWeight * 100);

        const finalScore = Math.round(
            (mcqScore * mcqWeight) +
            (codingScore * codingWeight) +
            codeQualityContribution
        );

        // Ensure score is between 0 and 100
        const clampedScore = Math.min(100, Math.max(0, finalScore));

        return apiSuccess({
            finalScore: clampedScore,
            breakdown: {
                mcq: {
                    score: mcqScore,
                    weight: mcqWeight,
                    contribution: mcqScore * mcqWeight
                },
                coding: {
                    score: codingScore,
                    weight: codingWeight,
                    contribution: codingScore * codingWeight
                },
                codeQuality: {
                    score: codeQualityScore,
                    weight: codeQualityWeight,
                    contribution: codeQualityContribution
                }
            },
            codeQualityFeedback: codeQualityFeedback.slice(0, 6) // Limit to 6 feedback items
        });

    } catch (error) {
        return toErrorResponse(error, "Failed to calculate final score");
    }
}

