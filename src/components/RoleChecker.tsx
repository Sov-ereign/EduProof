"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import RoleSelection from "@/components/RoleSelection";

export default function RoleChecker({ children }: { children: React.ReactNode }) {
    const { data: session, status, update } = useSession();
    const [showRoleModal, setShowRoleModal] = useState(false);
    const router = useRouter();

    useEffect(() => {
        // Only check after session is loaded and user is authenticated
        if (status === "authenticated" && session?.user) {
            const userRoles = (session.user as any)?.roles || [];

            // Show modal if user has no roles assigned
            if (userRoles.length === 0) {
                setShowRoleModal(true);
            }
        }
    }, [status, session]);

    const handleRoleComplete = async () => {
        // Refresh session to get updated roles
        await update();
        setShowRoleModal(false);
        router.refresh();
    };

    return (
        <>
            {showRoleModal && <RoleSelection onComplete={handleRoleComplete} />}
            {children}
        </>
    );
}
