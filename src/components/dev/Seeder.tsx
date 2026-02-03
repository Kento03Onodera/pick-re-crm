"use client";

import { useState } from "react";
import { db } from "@/lib/firebase";
import { writeBatch, doc } from "firebase/firestore";
import { MOCK_LEADS } from "@/utils/calculations";
import { Button } from "@/components/ui/button";
import { Database } from "lucide-react";

export function Seeder() {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const seedData = async () => {
        if (!confirm("Are you sure you want to seed the database? This might create duplicates if run multiple times.")) return;

        setLoading(true);
        setSuccess(false);

        try {
            const batch = writeBatch(db);

            MOCK_LEADS.forEach((lead) => {
                // Use strict IDs from mock data for this updated seed to prevent endless duplicates if reseeding
                // Or just generate new ones. Let's use MOCK IDs so we can re-seed cleanly if data is cleared.
                const docRef = doc(db, "leads", lead.id);
                batch.set(docRef, lead);
            });

            await batch.commit();
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (error) {
            console.error("Error seeding data:", error);
            alert("Failed to seed data. Check console.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button
            onClick={seedData}
            disabled={loading}
            variant="outline"
            size="sm"
            className="fixed bottom-4 right-4 z-50 gap-2 shadow-lg"
        >
            <Database className="w-4 h-4" />
            {loading ? "Seeding..." : success ? "Seeded!" : "Seed Data (v2)"}
        </Button>
    );
}
