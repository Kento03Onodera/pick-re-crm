"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Lead } from "@/types/lead";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { calculateEstimatedRevenue } from "@/utils/calculations";
import { User, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";

import { useRouter } from "next/navigation";

interface LeadCardProps {
    lead: Lead;
}

export function LeadCard({ lead }: LeadCardProps) {
    const router = useRouter();
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: lead.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const revenue = calculateEstimatedRevenue(lead);
    const revenueFmt = new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY', maximumFractionDigits: 0 }).format(revenue);
    const budgetFmt = new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY', maximumFractionDigits: 0 }).format(lead.budget);

    // Priority Colors
    const priorityColor = {
        High: "bg-red-100 text-red-800 border-red-200",
        Mid: "bg-yellow-100 text-yellow-800 border-yellow-200",
        Low: "bg-gray-100 text-gray-800 border-gray-200",
    }[lead.priority] || "bg-gray-100";

    const handleClick = () => {
        router.push(`/leads/${lead.id}`);
    };

    const handleDelete = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm("本当にこの顧客を削除しますか？")) {
            await deleteDoc(doc(db, "leads", lead.id));
        }
    };

    const priorityLabels: Record<string, string> = {
        High: "高",
        Mid: "中",
        Low: "低"
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="mb-3 touch-none">
            <Card
                className="cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow hover:ring-2 hover:ring-primary/20 group"
                onClick={handleClick}
            >
                <CardHeader className="p-4 pb-2 space-y-0 relative">
                    <div className="flex justify-between items-start mb-2">
                        <Badge variant="outline" className={cn("font-normal border-0 px-2 py-0.5", priorityColor)}>
                            {priorityLabels[lead.priority] || lead.priority}
                        </Badge>
                    </div>

                    {/* Delete Button (Visible on Hover) */}
                    <button
                        onClick={handleDelete}
                        className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        title="削除"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>

                    <h3 className="font-bold text-base leading-tight pr-4">{lead.name}</h3>
                    {lead.familyStructure && <p className="text-xs text-muted-foreground mt-1">{lead.familyStructure}</p>}
                </CardHeader>
                <CardContent className="p-4 pt-2 pb-3">
                    <div className="flex flex-wrap gap-1 mb-3">
                        {lead.tags?.map(tag => (
                            <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0 h-5">
                                {tag}
                            </Badge>
                        ))}
                    </div>

                    <div className="space-y-1 text-sm">
                        <div className="flex items-center text-muted-foreground">
                            <span className="text-xs">予算:</span>
                            <span className="ml-auto font-medium text-foreground">{budgetFmt}</span>
                        </div>
                        {/* Area Removed */}
                        <div className="border-t pt-2 mt-2 flex items-center justify-between font-semibold text-primary">
                            <span className="text-xs">想定収益</span>
                            <span>{revenueFmt}</span>
                        </div>
                    </div>
                </CardContent>
                {lead.agentName && (
                    <CardFooter className="p-3 pt-0 flex justify-end">
                        <div className="flex items-center text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-full">
                            <User className="w-3 h-3 mr-1" />
                            {lead.agentName}
                        </div>
                    </CardFooter>
                )}
            </Card>
        </div>
    );
}
