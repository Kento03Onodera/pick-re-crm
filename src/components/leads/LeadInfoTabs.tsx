"use client";

import { useState } from "react";
import { Lead } from "@/types/lead";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { calculateEstimatedRevenue } from "@/utils/calculations";
import { Textarea } from "@/components/ui/textarea";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface LeadInfoTabsProps {
    lead: Lead;
}

export function LeadInfoTabs({ lead }: LeadInfoTabsProps) {
    const estimatedRevenue = calculateEstimatedRevenue(lead);
    const formattedRevenue = new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(estimatedRevenue);
    const formattedBudget = new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(lead.budget);

    const [memo, setMemo] = useState(lead.memo || "");
    const [saving, setSaving] = useState(false);

    const handleMemoSave = async () => {
        if (memo === lead.memo) return; // No change

        setSaving(true);
        try {
            const docRef = doc(db, "leads", lead.id);
            await updateDoc(docRef, { memo });
            // Ideally we'd show a toast here
            console.log("Memo saved");
        } catch (error) {
            console.error("Error saving memo", error);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="flex-1 p-8 overflow-y-auto bg-gray-50/30">
            <Tabs defaultValue="info" className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-[400px] mb-8">
                    <TabsTrigger value="info">顧客情報</TabsTrigger>
                    <TabsTrigger value="properties">紹介物件</TabsTrigger>
                </TabsList>

                <TabsContent value="info" className="space-y-6 animate-in fade-in-50 duration-300">

                    {/* Section 1: Memo (Replaces Identity) */}
                    <Card>
                        <CardHeader className="pb-3 border-b bg-gray-50/50 rounded-t-xl flex flex-row items-center justify-between">
                            <CardTitle className="text-base font-semibold text-gray-800">メモ (Memo)</CardTitle>
                            {saving && <span className="text-xs text-muted-foreground animate-pulse">保存中...</span>}
                        </CardHeader>
                        <CardContent className="p-6">
                            <Textarea
                                placeholder="顧客に関するメモをここに入力..."
                                className="min-h-[150px] resize-none text-base"
                                value={memo}
                                onChange={(e) => setMemo(e.target.value)}
                                onBlur={handleMemoSave}
                            />
                            <p className="text-xs text-muted-foreground mt-2 text-right">フォーカスを外すと自動保存されます</p>
                        </CardContent>
                    </Card>



                    {/* Section 3: Search Requirements */}
                    <Card>
                        <CardHeader className="pb-3 border-b bg-gray-50/50 rounded-t-xl">
                            <CardTitle className="text-base font-semibold text-gray-800">探索条件 (Requirements)</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 gap-6 p-6">
                            <InfoItem label="予算" value={formattedBudget} />

                            <InfoItem
                                label="見込み収益 (Preview)"
                                value={formattedRevenue}
                                highlight
                                subtext={`※ 予算 × 3% × ${lead.discountRate || 1.0} + 6万円`}
                            />

                            <InfoItem
                                label="検索依頼"
                                value={lead.isSearchRequested ? "依頼あり" : "なし"}
                                highlight={lead.isSearchRequested}
                            />

                            <InfoItem
                                label="検索頻度"
                                value={
                                    lead.searchFrequency === "3days" ? "3日ごと" :
                                        lead.searchFrequency === "1week" ? "1週間ごと" :
                                            lead.searchFrequency === "2week" ? "2週間ごと" : "-"
                                }
                            />

                            <InfoItem
                                label="手数料値引き率"
                                value={lead.discountRate ? `${lead.discountRate} (定価=1.0)` : "1.0"}
                            />

                            <div className="h-0 md:col-span-1" />

                            <InfoItem
                                label="希望エリア"
                                value={lead.areas && lead.areas.length > 0 ? (
                                    <div className="flex flex-col gap-1">
                                        {lead.areas.map((area, i) => (
                                            <span key={i}>第{i + 1}: {area}</span>
                                        ))}
                                    </div>
                                ) : "指定なし"}
                            />

                            <InfoItem
                                label="希望沿線・駅"
                                value={lead.stations && lead.stations.length > 0 ? (
                                    <div className="flex flex-col gap-1">
                                        {lead.stations.map((st, i) => (
                                            <span key={i}>第{i + 1}: {st}</span>
                                        ))}
                                    </div>
                                ) : "指定なし"}
                            />

                            <InfoItem label="広さ" value="60㎡以上" />
                            <InfoItem label="間取り" value="2LDK / 3LDK" />
                            <InfoItem label="ペット" value={lead.tags?.includes("ペット可") ? "希望する" : "指定なし"} />
                            <InfoItem label="築年数" value="指定なし" />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="properties" className="animate-in fade-in-50 duration-300">
                    <Card>
                        <CardHeader>
                            <CardTitle>以前の問い合わせ物件</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {lead.inquiredProperties && lead.inquiredProperties.length > 0 ? (
                                <div className="divide-y">
                                    {lead.inquiredProperties.map((prop) => (
                                        <div key={prop.id} className="p-6 flex items-start gap-4 hover:bg-gray-50 transition-colors">
                                            <div className="h-20 w-32 bg-gray-200 rounded-md shrink-0 object-cover flex items-center justify-center text-gray-400 text-xs">
                                                No Image
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-bold text-gray-900 mb-1">{prop.name}</h4>
                                                <p className="text-sm text-gray-600 mb-2">{prop.address}</p>
                                                <div className="flex items-center gap-4">
                                                    <p className="text-lg font-semibold text-blue-600">
                                                        {new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(prop.price)}
                                                    </p>
                                                    <span className="text-xs text-gray-400">問い合わせ日: {new Date(prop.inquiredAt).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-12 text-center text-muted-foreground">表示できる物件履歴がありません</div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

function InfoItem({ label, value, highlight = false, subtext }: { label: string; value: string | React.ReactNode; highlight?: boolean; subtext?: string }) {
    return (
        <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-500">{label}</span>
            <span className={`text-sm font-medium ${highlight ? "text-blue-600 text-lg" : "text-gray-900"}`}>
                {value}
            </span>
            {subtext && <span className="text-xs text-gray-400">{subtext}</span>}
        </div>
    );
}
