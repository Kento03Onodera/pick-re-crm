"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Lead } from "@/types/lead";
import { KanbanBoard } from "@/components/kanban/KanbanBoard";
import { Header } from "@/components/layout/Header";
import { Seeder } from "@/components/dev/Seeder";
import { LeadRegistrationModal } from "@/components/leads/LeadRegistrationModal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Filter, Plus, Search } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useAgents } from "@/hooks/use-agents";

export default function LeadsPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [leads, setLeads] = useState<Lead[]>([]);
    const [dataLoading, setDataLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'status' | 'priority'>('status');

    // Search & Filter State
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTags, setActiveTags] = useState<string[]>([]);
    const [activeAgentIds, setActiveAgentIds] = useState<string[]>([]);

    const { agents } = useAgents();

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
        }
    }, [user, loading, router]);

    useEffect(() => {
        if (!user) return;

        // Listen to real-time updates
        const q = query(collection(db, "leads"), orderBy("updatedAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedLeads: Lead[] = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Lead[];
            setLeads(fetchedLeads);
            setDataLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    // Derived Data
    const allTags = Array.from(new Set(leads.flatMap(l => l.tags || [])));

    const filteredLeads = leads.filter(lead => {
        // Name Search
        if (searchQuery && !lead.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        // Tag Filter (OR logic: show if has ANY of active tags)
        if (activeTags.length > 0 && !activeTags.some(tag => lead.tags?.includes(tag))) return false;
        // Agent Filter (OR logic)
        if (activeAgentIds.length > 0 && !activeAgentIds.includes(lead.agentId || "")) return false;
        return true;
    });

    if (loading || (!user && loading)) {
        return <div className="flex h-screen items-center justify-center">Loading...</div>;
    }

    if (!user) return null;

    return (
        <div className="flex flex-col h-screen bg-muted/40 overflow-hidden">
            <Header />

            {/* Page Header (Figma Design) */}
            <div className="bg-white border-b px-6 py-4">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">顧客一覧</h1>
                        <p className="text-sm text-slate-500 mt-1">全 {leads.length} 件の顧客 (表示: {filteredLeads.length}件)</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className={cn("gap-2", (activeTags.length > 0 || activeAgentIds.length > 0) && "border-blue-500 text-blue-600 bg-blue-50")}>
                                    <Filter className="w-4 h-4" />
                                    フィルター
                                    {(activeTags.length > 0 || activeAgentIds.length > 0) && (
                                        <span className="bg-blue-600 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full ml-1">
                                            {activeTags.length + activeAgentIds.length}
                                        </span>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80 p-0" align="end">
                                <div className="p-4 border-b">
                                    <h4 className="font-medium leading-none mb-3">絞り込み</h4>
                                </div>
                                <div className="p-4 space-y-6 max-h-[400px] overflow-y-auto">
                                    {/* Tags Filter */}
                                    <div className="space-y-3">
                                        <h5 className="text-sm font-medium text-muted-foreground">タグ</h5>
                                        {allTags.length === 0 ? (
                                            <p className="text-xs text-muted-foreground italic">タグがありません</p>
                                        ) : (
                                            <div className="grid gap-2">
                                                {allTags.map(tag => (
                                                    <div key={tag} className="flex items-center gap-2">
                                                        <Checkbox
                                                            id={`tag-${tag}`}
                                                            checked={activeTags.includes(tag)}
                                                            onCheckedChange={(checked) => {
                                                                if (checked) setActiveTags([...activeTags, tag]);
                                                                else setActiveTags(activeTags.filter(t => t !== tag));
                                                            }}
                                                        />
                                                        <Label htmlFor={`tag-${tag}`} className="text-sm font-normal cursor-pointer flex-1">
                                                            {tag}
                                                        </Label>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Agents Filter */}
                                    <div className="space-y-3">
                                        <h5 className="text-sm font-medium text-muted-foreground">担当者</h5>
                                        {agents.length === 0 ? (
                                            <p className="text-xs text-muted-foreground italic">担当者が設定されていません</p>
                                        ) : (
                                            <div className="grid gap-2">
                                                {agents.map(agent => (
                                                    <div key={agent.id} className="flex items-center gap-2">
                                                        <Checkbox
                                                            id={`agent-${agent.id}`}
                                                            checked={activeAgentIds.includes(agent.id)}
                                                            onCheckedChange={(checked) => {
                                                                if (checked) setActiveAgentIds([...activeAgentIds, agent.id]);
                                                                else setActiveAgentIds(activeAgentIds.filter(id => id !== agent.id));
                                                            }}
                                                        />
                                                        <Label htmlFor={`agent-${agent.id}`} className="text-sm font-normal cursor-pointer flex-1">
                                                            {agent.name}
                                                        </Label>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {(activeTags.length > 0 || activeAgentIds.length > 0) && (
                                    <div className="p-2 border-t bg-muted/20">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="w-full text-xs"
                                            onClick={() => {
                                                setActiveTags([]);
                                                setActiveAgentIds([]);
                                            }}
                                        >
                                            フィルターをクリア
                                        </Button>
                                    </div>
                                )}
                            </PopoverContent>
                        </Popover>
                        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'status' | 'priority')} className="w-[200px]">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="status">Status</TabsTrigger>
                                <TabsTrigger value="priority">Priority</TabsTrigger>
                            </TabsList>
                        </Tabs>
                        <LeadRegistrationModal
                            trigger={
                                <Button className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
                                    <Plus className="w-4 h-4" />
                                    新規顧客
                                </Button>
                            }
                        />
                    </div>
                </div>
                {/* Search Bar */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                        placeholder="顧客名で検索..."
                        className="pl-9 bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Kanban Board Area */}
            <main className="flex-1 overflow-x-auto overflow-y-hidden p-6 bg-slate-50">
                {dataLoading ? (
                    <div className="flex h-full items-center justify-center text-muted-foreground">読み込み中...</div>
                ) : (
                    <KanbanBoard initialLeads={filteredLeads} groupBy={viewMode} />
                )}
            </main>

            <Seeder />
        </div>
    );
}
