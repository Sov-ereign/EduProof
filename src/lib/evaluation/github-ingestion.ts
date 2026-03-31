import { fetchWithTimeout } from "@/lib/http";

export type SourceFile = { path: string; content: string; extension: string };

export async function fetchGitHubSourceCode(
  owner: string,
  repo: string,
  skill: string,
  githubToken?: string,
): Promise<SourceFile[]> {
  const headers: HeadersInit = {
    Accept: "application/vnd.github.v3+json",
  };

  if (githubToken) {
    headers.Authorization = `token ${githubToken}`;
  }

  const fetchedFiles: SourceFile[] = [];
  const maxFiles = 15;

  const skillExtensions: Record<string, string[]> = {
    Rust: [".rs"],
    Python: [".py", ".pyw"],
    React: [".jsx", ".tsx", ".js", ".ts"],
    JavaScript: [".js", ".mjs"],
    TypeScript: [".ts", ".tsx"],
  };
  const extensions = skillExtensions[skill] || [];

  const fetchFilesFromDir = async (dirPath: string): Promise<void> => {
    if (fetchedFiles.length >= maxFiles) return;

    try {
      const dirRes = await fetchWithTimeout(
        `https://api.github.com/repos/${owner}/${repo}/contents/${dirPath}`,
        { headers },
        15000,
      );

      if (!dirRes.ok) return;

      const dirData = await dirRes.json();
      if (!Array.isArray(dirData)) return;

      for (const item of dirData) {
        if (fetchedFiles.length >= maxFiles) break;

        if (item.type === "file" && extensions.some((ext) => item.name.endsWith(ext))) {
          try {
            const fileRes = await fetchWithTimeout(item.url, { headers }, 15000);
            if (!fileRes.ok) continue;
            const fileData = await fileRes.json();

            let content = "";
            if (fileData.content) {
              content = Buffer.from(fileData.content, "base64").toString("utf-8");
            } else if (item.download_url) {
              const dlRes = await fetchWithTimeout(item.download_url, { headers }, 15000);
              content = await dlRes.text();
            }

            if (content) {
              fetchedFiles.push({
                path: item.path,
                content,
                extension: item.name.substring(item.name.lastIndexOf(".")),
              });
            }
          } catch {
            continue;
          }
        } else if (item.type === "dir" && fetchedFiles.length < maxFiles - 5) {
          await fetchFilesFromDir(item.path);
        }
      }
    } catch {
      // ignore
    }
  };

  const dirsToCheck = ["", "src", "src/components", "src/pages", "src/app", "lib", "components"];
  for (const dir of dirsToCheck) {
    if (fetchedFiles.length >= maxFiles) break;
    await fetchFilesFromDir(dir);
  }

  if (fetchedFiles.length > 0) return fetchedFiles;

  const specificFiles: Record<string, string[]> = {
    Rust: ["src/lib.rs", "src/main.rs"],
    Python: ["main.py", "app.py", "__init__.py"],
    React: ["src/App.tsx", "src/App.jsx", "src/index.tsx"],
    JavaScript: ["src/index.js", "app.js"],
    TypeScript: ["src/index.ts", "app.ts"],
  };

  for (const file of specificFiles[skill] || []) {
    try {
      const res = await fetchWithTimeout(
        `https://api.github.com/repos/${owner}/${repo}/contents/${file}`,
        { headers },
        15000,
      );
      if (!res.ok) continue;
      const data = await res.json();
      if (data.content && data.type === "file") {
        const content = Buffer.from(data.content, "base64").toString("utf-8");
        fetchedFiles.push({
          path: file,
          content,
          extension: file.substring(file.lastIndexOf(".")),
        });
        if (fetchedFiles.length >= 10) break;
      }
    } catch {
      continue;
    }
  }

  return fetchedFiles;
}
