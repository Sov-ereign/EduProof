
import {
  isAllowed,
  setAllowed,
  getAddress,
  signTransaction
} from "@stellar/freighter-api";

import {
  rpc,
  xdr,
  TransactionBuilder,
  Networks,
  Contract,
  Address,
  nativeToScVal,
  Transaction,
  Horizon,
  StrKey,
  Memo,
  Operation,
  Asset
} from "@stellar/stellar-sdk";

export const FREIGHTER_ID = "freighter";
export const NETWORK_PASSPHRASE = Networks.TESTNET;
export const RPC_URL = "https://soroban-testnet.stellar.org";
export const HORIZON_URL = "https://horizon-testnet.stellar.org";

// Use the rpc namespace from stellar-sdk
export const server = new rpc.Server(RPC_URL);
export const horizonServer = new Horizon.Server(HORIZON_URL);

// Contract ID - Update this after deploying your contract
// For demo purposes, if contract isn't deployed, we'll use memo-based approach
export const CONTRACT_ID = "CDLZFC3SYJYDZT7KPHTZMVJJG7546OCNJS7VYM23LV7C7I2E3X5O75TE";

// Skill categories mapping
const SKILL_CATEGORIES: Record<string, string> = {
  Python: "Tech",
  Rust: "Tech",
  React: "Tech",
  JavaScript: "Tech",
  TypeScript: "Tech",
  Solidity: "Tech",
  Writing: "Writing",
  Design: "Design",
  Logic: "Logic"
};

export async function connectWallet(): Promise<string | null> {
  try {
    // Check if we're in browser environment
    if (typeof window === 'undefined') {
      throw new Error("Wallet connection is only available in the browser");
    }

    // Check if Freighter is installed
    try {
      await isAllowed();
    } catch (e: any) {
      // If isAllowed fails, Freighter is likely not installed
      const errorMsg = e?.message || String(e);
      if (errorMsg.includes("Freighter") || errorMsg.includes("extension") || errorMsg.includes("not found")) {
        throw new Error("Freighter extension not found. Please install Freighter from https://freighter.app");
      }
      // If it's a different error, continue - might just need permission
    }

    // Request permission if needed
    let allowed = await isAllowed();
    console.log("🔍 isAllowed result:", allowed);

    // If not allowed, OR if we previously thought we were allowed but got no address, force prompt
    if (!allowed) {
      await setAllowed();
      allowed = await isAllowed();
    }

    // Get address - Freighter API returns the address directly or in an object
    let address: string | null = null;

    // Helper to extract address from various response formats
    const parseAddress = (response: any) => {
      if (typeof response === 'string' && response.length > 0) return response;
      if (typeof response === 'object' && response) {
        return response.address || response.publicKey || response.pubkey || null;
      }
      return null;
    };

    let response: any = await getAddress();
    console.log("🔍 First getAddress attempt:", response);
    address = parseAddress(response);

    // If address is still empty/null, it might be that the user "Allowed" the site but didn't "Select" an account in the popup properly,
    // or Freighter is in a weird state. Let's try to force setAllowed again to prompt user.
    if (!address) {
      console.warn("⚠️ Address empty. Forcing setAllowed() again...");
      await setAllowed(); // This triggers the popup again
      // Retry getting address
      response = await getAddress();
      console.log("🔍 Second getAddress attempt:", response);
      address = parseAddress(response);
    }


    // Final check - address must be a valid string
    if (!address || typeof address !== 'string' || address.trim().length === 0) {
      console.error("❌ Address validation failed.");
      console.error("❌ Address value:", address);
      console.error("❌ Address type:", typeof address);

      // Don't assume it's locked - be more helpful
      throw new Error(
        "Could not retrieve wallet address from Freighter.\n\n" +
        "Please check:\n" +
        "1. Freighter extension is open and unlocked\n" +
        "2. You have at least one account in Freighter\n" +
        "3. Network is set to Testnet in Freighter settings\n" +
        "4. Try refreshing the page and connecting again\n\n" +
        "Check the browser console (F12) for more details."
      );
    }

    // Validate it's a Stellar address format
    if (!StrKey.isValidEd25519PublicKey(address)) {
      console.error("❌ Invalid address format:", address);
      throw new Error(`Invalid wallet address format. Got: ${address?.substring(0, 10)}... Please check your Freighter wallet.`);
    }

    console.log("✅ Successfully connected wallet:", address.substring(0, 8) + "..." + address.substring(address.length - 4));
    return address;
  } catch (error: any) {
    console.error("❌ Wallet connection error:", error);
    console.error("❌ Error message:", error?.message);
    console.error("❌ Error type:", error?.constructor?.name);

    // Provide user-friendly error messages
    const errorMessage = error.message || "Failed to connect wallet";

    // Don't re-wrap if it's already a user-friendly message with details
    if (errorMessage.includes("Freighter extension not found") ||
      errorMessage.includes("Please install Freighter") ||
      errorMessage.includes("Could not retrieve") ||
      errorMessage.includes("Unable to get wallet address")) {
      throw error; // Already has helpful message
    }

    // Only say "locked" if error explicitly mentions it
    if (errorMessage.toLowerCase().includes("locked") && !errorMessage.toLowerCase().includes("appears")) {
      throw new Error("Freighter wallet appears to be locked. Please unlock Freighter and try again.");
    }

    // Generic fallback - don't assume anything
    throw new Error(`Wallet connection failed: ${errorMessage}\n\nPlease check:\n1. Freighter is unlocked\n2. You have an account\n3. Network is Testnet\n4. Check browser console (F12) for details`);
  }
}

