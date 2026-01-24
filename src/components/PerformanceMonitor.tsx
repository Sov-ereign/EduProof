"use client";

import { useEffect, useState } from "react";

export default function PerformanceMonitor() {
    const [metrics, setMetrics] = useState({
        fps: 0,
        memory: "0 MB",
    });

    // Only run in development
    const isDev = process.env.NODE_ENV !== 'production';

    useEffect(() => {
        if (!isDev) return;

        let frameCount = 0;
        let lastTime = performance.now();
        let animationFrameId: number;

        const updateMetrics = () => {
            const now = performance.now();
            frameCount++;

            if (now - lastTime >= 1000) {
                // Calculate FPS
                const fps = Math.round((frameCount * 1000) / (now - lastTime));

                // Calculate Memory (if supported)
                let memoryUsage = "N/A";
                if (typeof window !== 'undefined' && (window.performance as any).memory) {
                    const usedJSHeapSize = (window.performance as any).memory.usedJSHeapSize;
                    memoryUsage = Math.round(usedJSHeapSize / (1024 * 1024)) + " MB";
                }

                setMetrics({ fps, memory: memoryUsage });

                frameCount = 0;
                lastTime = now;
            }

            animationFrameId = requestAnimationFrame(updateMetrics);
        };

        animationFrameId = requestAnimationFrame(updateMetrics);

        return () => cancelAnimationFrame(animationFrameId);
    }, [isDev]);

    if (!isDev) return null;

    return (
        <div className="fixed bottom-4 right-4 z-[9999] bg-black/80 backdrop-blur-md border border-purple-500/30 p-3 rounded-md text-xs font-mono text-green-400 pointer-events-none select-none shadow-lg">
            <div className="flex flex-col gap-1">
                <div className="flex justify-between gap-4">
                    <span className="text-gray-400">FPS:</span>
                    <span className={metrics.fps < 30 ? "text-red-500 font-bold" : "text-green-400"}>
                        {metrics.fps}
                    </span>
                </div>
                <div className="flex justify-between gap-4">
                    <span className="text-gray-400">MEM:</span>
                    <span>{metrics.memory}</span>
                </div>
                <div className="flex justify-between gap-4 border-t border-white/10 mt-1 pt-1">
                    <span className="text-gray-500">ENV:</span>
                    <span className="text-yellow-500">DEV</span>
                </div>
            </div>
        </div>
    );
}
