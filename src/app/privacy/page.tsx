import Link from "next/link";
import { Shield, Lock } from "lucide-react";

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 py-32 px-6">
            <div className="max-w-3xl mx-auto bg-white p-8 md:p-12 rounded-[2rem] border border-slate-200 shadow-xl">
                <div className="mb-10 text-center">
                    <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6 transform -rotate-3">
                        <Lock className="w-8 h-8 text-purple-600" />
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 mb-4">Privacy Policy</h1>
                    <p className="text-slate-500">Last Updated: {new Date().toLocaleDateString()}</p>
                </div>

                <div className="space-y-8 text-slate-600 leading-relaxed">
                    <section>
                        <h2 className="text-xl font-bold text-slate-900 mb-3">1. Data Minimization</h2>
                        <p>
                            EduProof Zero is designed with privacy as a core principle. We collect strictly minimal data
                            required to verify your skills. Evaluated code contents are processed transiently by our AI agents
                            and are not permanently stored on our servers.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 mb-3">2. Blockchain Transparency</h2>
                        <p>
                            Please be aware that any credentials minted to the Stellar blockchain are public and permanent.
                            Your skill level, score, and the link to your evidence will be visible on-chain.
                            Do not submit repositories containing private keys, secrets, or sensitive personal information.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 mb-3">3. Third-Party Services</h2>
                        <p>
                            We use GitHub OAuth for authentication and Google Gemini for AI analysis.
                            Your use of these services is subject to their respective privacy policies.
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
