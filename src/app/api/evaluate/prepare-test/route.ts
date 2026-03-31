import { NextResponse } from 'next/server';
import type { RepoAnalysis } from '@/lib/gemini';
import { fetchWithTimeout } from '@/lib/http';
import { detectEvidenceType, parseGitHubRepoUrl, parseUrlSafe } from '@/lib/url';
import { apiError, apiSuccess, parseQuery, toErrorResponse } from '@/lib/api-utils';
import { fetchGitHubSourceCode } from '@/lib/evaluation/github-ingestion';
import { logger } from '@/lib/logger';
import { EvaluateQuerySchema } from '@/lib/schemas';

// Fetch source code files from GitHub
async function fetchSourceCode(owner: string, repo: string, skill: string): Promise<Array<{ path: string; content: string; extension: string }>> {
    return fetchGitHubSourceCode(owner, repo, skill, process.env.GITHUB_TOKEN);
}

export async function GET(request: Request) {
    let evidenceUrl = "";
    let skill = "Python";
    try {
        const query = parseQuery(request, EvaluateQuerySchema);
        evidenceUrl = query.url;
        skill = query.skill;
    } catch (error) {
        return toErrorResponse(error, "Invalid query parameters");
    }

    if (!evidenceUrl || evidenceUrl.trim().length === 0) {
        return apiError("Evidence URL is required", 400, "MISSING_URL");
    }

    if (!parseUrlSafe(evidenceUrl)) {
        return apiError("Invalid URL format provided", 400, "INVALID_URL");
    }

    try {
        const evidenceType = detectEvidenceType(evidenceUrl);
        
        if (evidenceType !== 'github') {
            return apiError("Currently only GitHub repositories are supported for test-based evaluation", 400, "UNSUPPORTED_EVIDENCE");
        }

        // Extract Owner/Repo
        const repoInfo = parseGitHubRepoUrl(evidenceUrl);
        if (!repoInfo) {
            return apiError("Invalid GitHub URL format", 400, "INVALID_GITHUB_URL");
        }
        const { owner, repo } = repoInfo;

        // CRITICAL: Always use GitHub token to avoid rate limits
        const headers: HeadersInit = {
            'Accept': 'application/vnd.github.v3+json',
        };
        
        const githubToken = process.env.GITHUB_TOKEN;
        if (!githubToken) {
            logger.warn("GITHUB_TOKEN not set; API rate limits will be low");
        } else {
            headers['Authorization'] = `token ${githubToken}`;
        }

        // Fetch repository data
        const [repoDataRes, readmeRes, langDataRes] = await Promise.all([
            fetchWithTimeout(`https://api.github.com/repos/${owner}/${repo}`, { headers }, 15000),
            fetchWithTimeout(`https://api.github.com/repos/${owner}/${repo}/readme`, { headers }, 15000).catch(() => null),
            fetchWithTimeout(`https://api.github.com/repos/${owner}/${repo}/languages`, { headers }, 15000).catch(() => null)
        ]);

        if (!repoDataRes.ok) {
            if (repoDataRes.status === 403 || repoDataRes.status === 429) {
                const rateLimitMessage = !githubToken 
                    ? "GitHub API rate limit exceeded. Please add GITHUB_TOKEN to .env.local to increase limits to 5000 requests/hour."
                    : `GitHub API rate limit exceeded (${repoDataRes.status}). Please try again later.`;
                return NextResponse.json({ 
                    error: rateLimitMessage 
                }, { status: 429 });
            } else if (repoDataRes.status === 404) {
                return NextResponse.json({ 
                    error: "Repository not found. Please check the URL and ensure the repository is public." 
                }, { status: 404 });
            } else if (repoDataRes.status === 401) {
                return NextResponse.json({ 
                    error: "GitHub API authentication failed. Please check your GITHUB_TOKEN in .env.local" 
                }, { status: 401 });
            }
            return apiError(`GitHub API Error (${repoDataRes.status})`, repoDataRes.status, "GITHUB_API_ERROR");
        }

        const repoData = await repoDataRes.json();

        // Fetch README
        let readmeContent = '';
        if (readmeRes?.ok) {
            try {
                const readmeData = await readmeRes.json();
                readmeContent = Buffer.from(readmeData.content, 'base64').toString('utf-8');
            } catch (e) {
                logger.warn({ err: e }, "failed to decode README");
            }
        }

        // Fetch languages
        let languages: Record<string, number> = {};
        if (langDataRes?.ok) {
            try {
                languages = await langDataRes.json();
            } catch (e) {
                logger.warn({ err: e }, "failed to parse repository language payload");
            }
        }

        // Fetch source code files
        let sourceFiles: Array<{ path: string; content: string; extension: string }> = [];
        try {
            sourceFiles = await fetchSourceCode(owner, repo, skill);
        } catch (error) {
            logger.error({ err: error }, "failed to fetch source code");
        }

        // Validate that we have some source code
        if (sourceFiles.length === 0) {
            return apiError("Could not fetch source code from repository. Please ensure the repository contains code files and is public.", 400, "NO_SOURCE_FILES");
        }

        // Prepare repo analysis for test generation
        const repoAnalysis: RepoAnalysis = {
            files: sourceFiles,
            readme: readmeContent,
            languages,
            skill,
            owner: repoData.owner?.login || owner,
            repositoryInfo: {
                name: repoData.name,
                fullName: repoData.full_name,
                description: repoData.description,
                stars: repoData.stargazers_count,
                forks: repoData.forks_count
            }
        };

        return apiSuccess({
            readyForTest: true,
            repoAnalysis,
            skill,
            evidenceUrl,
            evidenceType: 'github'
        });

    } catch (error) {
        return toErrorResponse(error, "Failed to prepare test");
    }
}

