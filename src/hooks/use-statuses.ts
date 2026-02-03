"use client";

import { useState, useEffect } from "react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { StatusConfig, DEFAULT_STATUS_CONFIG, LeadStatus } from "@/types/lead";

export function useStatuses() {
    const [statuses, setStatuses] = useState<StatusConfig[]>(DEFAULT_STATUS_CONFIG);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const docRef = doc(db, "settings", "statuses");
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.config && Array.isArray(data.config)) {
                    setStatuses(data.config);
                }
            } else {
                // Seed if empty (Plan said fetch/seed, but safer to just use default and let UI save it later)
                // Or auto-seed here? Let's just default to local constant if DB empty.
                setStatuses(DEFAULT_STATUS_CONFIG);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Helper to update statuses
    const updateStatuses = async (newConfig: StatusConfig[]) => {
        const docRef = doc(db, "settings", "statuses");
        await setDoc(docRef, { config: newConfig }, { merge: true });
    };

    // Derived helpers
    const getStatusLabel = (id: string) => statuses.find(s => s.id === id)?.label || id;
    const getStatusColor = (id: string) => statuses.find(s => s.id === id)?.color || "#000000";

    return {
        statuses,
        loading,
        updateStatuses,
        getStatusLabel,
        getStatusColor
    };
}
