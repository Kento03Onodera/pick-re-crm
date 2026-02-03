"use client";

import { useRouter } from "next/navigation";
import { doc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { LeadRegistrationModal } from "./LeadRegistrationModal";
import { Lead } from "@/types/lead";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Phone, Mail, Edit, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useStatuses } from "@/hooks/use-statuses";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";

interface LeadDetailHeaderProps {
    lead: Lead;
}

export function LeadDetailHeader({ lead }: LeadDetailHeaderProps) {
    const { getStatusLabel, getStatusColor } = useStatuses();
    const router = useRouter();

    const getInitials = (name: string) => {
        return name.slice(0, 2);
    };

    const handleDelete = async () => {
        if (!confirm("この顧客情報を削除してもよろしいですか？（この操作は取り消せません）")) return;

        try {
            await deleteDoc(doc(db, "leads", lead.id));
            router.push("/leads");
        } catch (error) {
            console.error("Error deleting lead:", error);
            alert("削除に失敗しました。");
        }
    };

    return (
        <div className="bg-white border-b px-8 py-6 shrink-0 space-y-4">
            <Breadcrumbs
                items={[
                    { label: "顧客一覧", href: "/leads" },
                    { label: lead.name }
                ]}
            />
            <div className="flex items-start justify-between">
                <div className="flex items-start gap-6">
                    <Avatar className="h-20 w-20 mt-1">
                        <AvatarImage src="" />
                        <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                            {getInitials(lead.name)}
                        </AvatarFallback>
                    </Avatar>

                    <div className="space-y-4">
                        {/* Top Row: Name, Status, Agent, Date */}
                        <div>
                            <div className="flex items-center gap-3 mb-2 flex-wrap">
                                <h1 className="text-2xl font-bold text-gray-900">{lead.name}</h1>

                                <Badge variant={lead.priority === "High" ? "destructive" : "secondary"}>
                                    {lead.priority === "High" ? "高" : lead.priority === "Mid" ? "中" : "低"}
                                </Badge>

                                <Badge
                                    variant="outline"
                                    className="bg-white"
                                    style={{
                                        borderColor: getStatusColor(lead.status),
                                        color: getStatusColor(lead.status),
                                        backgroundColor: `${getStatusColor(lead.status)}10`
                                    }}
                                >
                                    {getStatusLabel(lead.status)}
                                </Badge>

                                <div className="h-4 w-px bg-gray-300 mx-1" />

                                <div className="text-sm text-gray-600 flex items-center gap-2">
                                    <span className="text-xs text-gray-400">担当:</span>
                                    {/* Ideally Avatar here if we have agent image */}
                                    <span className="font-medium">{lead.agentName || "未割当"}</span>
                                </div>

                                <div className="h-4 w-px bg-gray-300 mx-1" />

                                <div className="text-sm text-gray-600 flex items-center gap-2">
                                    <span className="text-xs text-gray-400">最終更新:</span>
                                    <span>{new Date(lead.updatedAt).toLocaleDateString()}</span>
                                </div>
                            </div>

                            {/* Tags Row */}
                            <div className="flex flex-wrap gap-2">
                                {lead.tags && lead.tags.length > 0 ? (
                                    lead.tags
                                        .filter(tag => tag !== "新規登録") // Filter out the legacy auto-tag
                                        .map(tag => (
                                            <Badge key={tag} variant="secondary" className="bg-slate-100 text-slate-600 text-xs border border-slate-200">
                                                {tag}
                                            </Badge>
                                        ))
                                ) : (
                                    <span className="text-xs text-gray-400">タグ設定なし</span>
                                )}
                            </div>
                        </div>

                        {/* Info Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-2 text-sm">
                            <div className="space-y-1">
                                <span className="text-xs text-gray-500 block">電話番号</span>
                                <div className="flex items-center gap-2 font-medium">
                                    <Phone className="w-3.5 h-3.5 text-gray-400" />
                                    {lead.tel || "-"}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <span className="text-xs text-gray-500 block">メールアドレス</span>
                                <div className="flex items-center gap-2 font-medium">
                                    <Mail className="w-3.5 h-3.5 text-gray-400" />
                                    {lead.mail || "-"}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <span className="text-xs text-gray-500 block">年齢・家族構成</span>
                                <div className="font-medium">
                                    {lead.age ? `${lead.age}歳` : "-"} / {lead.familyStructure || "-"}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <span className="text-xs text-gray-500 block">連絡手段・流入経路</span>
                                <div className="font-medium">
                                    {lead.commTool || "-"} / {lead.source || "-"}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <LeadRegistrationModal
                        initialStatus={lead.status}
                        lead={lead}
                        trigger={
                            <Button variant="outline" size="sm" className="gap-2">
                                <Edit className="w-4 h-4" />
                                編集
                            </Button>
                        }
                    />

                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                        onClick={handleDelete}
                    >
                        <Trash2 className="w-4 h-4" />
                        削除
                    </Button>
                </div>
            </div>
        </div>
    );
}
