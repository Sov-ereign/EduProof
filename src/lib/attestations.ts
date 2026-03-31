import crypto from "crypto";

import { Keypair } from "@stellar/stellar-sdk";
import { ObjectId } from "mongodb";

import { uploadToIPFS } from "@/lib/ipfs";
import { logger } from "@/lib/logger";
import clientPromise from "@/lib/mongodb";
import type { AttestationRecord, EvaluationArtifact } from "@/types/attestation";

export interface ArtifactInput {
  owner: string;
  repositoryUrl: string;
  repositorySnapshotHash: string;
  rubricVersion: string;
  promptVersion: string;
  modelId: string;
  score: number;
}

interface AttestationVerifyExpectations {
  artifactHash?: string;
  signer?: string;
  rubricVersion?: string;
  modelId?: string;
}

let indexesReady = false;

function normalizeArtifact(input: ArtifactInput): ArtifactInput {
  return {
    owner: input.owner.trim(),
    repositoryUrl: input.repositoryUrl.trim(),
    repositorySnapshotHash: input.repositorySnapshotHash.trim(),
    rubricVersion: input.rubricVersion.trim(),
    promptVersion: input.promptVersion.trim(),
    modelId: input.modelId.trim(),
    score: input.score,
  };
}

export function computeArtifactHash(input: ArtifactInput): string {
  const normalized = normalizeArtifact(input);
  const canonical = JSON.stringify(normalized);
  return crypto.createHash("sha256").update(canonical, "utf8").digest("hex");
}

function getEvaluatorKeypair(): Keypair {
  const secret = process.env.EVALUATOR_SECRET_KEY;
  if (!secret) {
    throw new Error("EVALUATOR_SECRET_KEY is not configured");
  }
  return Keypair.fromSecret(secret);
}

async function ensureIndexes() {
  if (indexesReady) return;

  const client = await clientPromise;
  const db = client.db();

  const artifacts = db.collection("evaluationArtifacts");
  const attestations = db.collection("attestations");
  const evaluators = db.collection("evaluators");

  await artifacts.createIndex({ artifactHash: 1 }, { unique: true, name: "uniq_artifact_hash" });
  await attestations.createIndex({ attestationId: 1 }, { unique: true, name: "uniq_attestation_id" });
  await attestations.createIndex({ owner: 1, createdAt: -1 }, { name: "idx_attestation_owner_createdAt" });
  await evaluators.createIndex({ signer: 1 }, { unique: true, name: "uniq_evaluator_signer" });

  indexesReady = true;
}

async function ensureEvaluatorActive(signer: string) {
  const client = await clientPromise;
  const db = client.db();
  const evaluators = db.collection("evaluators");

  await evaluators.updateOne(
    { signer },
    {
      $setOnInsert: {
        signer,
        createdAt: new Date().toISOString(),
      },
      $set: {
        active: true,
        revokedAt: null,
        updatedAt: new Date().toISOString(),
      },
    },
    { upsert: true },
  );
}

export async function registerEvaluatorSigner(signer: string, actor = "system") {
  await ensureIndexes();

  const client = await clientPromise;
  const db = client.db();
  const evaluators = db.collection("evaluators");
  await evaluators.updateOne(
    { signer },
    {
      $setOnInsert: {
        signer,
        createdAt: new Date().toISOString(),
      },
      $set: {
        active: true,
        revokedAt: null,
        updatedAt: new Date().toISOString(),
        updatedBy: actor,
      },
    },
    { upsert: true },
  );
}

export async function revokeEvaluatorSigner(signer: string, actor = "system") {
  await ensureIndexes();

  const client = await clientPromise;
  const db = client.db();
  const evaluators = db.collection("evaluators");
  await evaluators.updateOne(
    { signer },
    {
      $set: {
        active: false,
        revokedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        updatedBy: actor,
      },
    },
    { upsert: true },
  );
}

export async function isEvaluatorActive(signer: string): Promise<boolean> {
  await ensureIndexes();

  const client = await clientPromise;
  const db = client.db();
  const evaluators = db.collection("evaluators");
  const record = await evaluators.findOne<{ active?: boolean }>({ signer });
  return Boolean(record?.active);
}

export function signArtifactHash(artifactHash: string): { signer: string; signature: string } {
  const keypair = getEvaluatorKeypair();
  const signature = keypair.sign(Buffer.from(artifactHash, "hex"));
  return {
    signer: keypair.publicKey(),
    signature: Buffer.from(signature).toString("base64"),
  };
}

export function verifyArtifactSignature(artifactHash: string, signer: string, signature: string): boolean {
  try {
    const keypair = Keypair.fromPublicKey(signer);
    return keypair.verify(Buffer.from(artifactHash, "hex"), Buffer.from(signature, "base64"));
  } catch {
    return false;
  }
}

