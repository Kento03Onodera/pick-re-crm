"use client";

import { useState, useEffect } from "react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useStatuses } from "@/hooks/use-statuses";
import { StatusConfig } from "@/types/lead";
import { Loader2, Save, RotateCcw } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function SettingsStatusPage() {
    const { statuses, loading, updateStatuses } = useStatuses();
    const [config, setConfig] = useState<StatusConfig[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        if (!loading && statuses.length > 0) {
            setConfig(statuses);
        }
    }, [statuses, loading]);

    const handleChange = (id: string, field: 'label' | 'color', value: string) => {
        setConfig(prev => prev.map(item =>
            item.id === id ? { ...item, [field]: value } : item
        ));
        setHasChanges(true);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updateStatuses(config);
            setHasChanges(false);
        } catch (error) {
            console.error("Failed to save", error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleReset = () => {
        setConfig(statuses);
        setHasChanges(false);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="animate-spin text-slate-400" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">ステータス設定</h1>
                <p className="text-muted-foreground mt-2">
                    各ステータスの表示名と色をカスタマイズできます。
                </p>
            </div>

            <Separator />

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">ステータス一覧</CardTitle>
                    <CardDescription>
                        ドラッグ＆ドロップで並び替えはできませんが、表示順（Order）は固定です。<br />
                        ※システム内部IDは変更されません。
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid gap-4">
                        {config.sort((a, b) => a.order - b.order).map((item) => (
                            <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg bg-white shadow-sm">

                                {/* Color Picker */}
                                <div className="flex flex-col gap-1.5 shrink-0">
                                    <span className="text-xs font-medium text-slate-500">色</span>
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="w-10 h-10 rounded-md border shadow-sm"
                                            style={{ backgroundColor: item.color }}
                                        />
                                        <Input
                                            type="color"
                                            value={item.color}
                                            onChange={(e) => handleChange(item.id, 'color', e.target.value)}
                                            className="w-12 p-1 h-10 cursor-pointer"
                                        />
                                    </div>
                                </div>

                                {/* Label Input */}
                                <div className="flex-1 flex flex-col gap-1.5">
                                    <span className="text-xs font-medium text-slate-500">表示名 (システムID: {item.id})</span>
                                    <Input
                                        value={item.label}
                                        onChange={(e) => handleChange(item.id, 'label', e.target.value)}
                                        className="font-medium"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    <Separator />

                    <div className="flex justify-end gap-3">
                        {hasChanges && (
                            <Button variant="ghost" onClick={handleReset} disabled={isSaving}>
                                <RotateCcw className="w-4 h-4 mr-2" />
                                元に戻す
                            </Button>
                        )}
                        <Button onClick={handleSave} disabled={!hasChanges || isSaving}>
                            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                            設定を保存
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
