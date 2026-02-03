"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Activity, ActivityType } from "@/types/lead";
import { doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";

interface ActivityInputModalProps {
    isOpen: boolean;
    onClose: () => void;
    leadId: string;
    initialData?: Activity | null; // For editing
}

const ACTIVITY_TYPES: { type: ActivityType; label: string }[] = [
    { type: "Call", label: "電話 (Call)" },
    { type: "Email", label: "メール (Email)" },
    { type: "Meeting", label: "面談 (Meeting)" },
    { type: "Visit", label: "訪問 (Visit)" },
    { type: "Note", label: "メモ (Note)" },
];

export function ActivityInputModal({ isOpen, onClose, leadId, initialData }: ActivityInputModalProps) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);

    // Form State
    const [type, setType] = useState<ActivityType>("Call");
    const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 16));
    const [content, setContent] = useState("");

    const formatDateTimeLocal = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    // Initialize form when opening for edit
    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setType(initialData.type);
                // Convert ISO string to YYYY-MM-DDTHH:mm
                const d = new Date(initialData.timestamp);
                setDate(formatDateTimeLocal(d));
                setContent(initialData.content);
            } else {
                // Reset for new entry
                setType("Call");
                setDate(formatDateTimeLocal(new Date()));
                setContent("");
            }
        }
    }, [isOpen, initialData]);

    const handleSave = async () => {
        if (!content.trim()) return;

        setLoading(true);
        try {
            const leadRef = doc(db, "leads", leadId);

            if (initialData) {
                // UPDATE logic: We need to pull array, find item, replace it, save back.
                // Safer approach: Read -> Modify -> Write

                const docSnap = await getDoc(leadRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    const activities = data.activities as Activity[] || [];

                    const updatedActivities = activities.map(a =>
                        a.id === initialData.id
                            ? { ...a, type, timestamp: new Date(date).toISOString(), content, agentId: user?.uid, agentName: user?.displayName || user?.email || "Unknown Agent" }
                            : a
                    );

                    await updateDoc(leadRef, {
                        activities: updatedActivities,
                        updatedAt: new Date().toISOString()
                    });
                }

            } else {
                // CREATE Logic
                const newActivity = {
                    id: crypto.randomUUID(),
                    type,
                    timestamp: new Date(date).toISOString(),
                    content,
                    agentId: user?.uid,
                    agentName: user?.displayName || user?.email || "Unknown Agent"
                };

                await updateDoc(leadRef, {
                    activities: arrayUnion(newActivity),
                    updatedAt: new Date().toISOString()
                });
            }

            onClose();
        } catch (error) {
            console.error("Failed to save activity", error);
            alert("保存に失敗しました。");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{initialData ? "営業記録を編集" : "営業記録を追加"}</DialogTitle>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    <div className="grid gap-2">
                        <Label>活動タイプ</Label>
                        <Select value={type} onValueChange={(v) => setType(v as ActivityType)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {ACTIVITY_TYPES.map((t) => (
                                    <SelectItem key={t.type} value={t.type}>
                                        {t.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label>日時</Label>
                        <Input
                            type="datetime-local"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label>内容</Label>
                        <Textarea
                            placeholder="活動内容を入力してください..."
                            className="h-32 resize-none"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={loading}>キャンセル</Button>
                    <Button onClick={handleSave} disabled={loading || !content.trim()}>
                        {loading ? "保存中..." : initialData ? "更新する" : "保存する"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
