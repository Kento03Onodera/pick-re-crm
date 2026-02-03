"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Loader2, Edit } from "lucide-react";

interface TargetEditModalProps {
    currentYear: string;
    trigger?: React.ReactNode;
    onUpdate?: () => void;
}

export function TargetEditModal({ currentYear, trigger, onUpdate }: TargetEditModalProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [targets, setTargets] = useState<Record<string, number>>({});

    // Month labels 1-12
    const months = Array.from({ length: 12 }, (_, i) => i + 1);

    useEffect(() => {
        const fetchTargets = async () => {
            setLoading(true);
            try {
                const docRef = doc(db, "settings", "targets");
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    const yearData = data[currentYear] || {};
                    setTargets(yearData);
                } else {
                    setTargets({});
                }
            } catch (error) {
                console.error("Error fetching targets:", error);
            } finally {
                setLoading(false);
            }
        };

        if (open) {
            fetchTargets();
        }
    }, [open, currentYear]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const docRef = doc(db, "settings", "targets");
            // Merge with existing data ideally, but verify if we overwrite other years.
            // setDoc with merge: true merges top level fields. 
            // We need to be careful not to wipe other years if we just send { [currentYear]: ... }
            // So we use setDoc({ [currentYear]: targets }, { merge: true })

            await setDoc(docRef, {
                [currentYear]: targets
            }, { merge: true });

            setOpen(false);
            if (onUpdate) onUpdate();
        } catch (error) {
            console.error("Error saving targets:", error);
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (month: number, value: string) => {
        const numVal = parseInt(value.replace(/,/g, ""), 10) || 0;
        setTargets(prev => ({
            ...prev,
            [month]: numVal
        }));
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger ? trigger : (
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                        <Edit className="h-3 w-3" />
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{currentYear}年 目標設定</DialogTitle>
                    <DialogDescription>月ごとの売上目標金額を設定してください。</DialogDescription>
                </DialogHeader>

                {loading ? (
                    <div className="flex justify-center p-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <div className="grid gap-4 py-4">
                        {months.map(month => (
                            <div key={month} className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor={`m-${month}`} className="text-right col-span-1">
                                    {month}月
                                </Label>
                                <Input
                                    id={`m-${month}`}
                                    type="number"
                                    className="col-span-3"
                                    value={targets[month] || 0}
                                    onChange={(e) => handleChange(month, e.target.value)}
                                />
                            </div>
                        ))}
                        <div className="pt-4 border-t flex justify-between items-center font-bold">
                            <span>年間合計</span>
                            <span>
                                {new Intl.NumberFormat('ja-JP').format(
                                    Math.floor(Object.values(targets).reduce((a, b) => a + b, 0) / 10000)
                                )}万円
                            </span>
                        </div>
                    </div>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>キャンセル</Button>
                    <Button onClick={handleSave} disabled={saving}>
                        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        保存
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
