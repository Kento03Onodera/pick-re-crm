"use client";

import { KPICard } from "@/components/dashboard/kpi-card";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { calculateEstimatedRevenue, Lead } from "@/utils/calculations";
import { DollarSign, Users, Activity, CreditCard } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Seeder } from "@/components/dev/Seeder";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Header } from "@/components/layout/Header";

export default function Dashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // Real-time Firestore Listener
  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, "leads"), orderBy("updatedAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedLeads: Lead[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Lead[];
      setLeads(fetchedLeads);
    });

    return () => unsubscribe();
  }, [user]);

  if (loading || (!user && loading)) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  if (!user) return null; // Should redirect

  // 1. Calculate Aggregated Metrics
  const totalLeads = leads.length;
  // Note: Status checks must match string case in LeadStatus type (Capitalized)
  const closedLeads = leads.filter(l => l.status === 'Closed').length;
  const activeLeads = leads.filter(l => l.status !== 'Closed').length;

  const totalRevenue = leads.reduce((acc, lead) => acc + calculateEstimatedRevenue(lead), 0);
  const totalRevenueFmt = new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(totalRevenue);

  // 2. Prepare Chart Data (Group by Status)
  const revenueByStatus = leads.reduce((acc, lead) => {
    const revenue = calculateEstimatedRevenue(lead);
    const existing = acc.find(item => item.name === lead.status);
    if (existing) {
      existing.total += revenue;
    } else {
      acc.push({ name: lead.status, total: revenue });
    }
    return acc;
  }, [] as { name: string; total: number }[]);

  return (
    <div className="flex min-h-screen flex-col bg-muted/40 pb-8 space-y-8">
      <Header />

      <div className="px-8 space-y-8">
        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <KPICard
            title="Total Estimated Revenue"
            value={totalRevenueFmt}
            subValue="Real-time Proj."
            icon={DollarSign}
          />
          <KPICard
            title="Total Leads"
            value={totalLeads}
            subValue="All time"
            icon={Users}
          />
          <KPICard
            title="Active Leads"
            value={activeLeads}
            subValue="In pipeline"
            icon={Activity}
          />
          <KPICard
            title="Closed Deals"
            value={closedLeads}
            subValue="Won deals"
            icon={CreditCard}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <RevenueChart data={revenueByStatus} />

          <div className="col-span-3 rounded-xl border bg-card text-card-foreground shadow p-6">
            <h3 className="font-semibold leading-none tracking-tight mb-4">Recent Leads</h3>
            <div className="space-y-4 max-h-[300px] overflow-y-auto">
              {leads.length === 0 && <p className="text-sm text-muted-foreground">No leads found. Use the seed button.</p>}
              {leads.slice(0, 10).map(lead => (
                <div key={lead.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                  <div>
                    <p className="text-sm font-medium">{lead.name}</p>
                    <p className="text-xs text-muted-foreground">{lead.status}</p>
                  </div>
                  <div className="text-sm font-bold">
                    {new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(calculateEstimatedRevenue(lead))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {/* Dev Tool: Seeder */}
      <Seeder />
    </div>
  );
}
