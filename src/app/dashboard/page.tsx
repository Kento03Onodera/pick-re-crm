"use client";

import { useEffect, useState, useMemo } from "react";
import { collection, onSnapshot, query, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Lead } from "@/types/lead";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { calculateMetrics, calculatePipelineData, getRecentWins } from "@/lib/dashboard-utils";
import { calculateEstimatedRevenue } from "@/utils/calculations";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ArrowUpRight, ArrowDownRight, Trophy, TrendingUp, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { TargetEditModal } from "@/components/dashboard/TargetEditModal";
import { useStatuses } from "@/hooks/use-statuses";

// Custom Tooltip for Recharts
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload, label, getStatusLabel }: { active?: boolean; payload?: any[]; label?: string; getStatusLabel?: (id: string) => string }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white border rounded-lg shadow-lg p-3 text-xs">
                <p className="font-bold mb-2">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center gap-2 mb-1" style={{ color: entry.color }}>
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                        <span className="capitalize">{getStatusLabel ? getStatusLabel(entry.name) : entry.name}:</span>
                        <span className="font-mono">
                            {typeof entry.value === 'number' && entry.value > 10000
                                ? `${Math.floor(entry.value / 10000).toLocaleString()}万円`
                                : entry.value}
                        </span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

export default function DashboardPage() {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [targets, setTargets] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);
    const [chartMode, setChartMode] = useState<'amount' | 'count'>('amount');
    const { statuses, getStatusLabel } = useStatuses();

    const currentYear = String(new Date().getFullYear());

    // Fetch Leads (Real-time)
    useEffect(() => {
        const q = query(collection(db, "leads"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedLeads: Lead[] = [];
            snapshot.forEach((doc) => {
                fetchedLeads.push({ id: doc.id, ...doc.data() } as Lead);
            });
            setLeads(fetchedLeads);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Fetch Targets (Real-time listener for settings/targets)
    useEffect(() => {
        const docRef = doc(db, "settings", "targets");
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setTargets(data[currentYear] || {});
            } else {
                setTargets({});
            }
        });
        return () => unsubscribe();
    }, [currentYear]);

    // Derived State
    const metrics = useMemo(() => calculateMetrics(leads, targets), [leads, targets]);
    const pipelineData = useMemo(() => calculatePipelineData(leads, chartMode), [leads, chartMode]);
    const recentWins = useMemo(() => getRecentWins(leads), [leads]);

    // Formatters
    const currencyFmt = (val: number) => {
        const manYen = Math.floor(val / 10000);
        return `${manYen.toLocaleString()}万円`;
    };

    return (
        <div className="flex flex-col min-h-screen bg-slate-50">
            <Header />

            <main className="flex-1 p-6 space-y-6 max-w-[1600px] mx-auto w-full">

                {/* 1. Key Metrics Panel */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                    {/* Card 1: Monthly Target */}
                    <Card className="shadow-sm border-slate-200">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <p className="text-sm font-medium text-slate-500">今月目標</p>
                                <div className="flex items-center gap-2">
                                    <TargetEditModal currentYear={currentYear} />
                                    <div className="p-2 rounded-full bg-blue-50">
                                        <TrendingUp className="w-4 h-4 text-blue-500" />
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-baseline gap-2 mb-1">
                                <h3 className="text-2xl font-bold text-slate-900">{currencyFmt(metrics.currentMonthTarget)}</h3>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className={cn(
                                    "flex items-center text-xs font-medium px-1.5 py-0.5 rounded-full",
                                    metrics.momRevenue >= 0 ? "text-emerald-700 bg-emerald-50" : "text-red-700 bg-red-50"
                                )}>
                                    {metrics.momRevenue >= 0 ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                                    前月比 {metrics.momRevenue.toFixed(1)}%
                                </span>
                                <span className="text-xs text-slate-500">
                                    達成率:
                                    <span className="font-bold ml-1 text-slate-700">{metrics.achievementRate.toFixed(1)}%</span>
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Card 2: Monthly Forecast */}
                    <Card className="shadow-sm border-slate-200">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <p className="text-sm font-medium text-slate-500">今月売り上げ見込み</p>
                                <div className="p-2 rounded-full bg-green-50">
                                    <DollarSign className="w-4 h-4 text-green-500" />
                                </div>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-2xl font-bold text-slate-900">{currencyFmt(metrics.currentMonthForecast)}</h3>
                            </div>
                            <div className="mt-2 space-y-1">
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-500">成約済み</span>
                                    <span className="font-medium text-slate-700">{currencyFmt(metrics.currentMonthClosed)}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-500">見込み (パイプライン)</span>
                                    <span className="font-medium text-slate-700">{currencyFmt(metrics.currentMonthExpected)}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Card 3: Total Revenue */}
                    <Card className="shadow-sm border-slate-200">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <p className="text-sm font-medium text-slate-500">売り上げ合計 (年間)</p>
                                <div className="p-2 rounded-full bg-orange-50">
                                    <Trophy className="w-4 h-4 text-orange-500" />
                                </div>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-2xl font-bold text-slate-900">{currencyFmt(metrics.yearTotalRevenue)}</h3>
                            </div>
                            <div className="mt-2 flex justify-between text-xs border-t pt-2">
                                <span className="text-slate-500">年間目標</span>
                                <span className="font-medium text-slate-700">{currencyFmt(metrics.yearTotalTarget)}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[500px]">
                    {/* 2. Interactive Pipeline (Chart) */}
                    <Card className="col-span-1 lg:col-span-2 shadow-sm border-slate-200">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <div>
                                <CardTitle className="text-lg text-slate-800">パイプライン状況</CardTitle>
                                <CardDescription>エージェントごとの案件進捗状況</CardDescription>
                            </div>
                            <div className="flex bg-slate-100 p-1 rounded-lg">
                                <button
                                    onClick={() => setChartMode('amount')}
                                    className={cn("px-3 py-1 text-xs font-medium rounded-md transition-all", chartMode === 'amount' ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700")}
                                >
                                    金額
                                </button>
                                <button
                                    onClick={() => setChartMode('count')}
                                    className={cn("px-3 py-1 text-xs font-medium rounded-md transition-all", chartMode === 'count' ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700")}
                                >
                                    件数
                                </button>
                            </div>
                        </CardHeader>
                        <CardContent className="h-[400px]">
                            {loading ? (
                                <div className="h-full flex items-center justify-center text-muted-foreground">読み込み中...</div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={pipelineData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 11, fill: '#64748b' }}
                                            tickFormatter={(val) => chartMode === 'amount' ? `¥${val / 10000}万` : val}
                                        />
                                        <Tooltip content={<CustomTooltip getStatusLabel={getStatusLabel} />} cursor={{ fill: 'transparent' }} />
                                        <Legend wrapperStyle={{ paddingTop: '20px' }} />

                                        {/* Dynamic Bars for each status based on config order */}
                                        {statuses.map((status) => (
                                            <Bar
                                                key={status.id}
                                                dataKey={status.id}
                                                name={status.label}
                                                stackId="a"
                                                fill={status.color}
                                                radius={status.id === 'New' ? [4, 4, 0, 0] : (status.id === 'Closed' ? [0, 0, 4, 4] : undefined)}
                                            />
                                        ))}
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>

                    {/* 3. Motivation Feed (Recent Wins) */}
                    <Card className="col-span-1 shadow-sm border-slate-200 flex flex-col">
                        <CardHeader className="pb-3 border-b border-slate-100">
                            <CardTitle className="flex items-center gap-2 text-lg text-slate-800">
                                <Trophy className="w-5 h-5 text-yellow-500" />
                                Recent Wins
                            </CardTitle>
                            <CardDescription>直近の成約実績</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-y-auto p-0">
                            {loading ? (
                                <div className="p-4 text-center text-sm text-muted-foreground">読み込み中...</div>
                            ) : recentWins.length === 0 ? (
                                <div className="p-8 text-center text-muted-foreground text-sm">
                                    まだ成約データがありません。<br />頑張りましょう！
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-100">
                                    {recentWins.map((lead) => (
                                        <div key={lead.id} className="p-4 hover:bg-slate-50 transition-colors flex items-start gap-4 animate-in fade-in slide-in-from-right-4 duration-500">
                                            <div className="bg-yellow-100 p-2 rounded-full text-yellow-600 shrink-0">
                                                <Trophy className="w-4 h-4" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-slate-900 truncate">
                                                    {lead.agentName || "担当者不明"} が契約しました！🎉
                                                </p>
                                                <p className="text-xs text-slate-500 mt-1">
                                                    顧客: {lead.name} 様
                                                </p>
                                                <p className="text-xs font-semibold text-emerald-600 mt-1">
                                                    想定収益: {Math.floor(calculateEstimatedRevenue(lead) / 10000).toLocaleString()}万円
                                                </p>
                                            </div>
                                            <div className="text-[10px] text-slate-400 whitespace-nowrap">
                                                {new Date(lead.updatedAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                        <div className="p-3 border-t border-slate-100 bg-slate-50/50 text-center">
                            <Button variant="link" size="sm" className="text-xs text-slate-500 h-auto p-0">すべて表示</Button>
                        </div>
                    </Card>
                </div>

            </main>
        </div>
    );
}
