"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GraduationCap, ShieldCheck, Users, ArrowRight, Loader2 } from "lucide-react";

interface RoleSelectionProps {
    onComplete: () => void;
}

export default function RoleSelection({ onComplete }: RoleSelectionProps) {
    const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
    const [saving, setSaving] = useState(false);

    const roles = [
        {
            id: "student",
            name: "Student",
            description: "Take tests and earn credentials",
            icon: GraduationCap,
            color: "from-blue-500 to-indigo-600"
        },
        {
            id: "verifier",
            name: "Verifier",
            description: "Verify candidate credentials",
            icon: ShieldCheck,
            color: "from-purple-500 to-pink-600"
        },
        {
            id: "both",
            name: "Both",
            description: "Full access to all features",
            icon: Users,
            color: "from-emerald-500 to-teal-600"
        }
    ];

    const handleRoleSelect = (roleId: string) => {
        if (roleId === "both") {
            setSelectedRoles(["student", "verifier"]);
        } else {
            setSelectedRoles([roleId]);
        }
    };

    const handleContinue = async () => {
        if (selectedRoles.length === 0) return;

        setSaving(true);
        try {
            const response = await fetch("/api/user/roles", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ roles: selectedRoles })
            });

            if (response.ok) {
                onComplete();
            } else {
                alert("Failed to save role selection. Please try again.");
                setSaving(false);
            }
        } catch (error) {
            alert("An error occurred. Please try again.");
            setSaving(false);
        }
    };

    const getSelectedRoleId = () => {
        if (selectedRoles.length === 2) return "both";
        return selectedRoles[0] || "";
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-3xl p-10 max-w-2xl w-full shadow-2xl"
            >
                <div className="text-center mb-10">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.1, type: "spring" }}
                        className="w-16 h-16 bg-gradient-to-br from-zinc-900 to-zinc-700 rounded-2xl flex items-center justify-center mx-auto mb-6"
                    >
                        <Users className="w-8 h-8 text-white" />
                    </motion.div>
                    <h2 className="text-4xl font-black text-zinc-950 mb-3 tracking-tight">Welcome to EduProof</h2>
                    <p className="text-zinc-600 font-medium text-lg">Choose how you'd like to use the platform</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    {roles.map((role, index) => {
                        const Icon = role.icon;
                        const isSelected = role.id === "both"
                            ? selectedRoles.length === 2
                            : selectedRoles.includes(role.id);

                        return (
                            <motion.button
                                key={role.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 + index * 0.1 }}
                                onClick={() => handleRoleSelect(role.id)}
                                className={`relative p-6 rounded-2xl border-2 transition-all text-left group ${isSelected
                                        ? "border-zinc-950 bg-zinc-50 shadow-lg scale-105"
                                        : "border-zinc-200 hover:border-zinc-400 hover:shadow-md"
                                    }`}
                            >
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${role.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                    <Icon className="w-6 h-6 text-white" />
                                </div>
                                <h3 className="text-xl font-black text-zinc-950 mb-2">{role.name}</h3>
                                <p className="text-sm text-zinc-600 font-medium">{role.description}</p>

                                {isSelected && (
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="absolute top-4 right-4 w-6 h-6 bg-zinc-950 rounded-full flex items-center justify-center"
                                    >
                                        <div className="w-2 h-2 bg-white rounded-full" />
                                    </motion.div>
                                )}
                            </motion.button>
                        );
                    })}
                </div>

                <button
                    onClick={handleContinue}
                    disabled={selectedRoles.length === 0 || saving}
                    className="w-full h-14 bg-zinc-950 hover:bg-zinc-800 text-white font-black rounded-xl transition-all shadow-xl flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                >
                    {saving ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            Continue
                            <ArrowRight className="w-5 h-5" />
                        </>
                    )}
                </button>
            </motion.div>
        </div>
    );
}
