"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";

export interface Agent {
    id: string;
    email: string;
    password?: string;
    lastName: string;
    firstName: string;
    avatarUrl?: string; // Base64 or URL
    name: string; // Display Name (Combined)
}

export function useAgents() {
    const [agents, setAgents] = useState<Agent[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = collection(db, "users");
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedAgents: Agent[] = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    email: data.email || "",
                    lastName: data.lastName || "",
                    firstName: data.firstName || "",
                    name: data.name || (data.lastName && data.firstName ? `${data.lastName} ${data.firstName}` : "Unknown"),
                    avatarUrl: data.avatarUrl,
                };
            });
            setAgents(fetchedAgents);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const updateAgents = async () => {
        // No-op for now as we don't batch update users from settings anymore
        // Individual user updates happen via ProfileSetupModal or (future) Profile Page
        console.warn("updateAgents is deprecated in favor of individual user profile updates");
    };

    const getAgentName = (id: string) => agents.find(a => a.id === id)?.name || id;

    return {
        agents,
        loading,
        updateAgents,
        getAgentName
    };
}
