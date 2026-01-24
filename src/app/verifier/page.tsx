"use client";

import { useState, useEffect } from "react";
import { Search, ShieldCheck, ExternalLink, User, AlertCircle, CheckCircle2, X, Loader2, Award, Lock, Wallet, LogOut, ArrowRight, CreditCard, Receipt, History, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession, signIn, signOut } from "next-auth/react";
import { loadStripe } from "@stripe/stripe-js";
import ScrollReveal from "@/components/ScrollReveal";
import Certificate from "@/components/Certificate";
import confetti from "canvas-confetti";

const LEVEL_COLORS: Record<string, string> = {
    Beginner: "bg-zinc-100 text-zinc-900 border-zinc-200 shadow-sm",
    Intermediate: "bg-zinc-900 text-white border-zinc-800",
    Advanced: "bg-zinc-900 text-white border-zinc-800 shadow-[0_0_15px_rgba(0,0,0,0.1)]",
    Expert: "bg-zinc-950 text-white border-zinc-900 shadow-2xl",
    Verified: "bg-zinc-50 text-zinc-600 border-zinc-200",
};

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "");

export default function VerifierDashboard() {
    const { data: session } = useSession();
    const [search, setSearch] = useState("");
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [paying, setPaying] = useState(false);
    const [wallet, setWallet] = useState<string | null>(null);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [showCertificate, setShowCertificate] = useState(false);
    const [certificateData, setCertificateData] = useState<any>(null);
    const [billingHistory, setBillingHistory] = useState<any[]>([]);
    const [showBilling, setShowBilling] = useState(false);
    const [showBumper, setShowBumper] = useState(false);

    // Reusable fetch logic for billing history
    const updateBillingHistory = async (address: string) => {
        try {
            const { fetchSubscriptionHistory } = await import("@/lib/stellar");
            const onChainHistory = await fetchSubscriptionHistory(address);

            const dbRes = await fetch("/api/verifier/billing");
            const dbData = await dbRes.json();

            if (dbData.success) {
                const dbHistory = dbData.history.map((b: any) => ({
                    hash: b.txHash || b.stripeSessionId,
                    isStellar: !!b.txHash,
                    date: b.date,
                    amount: b.amount,
                    memo: `PAYMENT:${b.status}`,
                    type: "mongodb"
                }));
                const combined = [...dbHistory, ...onChainHistory.filter((oc: any) => !dbHistory.find((db: any) => db.hash === oc.hash))];
                const uniqueBills = Array.from(new Map(combined.map((item: any) => [item.hash, item])).values());
                setBillingHistory(uniqueBills);
            } else {
                setBillingHistory(onChainHistory);
            }
        } catch (e) {
            console.error("History fetch error:", e);
        }
    };

    // Auto-connect wallet for verifier and check subscription
    useEffect(() => {
        const tryReconnect = async () => {
            if (session) {
                try {
                    const { connectWallet, checkSubscriptionStatus, fetchSubscriptionHistory } = await import("@/lib/stellar");
                    const address = await connectWallet();
                    if (address) {
                        setWallet(address);

                        // Check MongoDB session first
                        if ((session?.user as any)?.isSubscribed) {
                            setIsSubscribed(true);
                            setIsUnlocked(true);
                        } else {
                            // Fallback to on-chain check
                            const sub = await checkSubscriptionStatus(address);
                            if (sub.active) {
                                setIsSubscribed(true);
                                setIsUnlocked(true);
                            }
                        }
                        // Fetch all history (MongoDB + Stellar)
                        await updateBillingHistory(address);
                    }
                } catch (e) {
                    console.log("Verifier wallet not connected:", e);
                }
            }
        };
        tryReconnect();
    }, [session]);

    // Handle post-payment redirect
    useEffect(() => {
        const checkPayment = async () => {
            const params = new URLSearchParams(window.location.search);
            const sessionId = params.get("session_id");
            const subscribed = params.get("subscribed");
            const savedSearch = localStorage.getItem("last_verifier_search");

            if (sessionId && subscribed === "true") {
                if (!wallet) return;
                setLoading(true);
                try {
                    const verifyRes = await fetch(`/api/stripe/verify?session_id=${sessionId}`);
                    const verifyData = await verifyRes.json();

                    if (verifyData.success) {
                        setIsSubscribed(true);
                        setIsUnlocked(true);

                        // Record subscription on Stellar
                        try {
                            const { recordSubscription } = await import("@/lib/stellar");
                            const onChainResult = await recordSubscription(wallet, 30);

                            // Save Stellar Hash to MongoDB
                            if (onChainResult.success) {
                                await fetch("/api/verifier/billing", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({
                                        sessionId: sessionId,
                                        txHash: onChainResult.hash
                                    })
                                });
                            }

                            // Refetch all history
                            await updateBillingHistory(wallet);
                        } catch (recordError) {
                            console.error("Failed to record subscription on-chain:", recordError);
                        }

                        if (savedSearch) {
                            const { fetchUserCredentials } = await import("@/lib/stellar");
                            const credentials = await fetchUserCredentials(savedSearch);
                            setResult({ address: savedSearch, credentials });
                            setSearch(savedSearch);
                        }

                        // Trigger Confetti & Bumper
                        confetti({
                            particleCount: 150,
                            spread: 70,
                            origin: { y: 0.6 },
                            colors: ['#000000', '#ffffff', '#71717a']
                        });
                        setShowBumper(true);
                        setTimeout(() => setShowBumper(false), 4000);
                    } else {
                        setError("Stripe verification failed.");
                    }
                } catch (e: any) {
                    console.error("Post-payment error:", e);
                    setError("Failed to restore session: " + e.message);
                } finally {
                    setLoading(false);
                    // Clean up URL
                    window.history.replaceState({}, document.title, window.location.pathname);
                }
            }
        };
        checkPayment();
    }, [wallet, session]);

    const handleSearch = async () => {
        if (!search.trim()) return;
        setLoading(true);
        setResult(null);
        setError("");
        setIsUnlocked(false);

        try {
            const { fetchUserCredentials } = await import("@/lib/stellar");
            const credentials = await fetchUserCredentials(search.trim());

            setResult({
                address: search.trim(),
                credentials: credentials
            });
            localStorage.setItem("last_verifier_search", search.trim());

            // If already subscribed, unlock automatically
            if (isSubscribed) {
                setIsUnlocked(true);
            }
        } catch (e: any) {
            console.error(e);
            setError(e.message || "Failed to verify wallet. Please check the address format.");
        } finally {
            setLoading(false);
        }
    };

    const handlePayment = async () => {
        if (!session) return signIn("github");
        if (!result) return;
        setPaying(true);

        try {
            const response = await fetch("/api/stripe/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    amount: 30, // $30 monthly access
                    currency: "usd",
                    candidateAddress: result?.address || "",
                    skill: "Monthly-Subscription"
                }),
            });

            const { id, url, error: stripeError } = await response.json();

            if (stripeError) throw new Error(stripeError);

            // Redirect to Stripe Checkout
            window.location.href = url;
        } catch (e: any) {
            console.error(e);
            setError("Payment initialization failed: " + e.message);
            setPaying(false);
        }
    };

    const getLevelColor = (level: string) => {
        return LEVEL_COLORS[level] || LEVEL_COLORS.Verified;
    };

    // AUTH WALL
    if (!session) {
        return (
            <div className="min-h-screen bg-zinc-50 text-zinc-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
                <div className="fixed inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-100 via-zinc-50 to-zinc-50 -z-10" />
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md w-full bg-white border border-zinc-200 p-10 rounded-[2rem] text-center shadow-2xl"
                >
                    <div className="w-20 h-20 bg-zinc-950 rounded-3xl flex items-center justify-center mx-auto mb-8 transform -rotate-6">
                        <ShieldCheck className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-3xl font-black mb-4 text-zinc-950 tracking-tight">Verifier Node Access</h1>
                    <p className="text-zinc-500 mb-10 font-medium">
                        Secure access to candidate verification tools requires GitHub authentication.
                    </p>
                    <button
                        onClick={() => signIn("github")}
                        className="w-full bg-zinc-950 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-zinc-800 transition-all active:scale-95 shadow-xl"
                    >
                        <Lock className="w-5 h-5" />
                        UNLOCK WITH GITHUB
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-50 text-zinc-950 relative overflow-hidden">
            {/* Minimalist background decoration */}
            <div className="fixed inset-0 -z-10 bg-[radial-gradient(45%_45%_at_50%_50%,#fafafa_0%,#f4f4f5_100%)]" />
            <div className="fixed inset-0 -z-10">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:32px_32px]" />
            </div>

            <main className="max-w-6xl mx-auto px-6 py-12 md:py-20 lg:py-32">
                {/* Header with Dashboard info */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-24">
                    <div className="space-y-4">
                        <ScrollReveal direction="down">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-zinc-200 rounded-full shadow-sm">
                                <span className="w-1.5 h-1.5 rounded-full bg-zinc-950 animate-pulse" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Validation Authority</span>
                            </div>
                        </ScrollReveal>
                        <ScrollReveal direction="up" delay={0.1}>
                            <h1 className="text-5xl md:text-7xl font-black tracking-tight text-zinc-950 leading-[0.9]">
                                Verify Proofs<span className="text-zinc-400">.</span>
                            </h1>
                        </ScrollReveal>
                    </div>

                    <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-zinc-200 shadow-sm">
                        <div className="flex items-center gap-3 px-4 py-2">
                            <div className="w-8 h-8 bg-zinc-100 rounded-full flex items-center justify-center border border-zinc-200">
                                <User className="w-4 h-4 text-zinc-400" />
                            </div>
                            <div className="text-left">
                                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none">Verifier</p>
                                <p className="text-xs font-bold text-zinc-900">{session.user?.name}</p>
                            </div>
                        </div>
                        <div className="h-8 w-px bg-zinc-100" />
                        <button
                            onClick={() => setShowBilling(!showBilling)}
                            className={`p-2.5 rounded-xl transition-all ${showBilling ? "bg-zinc-950 text-white" : "hover:bg-zinc-50 text-zinc-400"}`}
                            title="Billing History"
                        >
                            <Receipt className="w-4 h-4" />
                        </button>
                        <div className="h-8 w-px bg-zinc-100" />
                        <button onClick={() => signOut()} className="p-2.5 rounded-xl hover:bg-zinc-50 text-zinc-400 hover:text-red-600 transition-all">
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Billing History Section */}
                <AnimatePresence>
                    {showBilling && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden mb-12"
                        >
                            <div className="bg-white border border-zinc-200 rounded-[2.5rem] p-10 shadow-sm">
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="w-10 h-10 bg-zinc-100 rounded-xl flex items-center justify-center">
                                        <History className="w-5 h-5 text-zinc-950" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-zinc-950 tracking-tight">Billing & Transaction History</h3>
                                        <p className="text-xs font-medium text-zinc-400 uppercase tracking-widest">Verified On-Chain Records</p>
                                    </div>
                                    <div className="ml-auto flex items-center gap-2">
                                        <button
                                            onClick={async () => {
                                                if (wallet) {
                                                    setLoading(true);
                                                    await updateBillingHistory(wallet);
                                                    setLoading(false);
                                                }
                                            }}
                                            className="p-2 hover:bg-zinc-50 rounded-lg text-zinc-400 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
                                        >
                                            <Loader2 className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} /> REFRESH
                                        </button>
                                        <button
                                            onClick={() => setShowBilling(false)}
                                            className="p-2 hover:bg-zinc-50 rounded-lg text-zinc-400"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {loading && billingHistory.length === 0 ? (
                                    <div className="text-center py-12 border-2 border-dashed border-zinc-100 rounded-[1.5rem] animate-pulse">
                                        <Loader2 className="w-8 h-8 text-zinc-100 mx-auto mb-3 animate-spin" />
                                        <p className="text-sm font-bold text-zinc-200 uppercase tracking-widest">Synchronizing records...</p>
                                    </div>
                                ) : billingHistory.length === 0 ? (
                                    <div className="text-center py-12 border-2 border-dashed border-zinc-100 rounded-[1.5rem]">
                                        <Calendar className="w-8 h-8 text-zinc-100 mx-auto mb-3" />
                                        <p className="text-sm font-bold text-zinc-300 uppercase tracking-widest">No active billings found</p>
                                    </div>
                                ) : (
                                    <div className="grid gap-4">
                                        {billingHistory.map((bill, i) => (
                                            <div key={bill.hash} className="flex flex-col md:flex-row items-center justify-between p-6 bg-zinc-50 rounded-2xl border border-zinc-100 group">
                                                <div className="flex items-center gap-6 w-full md:w-auto mb-4 md:mb-0">
                                                    <div className="text-center px-4">
                                                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-1">Status</p>
                                                        <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">PAID</span>
                                                    </div>
                                                    <div className="w-px h-8 bg-zinc-200 hidden md:block" />
                                                    <div>
                                                        <p className="text-xs font-bold text-zinc-950">Monthly Verifier Access</p>
                                                        <p className="text-[10px] font-medium text-zinc-400">{new Date(bill.date).toLocaleDateString()} • {new Date(bill.date).toLocaleTimeString()}</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between w-full md:w-auto gap-8">
                                                    <div className="text-right">
                                                        <p className="text-lg font-black text-zinc-950">${bill.amount}.00</p>
                                                        <p className="text-[10px] font-bold text-zinc-400">USD (Verified)</p>
                                                    </div>
                                                    {bill.isStellar || bill.hash.startsWith("0x") || bill.hash.length > 30 ? (
                                                        <a
                                                            href={`https://stellar.expert/explorer/testnet/tx/${bill.hash}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center gap-2 bg-white hover:bg-zinc-950 hover:text-white border border-zinc-200 px-5 py-2.5 rounded-xl text-[10px] font-black tracking-widest transition-all shadow-sm group-hover:shadow-md"
                                                        >
                                                            VIEW ON-CHAIN <ExternalLink className="w-3 h-3" />
                                                        </a>
                                                    ) : (
                                                        <div className="flex items-center gap-2 bg-zinc-100 text-zinc-400 px-5 py-2.5 rounded-xl text-[10px] font-black tracking-widest cursor-wait">
                                                            SYNCING... <Loader2 className="w-3 h-3 animate-spin" />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <p className="mt-8 text-[10px] font-bold text-zinc-300 uppercase tracking-[0.2em] text-center">
                                    All transactions are secured by Stellar Blockchain and reflect your immutable billing identity.
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Search Bar */}
                <ScrollReveal direction="up" delay={0.2}>
                    <div className="relative mb-24 max-w-3xl">
                        <div className="relative group">
                            <div className="absolute -inset-1 bg-zinc-950/5 rounded-[2rem] blur-2xl opacity-0 group-hover:opacity-100 transition duration-500" />
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-400 w-5 h-5 z-10" />
                            <input
                                type="text"
                                placeholder="Stellar Ledger Address (G...)"
                                className="relative w-full bg-white border border-zinc-200 rounded-[2rem] py-6 pl-14 pr-44 text-zinc-950 text-lg font-bold placeholder:text-zinc-300 focus:outline-none focus:border-zinc-950 transition-all shadow-xl"
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    setError("");
                                }}
                                onKeyDown={(e) => e.key === 'Enter' && !loading && handleSearch()}
                            />
                            <button
                                onClick={handleSearch}
                                disabled={loading || !search.trim()}
                                className="absolute right-3 top-3 bottom-3 bg-zinc-950 hover:bg-zinc-800 text-white px-8 rounded-[1.5rem] font-black text-xs tracking-widest transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-95 z-20"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "EXECUTE QUERY"}
                            </button>
                        </div>
                    </div>
                </ScrollReveal>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-red-50 border border-red-100 p-6 rounded-3xl mb-16 flex items-start gap-4 shadow-sm max-w-2xl"
                    >
                        <AlertCircle className="w-5 h-5 text-red-500 mt-1" />
                        <div className="flex-1">
                            <p className="text-red-900 font-bold text-sm">Query Failed</p>
                            <p className="text-red-600 text-sm font-medium">{error}</p>
                        </div>
                        <button onClick={() => setError("")}>
                            <X className="w-5 h-5 text-red-300 hover:text-red-500" />
                        </button>
                    </motion.div>
                )}

                {loading && (
                    <div className="py-24 text-center">
                        <Loader2 className="w-12 h-12 text-zinc-200 animate-spin mx-auto mb-6" />
                        <p className="text-zinc-400 font-black text-xs uppercase tracking-[0.3em]">Synching Ledger State...</p>
                    </div>
                )}

                {result && !loading && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-12"
                    >
                        {/* Candidate Identity Card */}
                        <div className="bg-white border border-zinc-200 p-10 rounded-[2.5rem] shadow-sm flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-zinc-50 rounded-full blur-3xl -z-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="flex items-center gap-6 relative z-10 w-full md:w-auto">
                                <div className="bg-zinc-950 p-5 rounded-2xl shadow-xl">
                                    <User className="w-8 h-8 text-white" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] font-black text-zinc-400 mb-1 uppercase tracking-widest">Target Identity</p>
                                    <p className="font-mono text-zinc-950 text-xl font-bold truncate">{result.address}</p>
                                </div>
                            </div>

                            <div
                                onClick={() => !isUnlocked && handlePayment()}
                                className={`flex items-center gap-8 relative z-10 px-8 py-5 bg-zinc-50 rounded-2xl border border-zinc-100 w-full md:w-auto justify-center transition-all ${!isUnlocked ? "cursor-pointer hover:bg-zinc-100" : ""}`}
                            >
                                <div className={`text-center transition-all ${!isUnlocked ? "blur-md" : ""}`}>
                                    <div className="text-4xl font-black text-zinc-950 leading-none">{result.credentials.length}</div>
                                    <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mt-2">Proofs</div>
                                </div>
                                {!isUnlocked && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Lock className="w-5 h-5 text-zinc-400" />
                                    </div>
                                )}
                                <div className="w-px h-10 bg-zinc-200" />
                                <div className="flex flex-col items-center gap-1">
                                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1.5">
                                        <CheckCircle2 className="w-3 h-3" /> VERIFIED
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Payment Lock Section */}
                        {!isUnlocked ? (
                            <div className="relative py-20 px-10 bg-white border border-zinc-200 rounded-[2.5rem] text-center shadow-xl overflow-hidden group">
                                <div className="absolute inset-0 bg-zinc-50/50 backdrop-blur-[2px] z-10" />
                                <div className="relative z-20 max-w-sm mx-auto">
                                    <div className="w-16 h-16 bg-zinc-950 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
                                        <Lock className="w-6 h-6 text-white" />
                                    </div>
                                    <h3 className="text-2xl font-black text-zinc-950 mb-3 tracking-tight">Proofs Encrypted</h3>
                                    <p className="text-zinc-500 font-medium mb-8 leading-relaxed">
                                        Candidate credentials are locked. Complete a micro-payment to access immutable records and technical benchmarks.
                                    </p>
                                    <button
                                        onClick={handlePayment}
                                        disabled={paying}
                                        className="w-full h-14 bg-zinc-950 hover:bg-zinc-800 text-white font-black text-xs tracking-widest rounded-xl transition-all shadow-2xl flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                                    >
                                        {paying ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CreditCard className="w-4 h-4" /> SUBSCRIBE FOR UNLIMITED ($30/mo)</>}
                                    </button>
                                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mt-6">Secured by Stripe • Permanent Record on Stellar</p>
                                </div>

                                {/* Blurred preview of content */}
                                <div className="absolute inset-0 z-0 opacity-10 pointer-events-none p-10 select-none grayscale blur-sm">
                                    <div className="h-40 w-full bg-zinc-200 rounded-2xl mb-6" />
                                    <div className="h-40 w-full bg-zinc-200 rounded-2xl" />
                                </div>
                            </div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="space-y-8"
                            >
                                <div className="flex items-center justify-between px-4">
                                    <h2 className="text-2xl font-black text-zinc-950 tracking-tight uppercase">Unlocked Proofs</h2>
                                    <div className="px-4 py-1.5 bg-emerald-500 text-white rounded-full text-[10px] font-black tracking-widest flex items-center gap-2">
                                        <CheckCircle2 className="w-3 h-3" /> ACCESS GRANTED
                                    </div>
                                </div>

                                {result.credentials.length === 0 ? (
                                    <div className="text-center py-32 bg-white border border-dashed border-zinc-200 rounded-[2.5rem]">
                                        <ShieldCheck className="w-16 h-16 mx-auto mb-6 text-zinc-100" />
                                        <p className="text-zinc-500 font-bold">No verified credentials found for this identity.</p>
                                    </div>
                                ) : (
                                    <div className="grid gap-6">
                                        {result.credentials.map((cred: any, i: number) => (
                                            <motion.div
                                                key={cred.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.1 }}
                                                className="bg-white border border-zinc-200 p-8 rounded-[2.5rem] hover:border-zinc-950 transition-all group relative overflow-hidden"
                                            >
                                                <div className="flex flex-col md:flex-row justify-between items-start gap-8 relative z-10">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-4 mb-6">
                                                            <div className="w-12 h-12 rounded-xl bg-zinc-950 flex items-center justify-center shadow-lg group-hover:rotate-6 transition-transform">
                                                                <Award className="w-6 h-6 text-white" />
                                                            </div>
                                                            <h3 className="text-3xl font-black text-zinc-950 tracking-tight">{cred.skill}</h3>
                                                        </div>
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <span className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border ${getLevelColor(cred.level)}`}>
                                                                {cred.level}
                                                            </span>
                                                            <span className="px-4 py-1.5 bg-zinc-50 text-zinc-400 rounded-lg text-[10px] font-black tracking-widest border border-zinc-100">
                                                                BENCHMARK: {cred.score}/100
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="bg-zinc-950 p-6 rounded-3xl min-w-[160px] text-center shadow-2xl">
                                                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Mastery Delta</p>
                                                        <div className="text-5xl font-black text-white leading-none mb-4">{cred.score}<span className="text-xl text-zinc-700 ml-1">%</span></div>
                                                        <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                                                            <motion.div
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${cred.score}%` }}
                                                                transition={{ duration: 1, delay: 0.5 }}
                                                                className="h-full bg-white"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap items-center gap-6 mt-10 pt-8 border-t border-zinc-100">
                                                    <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                                                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                                        Ledger Active: {cred.date}
                                                    </div>
                                                    <div className="flex items-center gap-3 md:ml-auto">
                                                        {cred.evidence && (
                                                            <a href={cred.evidence} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-zinc-950 hover:bg-zinc-50 border border-zinc-200 px-5 py-2.5 rounded-xl text-[10px] font-black tracking-widest transition-all">
                                                                EVIDENCE <ExternalLink className="w-3 h-3" />
                                                            </a>
                                                        )}
                                                        {cred.txHash && (
                                                            <button
                                                                onClick={() => {
                                                                    setCertificateData({
                                                                        userName: result.address.slice(0, 10) + "...",
                                                                        skill: cred.skill,
                                                                        level: cred.level,
                                                                        score: cred.score,
                                                                        date: cred.date,
                                                                        transactionHash: cred.txHash,
                                                                        explorerUrl: `https://stellar.expert/explorer/testnet/tx/${cred.txHash}`
                                                                    });
                                                                    setShowCertificate(true);
                                                                }}
                                                                className="flex items-center gap-2 bg-zinc-950 text-white border border-zinc-950 px-5 py-2.5 rounded-xl text-[10px] font-black tracking-widest transition-all shadow-lg active:scale-95"
                                                            >
                                                                PROVE <ExternalLink className="w-3 h-3" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </motion.div>
                )}
            </main>

            {/* Certificate Modal */}
            {showCertificate && certificateData && (
                <Certificate
                    userName={certificateData.userName}
                    skill={certificateData.skill}
                    level={certificateData.level}
                    score={certificateData.score}
                    date={certificateData.date}
                    transactionHash={certificateData.transactionHash}
                    explorerUrl={certificateData.explorerUrl}
                    onClose={() => setShowCertificate(false)}
                />
            )}
            {/* Success Bumper Overlay */}
            <AnimatePresence>
                {showBumper && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950/90 backdrop-blur-xl"
                    >
                        <motion.div
                            initial={{ scale: 0.8, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            className="text-center"
                        >
                            <motion.div
                                animate={{
                                    scale: [1, 1.2, 1],
                                    rotate: [0, 10, -10, 0]
                                }}
                                transition={{ duration: 0.5, repeat: 2 }}
                                className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-[0_0_50px_rgba(255,255,255,0.3)]"
                            >
                                <ShieldCheck className="w-12 h-12 text-zinc-950" />
                            </motion.div>
                            <h2 className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tighter uppercase italic">Access Granted</h2>
                            <p className="text-zinc-400 font-bold tracking-widest uppercase text-xs">Stellar Ledger Synched • Verifier Node Active</p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
