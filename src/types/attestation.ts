export type EntitlementSource = "stripe" | "onchain" | "both" | "none";

export interface Entitlement {
  allowed: boolean;
  source: EntitlementSource;
  expiresAt: string | null;
}

export interface EvaluationArtifact {
  id: string;
  owner: string;
  repositoryUrl: string;
  repositorySnapshotHash: string;
  rubricVersion: string;
  promptVersion: string;
  modelId: string;
  score: number;
  createdAt: string;
  artifactUri: string;
}

export interface AttestationRecord {
  attestationId: string;
  artifactHash: string;
  txHash: string | null;
  signer: string;
  signature?: string;
  owner: string;
  rubricVersion: string;
  modelId: string;
  createdAt: string;
}
