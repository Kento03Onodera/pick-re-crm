"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { doc, onSnapshot } from "firebase/firestore";
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
        if (!user || !leadId) return;

        // setPageLoading(true); // Removed to avoid cascading render warning
        const docRef = doc(db, "leads", leadId);

        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const firestoreData = { id: docSnap.id, ...docSnap.data() } as Lead;

                // Merge with mock if needed (same logic as before)
                const mockLead = MOCK_LEADS.find(l => l.id === leadId);

                if (mockLead) {
                    setLead({
                        ...mockLead,
                        ...firestoreData,
                        // Priority: Firestore updates override Mock
                        // For arrays like activities, we prefer Firestore if available (it might be empty initially)
                        // If Firestore has activities array (even empty), use it. If undefined, use mock.
                        activities: firestoreData.activities !== undefined ? firestoreData.activities : mockLead.activities,
                        inquiredProperties: firestoreData.inquiredProperties !== undefined ? firestoreData.inquiredProperties : mockLead.inquiredProperties,
                    });
                } else {
                    setLead(firestoreData);
                }
                setPageLoading(false);
            } else {
                console.log("No such document!");
                // Fallback to mock
                const mockLead = MOCK_LEADS.find(l => l.id === leadId);
                if (mockLead) setLead(mockLead);
                setPageLoading(false);
            }
        }, (error) => {
            console.error("Error fetching lead:", error);
            setPageLoading(false);
        });

        return () => unsubscribe();
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
                    <ActivityTimeline activities={lead.activities} leadId={lead.id} />
                </div>
            </div>
        </div>
    );
}
