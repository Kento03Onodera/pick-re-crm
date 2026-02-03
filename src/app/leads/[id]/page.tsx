"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Lead } from "@/types/lead";
import { MOCK_LEADS } from "@/utils/calculations";
import { LeadDetailHeader } from "@/components/leads/LeadDetailHeader";
import { LeadInfoTabs } from "@/components/leads/LeadInfoTabs";
import { ActivityTimeline } from "@/components/leads/ActivityTimeline";
import { Header } from "@/components/layout/Header";

export default function LeadDetailPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const params = useParams();
    const leadId = params.id as string;

    const [lead, setLead] = useState<Lead | null>(null);
    const [pageLoading, setPageLoading] = useState(true);

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
        }
    }, [user, loading, router]);

    useEffect(() => {
        const fetchLead = async () => {
            if (!user) return;

            try {
                setPageLoading(true);
                // 1. Try to get from Firestore
                const docRef = doc(db, "leads", leadId);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const firestoreData = { id: docSnap.id, ...docSnap.data() } as Lead;

                    // 2. Merge with Mock Data for missing fields (Activities, etc.) if needed
                    // For demo purposes, if ID matches mock, we use mock rich data + firestore status/budget updates
                    const mockLead = MOCK_LEADS.find(l => l.id === leadId);

                    if (mockLead) {
                        // Priority: Firestore (Real data) > Mock (Rich data for demo)
                        // Actually, for this demo, let's trust Mock for the static rich fields (activities)
                        // and Firestore for the dynamic fields (status, budget, etc).
                        setLead({
                            ...mockLead,
                            ...firestoreData, // Overwrite with Firestore status/budget
                            // Ensure rich arrays from mock are preserved if missing in Firestore
                            activities: firestoreData.activities || mockLead.activities,
                            inquiredProperties: firestoreData.inquiredProperties || mockLead.inquiredProperties,
                        });
                    } else {
                        setLead(firestoreData);
                    }
                } else {
                    console.log("No such document!");
                    // Fallback to pure mock if not in Firestore (shouldn't happen if seeded)
                    const mockLead = MOCK_LEADS.find(l => l.id === leadId);
                    if (mockLead) setLead(mockLead);
                }
            } catch (error) {
                console.error("Error fetching lead:", error);
            } finally {
                setPageLoading(false);
            }
        };

        if (user && leadId) {
            fetchLead();
        }
    }, [user, leadId]);

    if (loading || pageLoading) {
        return <div className="flex h-screen items-center justify-center">Loading Lead Data...</div>;
    }

    if (!lead) {
        return (
            <div className="flex flex-col h-screen">
                <Header />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <h2 className="text-xl font-bold mb-2">Customer Not Found</h2>
                        <p className="text-muted-foreground mb-4">指定されたIDの顧客が見つかりませんでした。</p>
                        <button onClick={() => router.push("/leads")} className="text-blue-600 hover:underline">
                            一覧に戻る
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-muted/40 overflow-hidden text-slate-900">
            <Header />

            {/* 2-Column Layout Container */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Top Summary Bar */}
                <LeadDetailHeader lead={lead} />

                {/* Content Area */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Left: Info Tabs (Flexible width) */}
                    <LeadInfoTabs lead={lead} />

                    {/* Right: Activity Timeline (Fixed width) */}
                    <ActivityTimeline activities={lead.activities} />
                </div>
            </div>
        </div>
    );
}