export async function mintCredential(
  userAddress: string,
  skill: string,
  level: string,
  evidence: string,
  score: number,
  category?: string,
  userName?: string
) {
  try {
    // Validate inputs
    if (!userAddress || !StrKey.isValidEd25519PublicKey(userAddress)) {
      throw new Error("Invalid wallet address");
    }
    if (score < 0 || score > 100) {
      throw new Error("Score must be between 0 and 100");
    }

    // Get account
    let account;
    try {
      account = await server.getAccount(userAddress);
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error("Account not found. Please fund your account with testnet XLM first.");
      }
      throw error;
    }

    const cat = category || SKILL_CATEGORIES[skill] || "Tech";

    // Build the arguments for the 'mint_credential' function
    // fn mint_credential(to: Address, skill: String, level: String, evidence: String, score: u32, category: String)
    const args = [
      new Address(userAddress).toScVal(),
      nativeToScVal(skill, { type: "string" }),
      nativeToScVal(level, { type: "string" }),
      nativeToScVal(evidence, { type: "string" }),
      nativeToScVal(score, { type: "u32" }),
      nativeToScVal(cat, { type: "string" }),
    ];

    // Store data in memo: "EP:Skill:Level:Score:Name"
    // Memo max is 28 bytes, so we need to be careful with length
    const nameEncoded = userName ? userName.slice(0, 10) : "Student";
    const memoText = `EP:${skill.slice(0, 6)}:${level.slice(0, 3)}:${score}:${nameEncoded}`.slice(0, 28);


    let operation;
    try {
      // Try to use the contract
      const contract = new Contract(CONTRACT_ID);
      operation = contract.call("mint_credential", ...args);
    } catch (e) {
      console.warn("⚠️ Contract invalid or not deployed. Using fallback (Memo-only minting).");
      console.warn(`Error: ${e}`);

      // Fallback: Send 0.00001 XLM to self just to carry the Memo
      operation = Operation.payment({
        destination: userAddress,
        asset: Asset.native(),
        amount: "0.00001"
      });
    }

    const tx = new TransactionBuilder(account, { fee: "100" })
      .addOperation(operation)
      .addMemo(Memo.text(memoText))
      .setTimeout(30)
      .setNetworkPassphrase(NETWORK_PASSPHRASE)
      .build();

    const xdrString = tx.toXDR();
    const signedTxResponse = await signTransaction(xdrString, { networkPassphrase: NETWORK_PASSPHRASE });

    if (!signedTxResponse.signedTxXdr) {
      throw new Error("Transaction was declined");
    }

    const txFromXDR = TransactionBuilder.fromXDR(signedTxResponse.signedTxXdr, NETWORK_PASSPHRASE);
    const result = await server.sendTransaction(txFromXDR);

    return {
      success: true,
      hash: result.hash,
      explorerUrl: `https://stellar.expert/explorer/testnet/tx/${result.hash}`
    };
  } catch (error: any) {
    console.error("Mint error:", error);
    throw new Error(error.message || "Failed to mint credential");
  }
}

