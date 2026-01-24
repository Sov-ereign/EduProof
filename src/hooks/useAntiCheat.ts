"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export interface AntiCheatStatus {
    isActive: boolean;
    tabFocused: boolean;
    violations: number;
    warnings: string[];
}

export interface UseAntiCheatOptions {
    onViolation?: (type: 'tab') => void;
    onWarning?: (message: string) => void;
    maxViolations?: number;
}

export function useAntiCheat(options: UseAntiCheatOptions = {}) {
    const {
        onViolation,
        onWarning,
        maxViolations = 3
    } = options;

    const [status, setStatus] = useState<AntiCheatStatus>({
        isActive: false,
        tabFocused: true,
        violations: 0,
        warnings: []
    });

    // Use refs for callbacks to prevent effect re-runs when they change
    const onViolationRef = useRef(onViolation);
    const onWarningRef = useRef(onWarning);

    useEffect(() => {
        onViolationRef.current = onViolation;
        onWarningRef.current = onWarning;
    }, [onViolation, onWarning]);

    const lastVisibilityChangeRef = useRef<number>(0);
    const DEBOUNCE_MS = 500; // Debounce to prevent double-counting

    // Tab visibility detection
    useEffect(() => {
        if (!status.isActive) return;

        const handleVisibilityChange = () => {
            const now = Date.now();
            // Debounce: ignore if last change was less than 500ms ago
            if (now - lastVisibilityChangeRef.current < DEBOUNCE_MS) {
                return;
            }
            lastVisibilityChangeRef.current = now;
            const isVisible = !document.hidden;

            if (!isVisible) {
                setStatus(prev => {
                    const newViolations = prev.violations + 1;
                    const warning = `Tab switch detected (${newViolations}/${maxViolations})`;

                    if (onViolationRef.current) onViolationRef.current('tab');
                    if (onWarningRef.current) onWarningRef.current(warning);

                    return {
                        ...prev,
                        tabFocused: false,
                        violations: newViolations,
                        warnings: [...prev.warnings, warning]
                    };
                });
            } else {
                setStatus(prev => ({
                    ...prev,
                    tabFocused: true
                }));
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [status.isActive, maxViolations]);

    // Start anti-cheat system
    const start = useCallback(async () => {
        setStatus(prev => ({
            ...prev,
            isActive: true,
            violations: 0,
            warnings: []
        }));
    }, []);

    // Stop anti-cheat system
    const stop = useCallback(() => {
        setStatus(prev => {
            // Only update if actually active to prevent redundant updates
            if (!prev.isActive) return prev;

            return {
                ...prev,
                isActive: false
            };
        });
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            // Cleanup is handled automatically by stop()
        };
    }, []);

    return {
        status,
        start,
        stop,
        isBlocked: status.violations >= maxViolations
    };
}
