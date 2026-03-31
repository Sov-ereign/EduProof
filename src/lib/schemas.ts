import { z } from "zod";

export const StripeCheckoutBodySchema = z.object({
  currency: z.string().trim().default("usd"),
  candidateAddress: z.string().trim().optional().default(""),
  skill: z.string().trim().optional().default("Monthly-Subscription"),
});

export const StripeVerifyQuerySchema = z.object({
  session_id: z.string().trim().min(1),
});

export const BillingUpdateBodySchema = z.object({
  sessionId: z.string().trim().min(1),
  txHash: z.string().trim().min(1),
  wallet: z.string().trim().optional(),
});

export const RolesBodySchema = z.object({
  roles: z
    .array(z.enum(["student", "verifier"]))
    .nonempty(),
});

const RepoFileSchema = z.object({
  path: z.string(),
  content: z.string(),
  extension: z.string(),
});

export const RepoAnalysisSchema = z.object({
  files: z.array(RepoFileSchema),
  readme: z.string().optional(),
  languages: z.record(z.string(), z.number()).optional(),
  skill: z.string(),
  owner: z.string().optional(),
  repositoryInfo: z.unknown().optional(),
});

export const GenerateQuestionsSchema = z.object({
  repoAnalysis: RepoAnalysisSchema,
  skill: z.string().min(1),
});

export const ValidateCodeSchema = z.object({
  userCode: z.string().min(1),
  testCases: z.array(
    z.object({
      input: z.array(z.unknown()),
      expectedOutput: z.unknown(),
      description: z.string().optional(),
    }),
  ).nonempty(),
  functionSignature: z.string().min(1),
  language: z.string().optional().default("javascript"),
});

export const FinalScoreSchema = z.object({
  repoAnalysis: RepoAnalysisSchema,
  skill: z.string().min(1),
  mcqScore: z.number().min(0).max(100),
  codingScore: z.number().min(0).max(100),
});

export const EvaluateQuerySchema = z.object({
  url: z.string().trim().min(1),
  skill: z.string().trim().optional().default("Python"),
});

export const AttestationCreateSchema = z.object({
  owner: z.string().trim().min(1),
  repositoryUrl: z.string().url(),
  repositorySnapshotHash: z.string().trim().min(8),
  rubricVersion: z.string().trim().min(1),
  promptVersion: z.string().trim().min(1),
  modelId: z.string().trim().min(1),
  score: z.number().min(0).max(100),
});

export const AttestationVerifySchema = z.object({
  attestationId: z.string().trim().min(1),
  artifactHash: z.string().trim().min(32).optional(),
  signer: z.string().trim().min(1).optional(),
  rubricVersion: z.string().trim().min(1).optional(),
  modelId: z.string().trim().min(1).optional(),
});

export const WalletChallengeSchema = z.object({
  wallet: z.string().trim().min(1),
});

export const WalletVerifySchema = z.object({
  wallet: z.string().trim().min(1),
  nonce: z.string().trim().min(1),
  signature: z.string().trim().min(1),
});

export const EvaluatorSchema = z.object({
  signer: z.string().trim().min(1),
});