// Fetch credentials from contract (primary method)
export async function fetchUserCredentialsFromContract(userAddress: string) {
  if (!StrKey.isValidEd25519PublicKey(userAddress)) {
    throw new Error("Invalid Stellar Wallet Address");
  }

  try {
    const contract = new Contract(CONTRACT_ID);
    const skills = await contract.call("get_user_skills", new Address(userAddress).toScVal());

    // Note: This is simplified - in reality, you'd need to parse the Vec<String> response
    // For now, fall back to memo-based approach
    return await fetchUserCredentials(userAddress);
  } catch (error) {
    console.warn("Contract query failed, falling back to memo-based approach:", error);
    return await fetchUserCredentials(userAddress);
  }
}

// Fetch credentials from transaction history (fallback method)
export async function fetchUserCredentials(userAddress: string) {
  if (!StrKey.isValidEd25519PublicKey(userAddress)) {
    throw new Error("Invalid Stellar Wallet Address");
  }

  try {
    const history = await horizonServer.transactions()
      .forAccount(userAddress)
      .limit(100)
      .order("desc")
      .call();

    const credentials: any[] = [];
    const seenSkills = new Set<string>();

    // Parse transactions to find credential mints
    for (const record of history.records) {
      if (record.successful && record.memo_type === "text" && record.memo) {
        if (record.memo.startsWith("EP:")) {
          const parts = record.memo.split(":");
          // New format: EP:Skill:Level:Score:Name
          // Old format: EP:Skill:Level:Score (backward compatible)
          if (parts.length >= 3) {
            const skill = parts[1];
            const skillKey = `${userAddress}:${skill}`;

            // Only add if we haven't seen this skill before (latest credential wins)
            if (!seenSkills.has(skillKey)) {
              seenSkills.add(skillKey);

              const level = parts.length >= 4 ? parts[2] : "Verified";
              const score = parseInt(parts[3]) || 0;
              const userName = parts.length >= 5 ? parts[4] : undefined;

              credentials.push({
                id: record.hash,
                skill: skill,
                level: level,
                score: score,
                userName: userName, // Include userName if available
                evidence: `https://stellar.expert/explorer/testnet/tx/${record.hash}`,
                date: new Date(record.created_at).toLocaleDateString(),
                timestamp: record.created_at,
                txHash: record.hash
              });
            }
          }
        }
      }
    }

    return credentials.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch (e: any) {
    console.warn("Error fetching credentials", e);
    if (e.response && e.response.status === 404) {
      return [];
    }
    throw new Error(e.message || "Failed to fetch credentials");
  }
}

// Get a specific credential
export async function getCredential(userAddress: string, skill: string) {
  try {
    const contract = new Contract(CONTRACT_ID);
    const result = await contract.call("get_credential",
      new Address(userAddress).toScVal(),
      nativeToScVal(skill, { type: "string" })
    );
    return result;
  } catch (error) {
    console.warn("Contract query failed:", error);
    return null;
  }
}
// Record a verification event on-chain
export async function recordVerification(
  verifierAddress: string,
  candidateAddress: string,
  skill: string
) {
  try {
    let account;
    try {
      account = await horizonServer.loadAccount(verifierAddress);
    } catch (e: any) {
      if (e.response?.status === 404 || (e.message && e.message.includes("not found"))) {
        console.log(`Account ${verifierAddress} not found. Funding with Friendbot...`);
        try {
          await fetch(`https://friendbot.stellar.org?addr=${verifierAddress}`);
          for (let i = 0; i < 5; i++) { // Increased retries
            await new Promise(resolve => setTimeout(resolve, 2000));
            try {
              account = await horizonServer.loadAccount(verifierAddress);
              if (account) break;
            } catch (retryErr) {
              console.log(`Retry ${i + 1} finding account...`);
            }
          }
          if (!account) throw new Error("Account still not found after Friendbot funding");
        } catch (fbErr: any) {
          throw new Error("Stellar Testnet Account not found. Please fund it manually via Stellar Laboratory.");
        }
      } else {
        throw e;
      }
    }

    // Memo format: "EV:Candidate_Skill"
    // Truncate to fit in 28 chars
    const memoText = `EV:${candidateAddress.slice(0, 8)}:${skill.slice(0, 10)}`.slice(0, 28);

    const operation = Operation.payment({
      destination: verifierAddress, // Send to self just for memo
      asset: Asset.native(),
      amount: "0.00001"
    });

    const tx = new TransactionBuilder(account, { fee: "100" })
      .addOperation(operation)
      .addMemo(Memo.text(memoText))
      .setTimeout(30)
      .setNetworkPassphrase(NETWORK_PASSPHRASE)
      .build();

    const xdrString = tx.toXDR();
    const signedTxResponse = await signTransaction(xdrString, { networkPassphrase: NETWORK_PASSPHRASE });

    if (!signedTxResponse.signedTxXdr) {
      throw new Error("Transaction was declined");
    }

    const txFromXDR = TransactionBuilder.fromXDR(signedTxResponse.signedTxXdr, NETWORK_PASSPHRASE);
    const result = await server.sendTransaction(txFromXDR);

    return {
      success: true,
      hash: result.hash
    };
  } catch (error: any) {
    console.error("Verification record error:", error);
    throw new Error(error.message || "Failed to record verification on-chain");
  }
}

// Record a subscription payment on-chain
export async function recordSubscription(
  verifierAddress: string,
  amount: number,
  currency: string = "USD"
) {
  try {
    let account;
    try {
      account = await horizonServer.loadAccount(verifierAddress);
    } catch (e: any) {
      if (e.response?.status === 404 || (e.message && e.message.includes("not found"))) {
        console.log(`Account ${verifierAddress} not found. Funding with Friendbot...`);
        try {
          const fbResponse = await fetch(`https://friendbot.stellar.org?addr=${verifierAddress}`);
          if (!fbResponse.ok) console.error("Friendbot failed:", await fbResponse.text());

          // Wait and retry getting account up to 5 times
          for (let i = 0; i < 5; i++) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            try {
              account = await horizonServer.loadAccount(verifierAddress);
              if (account) break;
            } catch (retryErr) {
              console.log(`Retry ${i + 1} finding account...`);
            }
          }
          if (!account) throw new Error("Account still not found after Friendbot funding");
        } catch (fbErr: any) {
          throw new Error("Stellar Testnet Account not found. Please fund it: https://laboratory.stellar.org/#account-creator");
        }
      } else {
        throw e;
      }
    }

    // Memo format: "SUB:MONTHLY:30"
    const memoText = `SUB:MONTHLY:${amount}`.slice(0, 28);

    const operation = Operation.payment({
      destination: verifierAddress, // Send to self just for memo
      asset: Asset.native(),
      amount: "0.0001" // slightly higher for visibility
    });

    const tx = new TransactionBuilder(account, { fee: "100" })
      .addOperation(operation)
      .addMemo(Memo.text(memoText))
      .setTimeout(30)
      .setNetworkPassphrase(NETWORK_PASSPHRASE)
      .build();

    const xdrString = tx.toXDR();
    const signedTxResponse = await signTransaction(xdrString, { networkPassphrase: NETWORK_PASSPHRASE });

    if (!signedTxResponse.signedTxXdr) {
      throw new Error("Transaction was declined");
    }

    const txFromXDR = TransactionBuilder.fromXDR(signedTxResponse.signedTxXdr, NETWORK_PASSPHRASE);
    const result = await server.sendTransaction(txFromXDR);

    return {
      success: true,
      hash: result.hash
    };
  } catch (error: any) {
    console.error("Subscription record error:", error);
    throw new Error(error.message || "Failed to record subscription on-chain");
  }
}

