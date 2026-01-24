import Link from "next/link";
import { FileText } from "lucide-react";

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 py-32 px-6">
            <div className="max-w-3xl mx-auto bg-white p-8 md:p-12 rounded-[2rem] border border-slate-200 shadow-xl">
                <div className="mb-10 text-center">
                    <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6 transform rotate-3">
                        <FileText className="w-8 h-8 text-purple-600" />
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 mb-4">Terms of Service</h1>
                    <p className="text-slate-500">Effective Date: {new Date().toLocaleDateString()}</p>
                </div>

                <div className="space-y-8 text-slate-600 leading-relaxed">
                    <section>
                        <h2 className="text-xl font-bold text-slate-900 mb-3">1. Acceptance of Terms</h2>
                        <p>
                            By accessing or using EduProof Zero, you agree to be bound by these Terms.
                            If you disagree with any part of the terms, you may not use our service.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 mb-3">2. Credential Integrity</h2>
                        <p>
                            You agree to only submit work that is your own. Submitting plagiarized code or
                            attempting to game the verification system may result in your wallet being blacklisted
                            from future minting.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 mb-3">3. No Guarantee</h2>
                        <p>
                            AI evaluations are probabilistic. While we strive for accuracy, EduProof cannot guarantee
                            that the AI assessment perfectly reflects your skill level. Credentials are provided "as-is".
                        </p>
                    </section>

                    <div className="pt-8 border-t border-slate-100 mt-8">
                        <Link href="/" className="text-purple-600 font-bold hover:underline">
                            &larr; Return to Home
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
