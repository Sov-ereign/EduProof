import { Horizon, Keypair } from "@stellar/stellar-sdk";
import { MongoClient } from "mongodb";

const HORIZON_URL = process.env.STELLAR_HORIZON_URL || "https://horizon-testnet.stellar.org";
const MONGODB_URI = process.env.MONGODB_URI;
const ANCHOR_SECRET = process.env.ATTESTATION_ANCHOR_SECRET_KEY;

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is required");
}
if (!ANCHOR_SECRET) {
  throw new Error("ATTESTATION_ANCHOR_SECRET_KEY is required");
}

const anchorPublic = Keypair.fromSecret(ANCHOR_SECRET).publicKey();
const horizon = new Horizon.Server(HORIZON_URL);
const mongo = new MongoClient(MONGODB_URI);

function getLedgerNumber(tx: unknown): number {
  const record = tx as { ledger_attr?: number; ledger?: number };
  if (typeof record.ledger_attr === "number") return record.ledger_attr;
  if (typeof record.ledger === "number") return record.ledger;
  return 0;
}

async function run() {
  await mongo.connect();
  const db = mongo.db();
  const cursorCollection = db.collection("indexerState");
  const eventsCollection = db.collection("attestationEvents");

  await eventsCollection.createIndex({ txHash: 1 }, { unique: true, name: "uniq_event_tx" });
  await eventsCollection.createIndex({ createdAt: -1 }, { name: "idx_event_createdAt" });

  const state = await cursorCollection.findOne<{ lastLedger?: number }>({ key: "attestation-indexer" });
  const startLedger = state?.lastLedger || 0;

  const response = await horizon
    .transactions()
    .forAccount(anchorPublic)
    .order("asc")
    .limit(200)
    .call();

  let maxLedger = startLedger;
  for (const tx of response.records) {
    const ledger = getLedgerNumber(tx);
    if (!tx.successful) continue;
    if (ledger <= startLedger) continue;
    if (tx.memo_type !== "text" || !tx.memo?.startsWith("AT:")) continue;

    await eventsCollection.updateOne(
      { txHash: tx.hash },
      {
        $setOnInsert: {
          txHash: tx.hash,
          memo: tx.memo,
          ledger,
          createdAt: tx.created_at,
        },
        $set: { indexedAt: new Date().toISOString() },
      },
      { upsert: true },
    );

    if (ledger > maxLedger) maxLedger = ledger;
  }

  await cursorCollection.updateOne(
    { key: "attestation-indexer" },
    { $set: { lastLedger: maxLedger, updatedAt: new Date().toISOString() } },
    { upsert: true },
  );

  await mongo.close();
  console.log(`Indexed attestation events through ledger ${maxLedger}`);
}

run().catch(async (error) => {
  console.error("Indexer failure:", error);
  await mongo.close();
  process.exit(1);
});
