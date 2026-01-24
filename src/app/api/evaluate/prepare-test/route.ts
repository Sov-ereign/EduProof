import { NextResponse } from 'next/server';
import type { RepoAnalysis } from '@/lib/gemini';

// Detect evidence type from URL
function detectEvidenceType(url: string): 'github' | 'google-docs' | 'loom' | 'portfolio' | 'other' {
    if (url.includes('github.com')) return 'github';
    if (url.includes('docs.google.com') || url.includes('drive.google.com')) return 'google-docs';
    if (url.includes('loom.com')) return 'loom';
    if (url.includes('portfolio') || url.includes('behance') || url.includes('dribbble')) return 'portfolio';
    return 'other';
}

// Fetch source code files from GitHub
async function fetchSourceCode(owner: string, repo: string, skill: string): Promise<Array<{ path: string; content: string; extension: string }>> {
    // CRITICAL: Always use GitHub token to avoid rate limits
    const headers: HeadersInit = {
        'Accept': 'application/vnd.github.v3+json',
    };
    
    const githubToken = process.env.GITHUB_TOKEN;
    if (githubToken) {
        headers['Authorization'] = `token ${githubToken}`;
    } else {
        console.warn('WARNING: GITHUB_TOKEN not set in fetchSourceCode. Rate limits will be very low.');
    }

    const filesToTry: Record<string, string[]> = {
        Rust: ['src/lib.rs', 'src/main.rs', 'src/bin', 'examples', 'tests'],
        Python: ['*.py', 'main.py', 'app.py', 'src', '*.pyx'],
        React: ['src/App.tsx', 'src/App.jsx', 'src/index.tsx', 'src/index.jsx', 'src/components', 'src/pages'],
        JavaScript: ['src/index.js', 'src/app.js', 'src', '*.js'],
        TypeScript: ['src/index.ts', 'src/app.ts', 'src', '*.ts', '*.tsx']
    };

    const candidates = filesToTry[skill] || ['src', 'lib', '*.js', '*.py'];
    const fetchedFiles: Array<{ path: string; content: string; extension: string }> = [];

    // Helper function to fetch files from a directory
    const fetchFilesFromDir = async (dirPath: string, extensions: string[], maxFiles: number): Promise<void> => {
        if (fetchedFiles.length >= maxFiles) return;
        
        try {
            const dirRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${dirPath}`, { headers });
            if (dirRes.ok) {
                const dirData = await dirRes.json();
                if (Array.isArray(dirData)) {
                    for (const item of dirData) {
                        if (fetchedFiles.length >= maxFiles) break;
                        
                        if (item.type === 'file' && extensions.some(ext => item.name.endsWith(ext))) {
                            try {
                                const fetchUrl = item.url;
                                const fileRes = await fetch(fetchUrl, { headers });
                                if (fileRes.ok) {
                                    const fileData = await fileRes.json();
                                    let content = '';
                                    if (fileData.content) {
                                        content = Buffer.from(fileData.content, 'base64').toString('utf-8');
                                    } else if (item.download_url) {
                                        const dlRes = await fetch(item.download_url, { headers });
                                        content = await dlRes.text();
                                    }
                                    if (content) {
                                        fetchedFiles.push({
                                            path: item.path,
                                            content,
                                            extension: item.name.substring(item.name.lastIndexOf('.'))
                                        });
                                    }
                                }
                            } catch (e) { continue; }
                        } else if (item.type === 'dir' && fetchedFiles.length < maxFiles - 5) {
                            await fetchFilesFromDir(item.path, extensions, maxFiles);
                        }
                    }
                }
            }
        } catch (e) {
            // Silently fail for subdirectories
        }
    };

    try {
        const skillExtensions: Record<string, string[]> = {
            Rust: ['.rs'],
            Python: ['.py', '.pyw'],
            React: ['.jsx', '.tsx', '.js', '.ts'],
            JavaScript: ['.js', '.mjs'],
            TypeScript: ['.ts', '.tsx']
        };
        const extensions = skillExtensions[skill] || [];

        const dirsToCheck: string[] = ['', 'src', 'src/components', 'src/pages', 'src/app', 'lib', 'components'];
        
        for (const dir of dirsToCheck) {
            if (fetchedFiles.length >= 15) break;
            await fetchFilesFromDir(dir, extensions, 15);
        }
    } catch (e) {
        // Fallback to specific file paths
    }

    // Fallback: try specific file paths
    if (fetchedFiles.length === 0) {
        const specificFiles: Record<string, string[]> = {
            Rust: ['src/lib.rs', 'src/main.rs'],
            Python: ['main.py', 'app.py', '__init__.py'],
            React: ['src/App.tsx', 'src/App.jsx', 'src/index.tsx'],
            JavaScript: ['src/index.js', 'app.js'],
            TypeScript: ['src/index.ts', 'app.ts']
        };

        for (const file of (specificFiles[skill] || [])) {
            try {
                const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${file}`, { headers });
                if (res.ok) {
                    const data = await res.json();
                    if (data.content && data.type === 'file') {
                        const content = Buffer.from(data.content, 'base64').toString('utf-8');
                        fetchedFiles.push({
                            path: file,
                            content,
                            extension: file.substring(file.lastIndexOf('.'))
                        });
                        if (fetchedFiles.length >= 10) break;
                    }
                }
            } catch (e) { continue; }
        }
    }

    return fetchedFiles;
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const evidenceUrl = searchParams.get('url');
    const skill = searchParams.get('skill') || 'Python';

    if (!evidenceUrl || evidenceUrl.trim().length === 0) {
        return NextResponse.json({ error: "Evidence URL is required" }, { status: 400 });
    }

    try {
        new URL(evidenceUrl);
    } catch {
        return NextResponse.json({ error: "Invalid URL format provided" }, { status: 400 });
    }

    try {
        const evidenceType = detectEvidenceType(evidenceUrl);
        
        if (evidenceType !== 'github') {
            return NextResponse.json({ 
                error: "Currently only GitHub repositories are supported for test-based evaluation" 
            }, { status: 400 });
        }

        // Extract Owner/Repo
        const parts = evidenceUrl.split("github.com/")[1]?.split("/");
        if (!parts || parts.length < 2) {
            return NextResponse.json({ error: "Invalid GitHub URL format" }, { status: 400 });
        }
        const owner = parts[0];
        const repo = parts[1].replace(/\/$/, '').split('?')[0].split('#')[0];

        // CRITICAL: Always use GitHub token to avoid rate limits
        const headers: HeadersInit = {
            'Accept': 'application/vnd.github.v3+json',
        };
        
        const githubToken = process.env.GITHUB_TOKEN;
        if (!githubToken) {
            console.warn('WARNING: GITHUB_TOKEN not set. API rate limits will be very low (60 requests/hour).');
        } else {
            headers['Authorization'] = `token ${githubToken}`;
        }

        // Fetch repository data
        const [repoDataRes, readmeRes, langDataRes] = await Promise.all([
            fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers }),
            fetch(`https://api.github.com/repos/${owner}/${repo}/readme`, { headers }).catch(() => null),
            fetch(`https://api.github.com/repos/${owner}/${repo}/languages`, { headers }).catch(() => null)
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
            return NextResponse.json({ 
                error: `GitHub API Error (${repoDataRes.status})` 
            }, { status: repoDataRes.status });
        }

        const repoData = await repoDataRes.json();

        // Fetch README
        let readmeContent = '';
        if (readmeRes?.ok) {
            try {
                const readmeData = await readmeRes.json();
                readmeContent = Buffer.from(readmeData.content, 'base64').toString('utf-8');
            } catch (e) {
                console.warn('Failed to decode README:', e);
            }
        }

        // Fetch languages
        let languages: Record<string, number> = {};
        if (langDataRes?.ok) {
            try {
                languages = await langDataRes.json();
            } catch (e) {
                console.warn('Failed to fetch languages:', e);
            }
        }

        // Fetch source code files
        let sourceFiles: Array<{ path: string; content: string; extension: string }> = [];
        try {
            sourceFiles = await fetchSourceCode(owner, repo, skill);
        } catch (error) {
            console.error('Error fetching source code:', error);
        }

        // Validate that we have some source code
        if (sourceFiles.length === 0) {
            return NextResponse.json({ 
                error: "Could not fetch source code from repository. Please ensure the repository contains code files and is public." 
            }, { status: 400 });
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

        return NextResponse.json({
            readyForTest: true,
            repoAnalysis,
            skill,
            evidenceUrl,
            evidenceType: 'github'
        });

    } catch (e: any) {
        console.error('Prepare test error:', e);
        return NextResponse.json({
            error: e.message || "Failed to prepare test",
        }, { status: 500 });
    }
}

