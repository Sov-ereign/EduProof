/**
 * Analyze code readability based on code-to-comment ratio
 */
export function analyzeCodeReadability(files: Array<{ path: string; content: string; extension: string }>): {
    score: number;
    feedback: string[];
    codeLines: number;
    commentLines: number;
    ratio: number;
} {
    let totalCodeLines = 0;
    let totalCommentLines = 0;
    const feedback: string[] = [];

    // Handle empty files array
    if (!files || files.length === 0) {
        feedback.push(`⚠ No code files found to analyze`);
        return {
            score: 0,
            feedback,
            codeLines: 0,
            commentLines: 0,
            ratio: 0
        };
    }

    files.forEach(file => {
        const lines = file.content.split('\n');
        let inBlockComment = false;
        let fileCodeLines = 0;
        let fileCommentLines = 0;

        lines.forEach(line => {
            const trimmed = line.trim();
            
            // Skip empty lines
            if (!trimmed) return;

            // Handle block comments
            if (file.extension === 'py' || file.extension === 'js' || file.extension === 'ts' || file.extension === 'jsx' || file.extension === 'tsx') {
                // Python: # for single line, """ or ''' for block
                // JS/TS: // for single line, /* */ for block
                if (trimmed.startsWith('#') || trimmed.startsWith('//')) {
                    fileCommentLines++;
                } else if (trimmed.includes('/*') || trimmed.includes('*/') || trimmed.startsWith('*')) {
                    if (trimmed.includes('/*')) inBlockComment = true;
                    if (trimmed.includes('*/')) inBlockComment = false;
                    fileCommentLines++;
                } else if (inBlockComment) {
                    fileCommentLines++;
                } else if (trimmed.startsWith('"""') || trimmed.startsWith("'''")) {
                    fileCommentLines++;
                } else {
                    fileCodeLines++;
                }
            } else if (file.extension === 'rs') {
                // Rust: // for single line, /* */ for block
                if (trimmed.startsWith('//') || trimmed.startsWith('///') || trimmed.startsWith('//!')) {
                    fileCommentLines++;
                } else if (trimmed.includes('/*') || trimmed.includes('*/') || trimmed.startsWith('*')) {
                    if (trimmed.includes('/*')) inBlockComment = true;
                    if (trimmed.includes('*/')) inBlockComment = false;
                    fileCommentLines++;
                } else if (inBlockComment) {
                    fileCommentLines++;
                } else {
                    fileCodeLines++;
                }
            } else {
                // Default: count non-empty lines as code
                fileCodeLines++;
            }
        });

        totalCodeLines += fileCodeLines;
        totalCommentLines += fileCommentLines;
    });

    // Calculate ratio (comments per 100 lines of code)
    const ratio = totalCodeLines > 0 ? (totalCommentLines / totalCodeLines) * 100 : 0;

    // Score based on comment ratio
    // Ideal: 20-30% comment ratio (10 points)
    // Good: 10-20% or 30-40% (7-8 points)
    // Fair: 5-10% or 40-50% (5-6 points)
    // Poor: <5% or >50% (0-4 points)
    let score = 0;
    if (ratio >= 20 && ratio <= 30) {
        score = 10; // Excellent
        feedback.push(`✓ Excellent code documentation (${ratio.toFixed(1)}% comment ratio)`);
    } else if (ratio >= 10 && ratio < 20) {
        score = 8; // Good
        feedback.push(`✓ Good code documentation (${ratio.toFixed(1)}% comment ratio)`);
    } else if (ratio >= 30 && ratio <= 40) {
        score = 8; // Good (slightly over-commented but acceptable)
        feedback.push(`✓ Good code documentation (${ratio.toFixed(1)}% comment ratio)`);
    } else if (ratio >= 5 && ratio < 10) {
        score = 6; // Fair
        feedback.push(`⚠ Moderate code documentation (${ratio.toFixed(1)}% comment ratio - consider adding more comments)`);
    } else if (ratio >= 40 && ratio <= 50) {
        score = 6; // Fair (over-commented)
        feedback.push(`⚠ Moderate code documentation (${ratio.toFixed(1)}% comment ratio - may be over-commented)`);
    } else if (ratio < 5) {
        score = 3; // Poor
        feedback.push(`❌ Poor code documentation (${ratio.toFixed(1)}% comment ratio - code needs more comments)`);
    } else {
        score = 4; // Poor (over-commented)
        feedback.push(`⚠ Over-commented code (${ratio.toFixed(1)}% comment ratio - focus on code clarity)`);
    }

    feedback.push(`Total: ${totalCodeLines} lines of code, ${totalCommentLines} lines of comments`);

    return {
        score,
        feedback,
        codeLines: totalCodeLines,
        commentLines: totalCommentLines,
        ratio
    };
}

