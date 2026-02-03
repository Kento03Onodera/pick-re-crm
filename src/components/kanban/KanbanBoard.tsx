"use client";

import { useState, useEffect } from "react";
import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragStartEvent,
    DragEndEvent
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { Lead, LeadStatus } from "@/types/lead";
import { KanbanColumn } from "./KanbanColumn";
import { LeadCard } from "./LeadCard";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useStatuses } from "@/hooks/use-statuses";

interface KanbanBoardProps {
    initialLeads: Lead[];
    groupBy: 'status' | 'priority';
}

const PRIORITY_COLUMNS = [
    { id: 'High', label: '高', color: '#ef4444', order: 1 },
    { id: 'Mid', label: '中', color: '#eab308', order: 2 },
    { id: 'Low', label: '低', color: '#64748b', order: 3 },
];

export function KanbanBoard({ initialLeads, groupBy }: KanbanBoardProps) {
    const [leads, setLeads] = useState<Lead[]>(initialLeads);
    const [activeId, setActiveId] = useState<string | null>(null);
    const { statuses, loading } = useStatuses();

    // Update local state when initialLeads changes (from Firestore)
    useEffect(() => {
        setLeads(initialLeads);
    }, [initialLeads]);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), // Prevent accidental drags
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragOver = () => {
        // Only handling vertical sort in columns for now, simple implementation
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over) {
            setActiveId(null);
            return;
        }

        const activeId = active.id as string;
        const activeLead = leads.find(l => l.id === activeId);

        // Check dynamically against current columns based on groupBy
        const isPriority = groupBy === 'priority';
        const targetColumns = isPriority ? PRIORITY_COLUMNS : statuses;

        // Determine new group ID (Status or Priority)
        let newGroupId: string | undefined;

        if (targetColumns.some(c => c.id === over.id)) {
            newGroupId = over.id as string;
        } else {
            // Dropped on another card? Use that card's group
            const overLead = leads.find(l => l.id === over.id);
            if (overLead) {
                newGroupId = isPriority ? overLead.priority : overLead.status;
            }
        }

        if (activeLead && newGroupId) {
            const currentGroupId = isPriority ? activeLead.priority : activeLead.status;

            if (currentGroupId !== newGroupId) {
                // Optimistic Update
                setLeads(leads.map(lead =>
                    lead.id === activeId ? {
                        ...lead,
                        [isPriority ? 'priority' : 'status']: newGroupId,
                        updatedAt: new Date().toISOString()
                    } : lead
                ));

                // Firestore Update
                try {
                    await updateDoc(doc(db, "leads", activeId), {
                        [isPriority ? 'priority' : 'status']: newGroupId,
                        updatedAt: new Date().toISOString()
                    });
                    console.log(`Updated ${isPriority ? 'priority' : 'status'} for`, activeId, "to", newGroupId);
                } catch (error) {
                    console.error("Failed to update status:", error);
                }
            }
        }

        setActiveId(null);
    };

    const activeLead = activeId ? leads.find(l => l.id === activeId) : null;

    // Determine columns to render
    const columns = groupBy === 'priority'
        ? PRIORITY_COLUMNS
        : [...statuses].sort((a, b) => a.order - b.order);

    if (loading && groupBy === 'status') return <div>Loading board...</div>;

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
        >
            <div className="flex h-full gap-4 overflow-x-auto pb-4 items-start">
                {columns.map((col) => (
                    <KanbanColumn
                        key={col.id}
                        id={col.id}
                        label={col.label}
                        color={col.color}
                        leads={leads.filter((lead) =>
                            groupBy === 'priority'
                                ? lead.priority === col.id
                                : lead.status === col.id
                        )}
                    />
                ))}
            </div>

            <DragOverlay>
                {activeLead ? <LeadCard lead={activeLead} /> : null}
            </DragOverlay>
        </DndContext>
    );
}