export async function createAndStoreAttestation(
  input: ArtifactInput,
  txHash: string | null,
): Promise<{ attestation: AttestationRecord; artifact: EvaluationArtifact }> {
  await ensureIndexes();

  const normalized = normalizeArtifact(input);
  const artifactHash = computeArtifactHash(normalized);
  const signed = signArtifactHash(artifactHash);
  await ensureEvaluatorActive(signed.signer);

  const now = new Date();
  const createdAtIso = now.toISOString();
  const attestationId = new ObjectId().toHexString();

  const artifactPayload = {
    ...normalized,
    artifactHash,
    createdAt: createdAtIso,
  };
  const artifactUri = await uploadToIPFS(JSON.stringify(artifactPayload));

  const artifact: EvaluationArtifact & { artifactHash: string } = {
    id: attestationId,
    owner: normalized.owner,
    repositoryUrl: normalized.repositoryUrl,
    repositorySnapshotHash: normalized.repositorySnapshotHash,
    rubricVersion: normalized.rubricVersion,
    promptVersion: normalized.promptVersion,
    modelId: normalized.modelId,
    score: normalized.score,
    createdAt: createdAtIso,
    artifactUri,
    artifactHash,
  };

  const attestation: AttestationRecord = {
    attestationId,
    artifactHash,
    txHash,
    signer: signed.signer,
    signature: signed.signature,
    owner: normalized.owner,
    rubricVersion: normalized.rubricVersion,
    modelId: normalized.modelId,
    createdAt: createdAtIso,
  };

  const client = await clientPromise;
  const db = client.db();
  const artifacts = db.collection("evaluationArtifacts");
  const attestations = db.collection("attestations");

  await artifacts.updateOne(
    { artifactHash },
    {
      $setOnInsert: artifact,
      $set: { updatedAt: now.toISOString() },
    },
    { upsert: true },
  );

  await attestations.insertOne(attestation);
  logger.info({ attestationId, owner: normalized.owner, artifactHash }, "attestation created");

  return {
    attestation,
    artifact,
  };
}

export async function setAttestationTxHash(attestationId: string, txHash: string | null) {
  if (!txHash) {
    return;
  }

  const client = await clientPromise;
  const db = client.db();
  await db.collection("attestations").updateOne(
    { attestationId },
    {
      $set: {
        txHash,
        updatedAt: new Date().toISOString(),
      },
    },
  );
}

export async function getAttestationById(attestationId: string) {
  await ensureIndexes();

  const client = await clientPromise;
  const db = client.db();
  const attestations = db.collection("attestations");
  const artifacts = db.collection("evaluationArtifacts");

  const attestation = await attestations.findOne<AttestationRecord>({ attestationId });
  if (!attestation) {
    return null;
  }

  const artifact = await artifacts.findOne<{ artifactHash: string }>({ artifactHash: attestation.artifactHash });
  return { attestation, artifact };
}

export async function verifyStoredAttestation(
  attestationId: string,
  expected: AttestationVerifyExpectations = {},
) {
  const stored = await getAttestationById(attestationId);
  if (!stored || !stored.attestation || !stored.artifact) {
    return null;
  }

  const attestation = stored.attestation;
  const artifact = stored.artifact as EvaluationArtifact & { artifactHash: string };
  const signature = attestation.signature || "";

  const recalculatedHash = computeArtifactHash({
    owner: artifact.owner,
    repositoryUrl: artifact.repositoryUrl,
    repositorySnapshotHash: artifact.repositorySnapshotHash,
    rubricVersion: artifact.rubricVersion,
    promptVersion: artifact.promptVersion,
    modelId: artifact.modelId,
    score: artifact.score,
  });

  const hashConsistent = recalculatedHash === attestation.artifactHash;
  const signatureValid = verifyArtifactSignature(attestation.artifactHash, attestation.signer, signature);
  const evaluatorActive = await isEvaluatorActive(attestation.signer);

  const expectationMatch =
    (!expected.artifactHash || expected.artifactHash === attestation.artifactHash) &&
    (!expected.signer || expected.signer === attestation.signer) &&
    (!expected.rubricVersion || expected.rubricVersion === attestation.rubricVersion) &&
    (!expected.modelId || expected.modelId === attestation.modelId);

  return {
    valid: hashConsistent && signatureValid && evaluatorActive && expectationMatch,
    signer: attestation.signer,
    rubricVersion: attestation.rubricVersion,
    modelId: attestation.modelId,
    artifactHash: attestation.artifactHash,
    txHash: attestation.txHash || null,
    checks: {
      hashConsistent,
      signatureValid,
      evaluatorActive,
      expectationMatch,
    },
  };
}

