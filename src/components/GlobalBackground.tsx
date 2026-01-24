"use client";

import { motion } from "framer-motion";

export default function GlobalBackground() {
    return (
        <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden bg-white">
            {/* Mesh Gradient Layer */}
            <div className="absolute inset-0 bg-mesh-gradient-light opacity-60" />

            {/* Grid Pattern Layer */}
            <div className="absolute inset-0 bg-grid-subtle opacity-40" />

            {/* Decorative Blobs */}
            <motion.div
                animate={{
                    x: [0, 50, 0],
                    y: [0, 30, 0],
                    scale: [1, 1.1, 1]
                }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute -top-[10%] -left-[5%] w-[40%] h-[40%] bg-indigo-50/30 rounded-full blur-[100px]"
            />
            <motion.div
                animate={{
                    x: [0, -40, 0],
                    y: [0, 60, 0],
                    scale: [1, 1.2, 1]
                }}
                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                className="absolute -bottom-[10%] -right-[5%] w-[50%] h-[50%] bg-purple-50/20 rounded-full blur-[120px]"
            />
        </div>
    );
}