// Check if verifier has an active subscription (paid in last 30 days)
export async function checkSubscriptionStatus(verifierAddress: string) {
  try {
    const history = await horizonServer.transactions()
      .forAccount(verifierAddress)
      .limit(50)
      .order("desc")
      .call();

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    for (const record of history.records) {
      if (record.successful && record.memo_type === "text" && record.memo?.startsWith("SUB:MONTHLY:")) {
        const paymentDate = new Date(record.created_at);
        if (paymentDate > thirtyDaysAgo) {
          return { active: true, date: record.created_at, hash: record.hash };
        }
      }
    }
    return { active: false };
  } catch (e) {
    console.warn("Error checking subscription", e);
    return { active: false };
  }
}

// Fetch all subscription records for a verifier
export async function fetchSubscriptionHistory(verifierAddress: string) {
  try {
    console.log(`Fetching billing history for: ${verifierAddress}`);
    const history = await horizonServer.transactions()
      .forAccount(verifierAddress)
      .limit(50)
      .order("desc")
      .call();

    const records = history.records
      .filter(record => record.memo_type === "text" && record.memo?.startsWith("SUB:MONTHLY:"))
      .map(record => ({
        hash: record.hash,
        date: record.created_at,
        amount: record.memo?.split(":")[2] || "30",
        memo: record.memo,
        success: record.successful
      }));

    console.log(`Found ${records.length} billing records`);
    return records;
  } catch (e) {
    console.warn("Error fetching subscription history", e);
    return [];
  }
}