/**
 * Analyze README and repository quality
 */
export function analyzeRepoQuality(
    readme: string | undefined,
    repositoryInfo: any
): {
    score: number;
    feedback: string[];
} {
    const feedback: string[] = [];
    let score = 0;

    // README Structure (5 points)
    if (readme) {
        const readmeLower = readme.toLowerCase();
        let readmeScore = 0;

        // Check for essential sections
        if (readmeLower.includes('description') || readmeLower.includes('about')) readmeScore += 0.5;
        if (readmeLower.includes('installation') || readmeLower.includes('setup') || readmeLower.includes('getting started')) readmeScore += 1;
        if (readmeLower.includes('usage') || readmeLower.includes('example') || readmeLower.includes('how to')) readmeScore += 1;
        if (readmeLower.includes('contributing') || readmeLower.includes('license')) readmeScore += 0.5;
        if (readme.length > 500) readmeScore += 1; // Substantial README
        if (readme.length > 1000) readmeScore += 1; // Very detailed README

        score += Math.min(5, readmeScore);
        feedback.push(`README Quality: ${Math.min(5, readmeScore).toFixed(1)}/5 points`);
        
        if (readmeScore >= 4) {
            feedback.push(`✓ Well-structured README with essential sections`);
        } else if (readmeScore >= 2) {
            feedback.push(`⚠ README could be improved with more sections`);
        } else {
            feedback.push(`❌ README needs significant improvement`);
        }
    } else {
        feedback.push(`❌ No README.md found (0/5 points)`);
    }

    // Repository Metrics (5 points)
    if (repositoryInfo) {
        let metricsScore = 0;
        
        // Stars (2 points max)
        const stars = repositoryInfo.stars || 0;
        if (stars >= 100) {
            metricsScore += 2;
            feedback.push(`✓ Excellent repository popularity (${stars} stars)`);
        } else if (stars >= 50) {
            metricsScore += 1.5;
            feedback.push(`✓ Good repository popularity (${stars} stars)`);
        } else if (stars >= 10) {
            metricsScore += 1;
            feedback.push(`⚠ Moderate repository popularity (${stars} stars)`);
        } else if (stars > 0) {
            metricsScore += 0.5;
            feedback.push(`⚠ Low repository popularity (${stars} stars)`);
        } else {
            feedback.push(`⚠ No stars yet`);
        }

        // Forks (1.5 points max)
        const forks = repositoryInfo.forks || 0;
        if (forks >= 20) {
            metricsScore += 1.5;
            feedback.push(`✓ Active repository (${forks} forks)`);
        } else if (forks >= 5) {
            metricsScore += 1;
            feedback.push(`✓ Some community engagement (${forks} forks)`);
        } else if (forks > 0) {
            metricsScore += 0.5;
            feedback.push(`⚠ Limited community engagement (${forks} forks)`);
        }

        // Description quality (1.5 points max)
        const description = repositoryInfo.description || '';
        if (description.length > 50) {
            metricsScore += 1.5;
            feedback.push(`✓ Repository has a clear description`);
        } else if (description.length > 0) {
            metricsScore += 0.5;
            feedback.push(`⚠ Repository description could be more detailed`);
        } else {
            feedback.push(`⚠ No repository description`);
        }

        score += Math.min(5, metricsScore);
        feedback.push(`Repository Metrics: ${Math.min(5, metricsScore).toFixed(1)}/5 points`);
    } else {
        feedback.push(`⚠ Repository metrics not available`);
    }

    return {
        score: Math.min(10, Math.round(score * 10) / 10), // Round to 1 decimal, max 10
        feedback
    };
}

