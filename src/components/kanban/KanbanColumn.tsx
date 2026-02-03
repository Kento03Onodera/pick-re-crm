import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Lead, LeadStatus, LEAD_STATUSES } from "@/types/lead";
import { LeadCard } from "./LeadCard";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { LeadRegistrationModal } from "../leads/LeadRegistrationModal";

interface KanbanColumnProps {
    id: string;
    leads: Lead[];
    label: string;
    color: string;
}

export function KanbanColumn({ id, leads, label, color }: KanbanColumnProps) {
    const { setNodeRef } = useDroppable({ id });

    return (
        <div className="flex flex-col h-full min-w-[280px] w-[280px] bg-muted/20 rounded-xl border border-border/50">
            {/* Header */}
            <div className="p-3 border-b border-border/50 flex items-center justify-between bg-muted/30 rounded-t-xl sticky top-0 backdrop-blur-sm z-10" style={{ borderTop: `4px solid ${color}` }}>
                <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm">{label}</h3>
                    <span className="flex items-center justify-center bg-background border px-2 py-0.5 rounded-full text-xs font-medium text-muted-foreground">
                        {leads.length}
                    </span>
                </div>
                <LeadRegistrationModal
                    initialStatus={(LEAD_STATUSES as readonly string[]).includes(id) ? id as LeadStatus : undefined}
                    trigger={
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground">
                            <Plus className="w-4 h-4" />
                        </Button>
                    }
                />
            </div>

            {/* Content */}
            <div ref={setNodeRef} className="flex-1 p-3 overflow-y-auto min-h-[150px]">
                <SortableContext items={leads.map(l => l.id)} strategy={verticalListSortingStrategy}>
                    {leads.map((lead) => (
                        <LeadCard key={lead.id} lead={lead} />
                    ))}
                </SortableContext>

                {leads.length === 0 && (
                    <div className="h-full flex items-center justify-center text-xs text-muted-foreground/50 italic py-8">
                        ここにドロップ
                    </div>
                )}
            </div>
        </div>
    );
}
