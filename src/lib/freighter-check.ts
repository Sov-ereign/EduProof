/**
 * Freighter Wallet Diagnostic Helper
 * Use this to check Freighter status and provide helpful feedback
 */

export interface FreighterStatus {
  installed: boolean;
  unlocked: boolean;
  hasAccount: boolean;
  network: string | null;
  address: string | null;
  error: string | null;
}

export async function checkFreighterStatus(): Promise<FreighterStatus> {
  const status: FreighterStatus = {
    installed: false,
    unlocked: false,
    hasAccount: false,
    network: null,
    address: null,
    error: null
  };

  try {
    // Check if in browser
    if (typeof window === 'undefined') {
      status.error = "Not in browser environment";
      return status;
    }

    // Check if Freighter API is available
    try {
      const { isAllowed, getAddress } = await import("@stellar/freighter-api");
      
      // Check if installed (isAllowed should work if installed)
      try {
        await isAllowed();
        status.installed = true;
      } catch (e) {
        status.error = "Freighter extension not found. Please install from https://freighter.app";
        return status;
      }

      // Try to get address (this will fail if locked or no account)
      try {
        const response = await getAddress();
        let address: string | null = null;
        
        if (typeof response === 'string') {
          address = response;
        } else if (response && typeof response === 'object') {
          address = (response as any).address || null;
        }
        
        if (address && address.length > 0) {
          status.unlocked = true;
          status.hasAccount = true;
          status.address = address;
        } else {
          status.error = "No account found. Please create or import a wallet in Freighter.";
        }
      } catch (e: any) {
        const errorMsg = e?.message || String(e);
        if (errorMsg.includes("locked") || errorMsg.includes("not connected")) {
          status.unlocked = false;
          status.error = "Freighter is locked. Please unlock it.";
        } else if (errorMsg.includes("No account") || errorMsg.includes("account")) {
          status.hasAccount = false;
          status.error = "No account found. Please create or import a wallet.";
        } else {
          status.error = errorMsg;
        }
      }

      // Try to get network (this might require additional API calls)
      // For now, we'll assume testnet if we got this far
      status.network = "testnet";
      
    } catch (e: any) {
      status.error = `Freighter API error: ${e?.message || String(e)}`;
    }
  } catch (e: any) {
    status.error = `Unexpected error: ${e?.message || String(e)}`;
  }

  return status;
}

export function getFreighterHelpMessage(status: FreighterStatus): string {
  if (!status.installed) {
    return "Please install Freighter extension from https://freighter.app";
  }
  
  if (!status.unlocked) {
    return "Please unlock Freighter wallet";
  }
  
  if (!status.hasAccount) {
    return "Please create or import a wallet account in Freighter";
  }
  
  if (!status.address) {
    return "No wallet address found. Please check Freighter settings";
  }
  
  return "Freighter is ready!";
}

