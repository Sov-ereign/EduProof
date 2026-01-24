export default function DocsPage() {
    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 py-32 px-6">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl font-black mb-6">Documentation</h1>
                <p className="text-lg text-slate-600 mb-8">
                    EduProof Zero is a decentralized skill verification platform built on Stellar.
                    This documentation is currently under development.
                </p>

                <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                    <h2 className="text-2xl font-bold mb-4">Core Concepts</h2>
                    <ul className="space-y-4 text-slate-600">
                        <li className="flex items-start gap-3">
                            <span className="text-purple-600 font-bold">•</span>
                            <span><strong>Evidence Evaluation</strong>: AI agents analyze code repositories against public rubrics.</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="text-purple-600 font-bold">•</span>
                            <span><strong>Credential Minting</strong>: Successful evaluations allow minting a Soulbound NFT.</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="text-purple-600 font-bold">•</span>
                            <span><strong>Zero-Trust Verification</strong>: Employers can verify skills directly on-chain.</span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
