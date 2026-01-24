import Link from "next/link";
import { ExternalLink, Code } from "lucide-react";

export default function SmartContractPage() {
    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 py-32 px-6">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-3 mb-6">
                    <div className="bg-purple-100 p-2 rounded-lg">
                        <Code className="w-6 h-6 text-purple-600" />
                    </div>
                    <h1 className="text-4xl font-black text-slate-900">Smart Contract</h1>
                </div>

                <p className="text-lg text-slate-600 mb-12 leading-relaxed">
                    EduProof credentials are managed by a Soroban smart contract on the Stellar network.
                    The contract is immutable and ensures that credentials cannot be forged or transferred.
                </p>

                <div className="grid md:grid-cols-2 gap-6 mb-12">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Network</h3>
                        <p className="text-xl font-bold text-slate-900">Stellar Testnet</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Contract Standard</h3>
                        <p className="text-xl font-bold text-slate-900">Soroban WASM</p>
                    </div>
                </div>

                <div className="bg-slate-900 text-white p-8 rounded-2xl shadow-xl overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/20 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />

                    <h2 className="text-2xl font-bold mb-6">Contract Source</h2>
                    <p className="text-slate-400 mb-8 max-w-lg">
                        The full source code for the credential minting and verification logic is available on GitHub.
                    </p>

                    <Link
                        href="https://github.com/Sov-ereign/PresentX"
                        target="_blank"
                        className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-xl font-bold transition-all"
                    >
                        View on GitHub <ExternalLink className="w-4 h-4" />
                    </Link>
                </div>
            </div>
        </div>
    );
}
