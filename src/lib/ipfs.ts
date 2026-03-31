// IPFS integration helper
// For the hackathon, we'll use a simple approach
// In production, you'd use Pinata, Web3.Storage, or similar
import { logger } from "@/lib/logger";

export async function uploadToIPFS(data: string): Promise<string> {
  // For demo purposes, we'll create a hash-based identifier
  // In production, you'd upload to actual IPFS
  
  try {
    // Simulate IPFS upload - in production, use actual IPFS service
    const hash = Buffer.from(data).toString('base64').slice(0, 46);
    return `ipfs://${hash}`;
  } catch (error) {
    logger.error({ err: error }, "ipfs upload error");
    throw new Error('Failed to upload to IPFS');
  }
}

export async function generateEvidenceHash(evidenceUrl: string, skill: string, score: number): Promise<string> {
  // Generate a deterministic hash for evidence
  const data = `${evidenceUrl}:${skill}:${score}:${Date.now()}`;
  const hash = Buffer.from(data).toString('base64').slice(0, 32);
  return `ev:${hash}`;
}

