"use client";

import { useRouter } from "next/navigation";
import { doc, deleteDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { LeadRegistrationModal } from "./LeadRegistrationModal";
import { Lead } from "@/types/lead";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Phone, Mail, Edit, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useStatuses } from "@/hooks/use-statuses";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useState } from "react";

interface LeadDetailHeaderProps {
    lead: Lead;
}

export function LeadDetailHeader({ lead }: LeadDetailHeaderProps) {
    const { statuses, getStatusLabel, getStatusColor } = useStatuses();
    const router = useRouter();

    // Local state for inline editing
    const [name, setName] = useState(lead.name);
    const [tel, setTel] = useState(lead.tel || "");
    const [mail, setMail] = useState(lead.mail || "");
    const [age, setAge] = useState(lead.age ? String(lead.age) : "");
    const [familyStructure, setFamilyStructure] = useState(lead.familyStructure || "");
    const [commTool, setCommTool] = useState(lead.commTool || "");
    const [source, setSource] = useState(lead.source || "");

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

    const handleStatusChange = async (newStatus: string) => {
        try {
            await updateDoc(doc(db, "leads", lead.id), { status: newStatus as any });
        } catch (error) {
            console.error("Error updating status:", error);
        }
    };

    const handleBlur = async (field: keyof Lead, value: any) => {
        if (value === lead[field]) return;
        try {
            // For number fields, convert before saving
            const saveValue = field === 'age' && value ? Number(value) : value;
            await updateDoc(doc(db, "leads", lead.id), { [field]: saveValue });
        } catch (error) {
            console.error(`Error updating ${field}:`, error);
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
                <div className="flex items-start gap-6 w-full max-w-4xl">
                    <Avatar className="h-20 w-20 mt-1 shrink-0">
                        <AvatarImage src="" />
                        <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                            {getInitials(lead.name)}
                        </AvatarFallback>
                    </Avatar>

                    <div className="space-y-4 w-full">
                        {/* Top Row: Name, Status, Agent, Date */}
                        <div>
                            <div className="flex items-center gap-3 mb-2 flex-wrap">
                                <Input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    onBlur={() => handleBlur('name', name)}
                                    className="text-2xl font-bold text-gray-900 border-transparent hover:border-gray-200 focus:border-blue-500 w-auto min-w-[200px] h-auto p-1 bg-transparent"
                                />

                                <Badge variant={lead.priority === "High" ? "destructive" : "secondary"}>
                                    {lead.priority === "High" ? "高" : lead.priority === "Mid" ? "中" : "低"}
                                </Badge>

                                {/* Status Select */}
                                <Select onValueChange={handleStatusChange} defaultValue={lead.status}>
                                    <SelectTrigger
                                        className="h-7 w-[140px] border-none"
                                        style={{
                                            backgroundColor: `${getStatusColor(lead.status)}10`,
                                            color: getStatusColor(lead.status),
                                            fontWeight: 500
                                        }}
                                    >
                                        <SelectValue placeholder="ステータス" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {statuses.map(status => (
                                            <SelectItem key={status.id} value={status.id}>
                                                {status.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <div className="h-4 w-px bg-gray-300 mx-1" />

                                <div className="text-sm text-gray-600 flex items-center gap-2">
                                    <span className="text-xs text-gray-400">担当:</span>
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
                                        .filter(tag => tag !== "新規登録")
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

                        {/* Info Grid - Inline Editable */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-2 text-sm">
                            <div className="space-y-1">
                                <span className="text-xs text-gray-500 block">電話番号</span>
                                <div className="flex items-center gap-2 font-medium">
                                    <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                    <Input
                                        value={tel}
                                        onChange={(e) => setTel(e.target.value)}
                                        onBlur={() => handleBlur('tel', tel)}
                                        placeholder="電話番号を入力"
                                        className="h-7 p-1 border-transparent hover:border-gray-200 focus:border-blue-500 bg-transparent w-full"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <span className="text-xs text-gray-500 block">メールアドレス</span>
                                <div className="flex items-center gap-2 font-medium">
                                    <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                    <Input
                                        value={mail}
                                        onChange={(e) => setMail(e.target.value)}
                                        onBlur={() => handleBlur('mail', mail)}
                                        placeholder="メールアドレスを入力"
                                        className="h-7 p-1 border-transparent hover:border-gray-200 focus:border-blue-500 bg-transparent w-full"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <span className="text-xs text-gray-500 block">年齢・家族構成</span>
                                <div className="font-medium flex items-center gap-1">
                                    <Input
                                        value={age}
                                        onChange={(e) => setAge(e.target.value)}
                                        onBlur={() => handleBlur('age', age)}
                                        placeholder="年齢"
                                        className="h-7 p-1 w-12 border-transparent hover:border-gray-200 focus:border-blue-500 bg-transparent text-center"
                                    />
                                    <span>歳 / </span>
                                    <Input
                                        value={familyStructure}
                                        onChange={(e) => setFamilyStructure(e.target.value)}
                                        onBlur={() => handleBlur('familyStructure', familyStructure)}
                                        placeholder="家族構成"
                                        className="h-7 p-1 border-transparent hover:border-gray-200 focus:border-blue-500 bg-transparent flex-1"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <span className="text-xs text-gray-500 block">連絡手段・流入経路</span>
                                <div className="font-medium flex items-center gap-1">
                                    <Input
                                        value={commTool}
                                        onChange={(e) => setCommTool(e.target.value)}
                                        onBlur={() => handleBlur('commTool', commTool)}
                                        placeholder="連絡手段"
                                        className="h-7 p-1 border-transparent hover:border-gray-200 focus:border-blue-500 bg-transparent flex-1"
                                    />
                                    <span> / </span>
                                    <Input
                                        value={source}
                                        onChange={(e) => setSource(e.target.value)}
                                        onBlur={() => handleBlur('source', source)}
                                        placeholder="経路"
                                        className="h-7 p-1 border-transparent hover:border-gray-200 focus:border-blue-500 bg-transparent flex-1"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
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
