"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Lead } from "@/types/lead";
import { doc, updateDoc, addDoc, collection } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Plus } from "lucide-react";
import { LeadStatus } from "@/types/lead";
import { useStatuses } from "@/hooks/use-statuses";

// Zod Schema
const leadFormSchema = z.object({
    // Identity
    leadType: z.enum(["Buy", "Sell"]),
    name: z.string().min(1, "顧客名は必須です"),
    company: z.string().optional(),
    email: z.string().email("無効なメールアドレスです").optional().or(z.literal("")),
    phone: z.string().min(10, "電話番号は10桁以上である必要があります").regex(/^[0-9-]+$/, "半角数字とハイフンのみ使用可能です"),

    // Requirements
    budget: z.coerce.number().min(0),
    discountRate: z.coerce.number().min(0).max(100).optional(),
    preferredArea: z.string().optional(),
    propertyType: z.string().optional(),
    moveInDate: z.string().optional(),

    // Other
    occupation: z.string().optional(),
    familyStructure: z.string().optional(),

    // Internal
    assignedAgent: z.string().min(1, "担当者は必須です"),
    status: z.string().min(1, "ステータスは必須です"), // LeadStatus
    priority: z.enum(["High", "Mid", "Low"]),

    // Note
    memo: z.string().optional(),
});

type LeadFormValues = z.infer<typeof leadFormSchema>;

export function LeadRegistrationModal({ trigger, initialStatus, lead }: { trigger?: React.ReactNode; initialStatus?: LeadStatus; lead?: Lead }) {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { statuses } = useStatuses();

    const form = useForm({
        resolver: zodResolver(leadFormSchema),
        defaultValues: {
            name: lead?.name || "",
            company: "",
            email: lead?.mail || "",
            phone: lead?.tel || "",
            budget: lead?.budget || 0,
            discountRate: lead?.discountRate ?? 1.0,
            preferredArea: lead?.areas?.[0] || "",
            propertyType: lead?.propertyType || "Mansion",
            moveInDate: lead?.moveInDate || "",
            occupation: "",
            familyStructure: lead?.familyStructure || "",
            leadType: lead?.leadType || "Buy",
            assignedAgent: lead?.agentName || "",
            status: (lead?.status || initialStatus) || "New",
            priority: lead?.priority || "Mid",
            memo: lead?.memo || "",
        },
    });

    // Reset form status when initialStatus changes or modal opens
    useEffect(() => {
        if (open) {
            if (lead) {
                // If editing, force set values (in case lead prop updates or modal re-opens)
                form.reset({
                    name: lead.name,
                    email: lead.mail,
                    phone: lead.tel,
                    budget: lead.budget,
                    discountRate: lead.discountRate ?? 1.0,
                    preferredArea: lead.areas?.[0] || "",
                    propertyType: lead.propertyType,
                    moveInDate: lead.moveInDate,
                    familyStructure: lead.familyStructure,
                    leadType: lead.leadType,
                    assignedAgent: lead.agentName,
                    status: lead.status,
                    priority: lead.priority,
                    memo: lead.memo,
                });
            } else if (initialStatus) {
                form.setValue("status", initialStatus);
            }
        }
    }, [open, initialStatus, lead, form]);

    const { watch, register, handleSubmit, setValue, formState: { errors } } = form;

    const budget = watch("budget");
    const discountRate = watch("discountRate") ?? 1.0;

    // Calculated Commission Preview
    // Formula: (budget * 0.03 * discountRate) + 60000
    const commission = budget ? (Number(budget) * 0.03 * Number(discountRate) + 60000) : 0;
    const commissionFmt = new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(commission);

    const onSubmit = async (data: LeadFormValues) => {
        setIsSubmitting(true);
        try {
            console.log("Submitting Lead Data:", data);

            const commonData = {
                name: data.name,
                mail: data.email,
                tel: data.phone,
                budget: data.budget,
                discountRate: data.discountRate ?? 1.0,
                areas: data.preferredArea ? [data.preferredArea] : [],
                familyStructure: data.familyStructure,
                agentName: data.assignedAgent,
                status: data.status as LeadStatus,
                priority: data.priority,
                memo: data.memo,
                updatedAt: new Date().toISOString(),
                leadType: data.leadType,
            };

            if (lead) {
                // Update existing
                const docRef = doc(db, "leads", lead.id);
                await updateDoc(docRef, {
                    ...commonData,
                    // Preserve other fields if any, but specific form fields overwrite
                });
            } else {
                // Create new
                await addDoc(collection(db, "leads"), {
                    ...commonData,
                    createdAt: new Date().toISOString(),
                    tags: ["新規登録"],
                });
            }

            setOpen(false);
            if (!lead) form.reset(); // Only reset if create mode
        } catch (error) {
            console.error("Error saving lead:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger ? trigger : (
                    <Button className="gap-2 bg-[#0f172a] hover:bg-[#1e293b] text-white h-9 px-4 text-xs font-medium">
                        <Plus className="w-3.5 h-3.5" />
                        新規顧客登録
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{lead ? "顧客情報編集" : "新規顧客登録"}</DialogTitle>
                    <DialogDescription>
                        {lead ? "顧客情報を更新します。" : "新しい顧客の情報を入力してください。"}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-4">
                    {/* Grid Layout */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* 1. Identity */}
                        <div className="space-y-4 border p-4 rounded-lg bg-gray-50/50">
                            <h3 className="font-semibold text-gray-700 mb-2">基本情報・連絡先</h3>
                            <div className="grid gap-2">
                                <Label htmlFor="leadType">取引種別</Label>
                                <Select onValueChange={(val: "Buy" | "Sell") => setValue("leadType", val)} defaultValue="Buy">
                                    <SelectTrigger>
                                        <SelectValue placeholder="種別を選択" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Buy">購入</SelectItem>
                                        <SelectItem value="Sell">売却</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="name">顧客名 <span className="text-red-500">*</span></Label>
                                <Input id="name" placeholder="山田 太郎" {...register("name")} />
                                {errors.name && <span className="text-red-500 text-xs">{errors.name.message}</span>}
                            </div>
                            {/* <div className="grid gap-2">
                        <Label htmlFor="company">Company</Label>
                        <Input id="company" placeholder="株式会社..." {...register("company")} />
                    </div> */}
                            <div className="grid gap-2">
                                <Label htmlFor="phone">電話番号 <span className="text-red-500">*</span></Label>
                                <Input id="phone" placeholder="090-1234-5678" {...register("phone")} />
                                {errors.phone && <span className="text-red-500 text-xs">{errors.phone.message}</span>}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="email">メールアドレス</Label>
                                <Input id="email" type="email" placeholder="example@mail.com" {...register("email")} />
                                {errors.email && <span className="text-red-500 text-xs">{errors.email.message}</span>}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="family">家族構成</Label>
                                <Input id="family" placeholder="単身、夫婦など" {...register("familyStructure")} />
                            </div>
                        </div>

                        {/* 2. Requirements & Internal */}
                        <div className="space-y-4 border p-4 rounded-lg bg-gray-50/50">
                            <h3 className="font-semibold text-gray-700 mb-2">希望条件・社内管理</h3>

                            <div className="grid gap-2">
                                <Label htmlFor="budget">予算 (円)</Label>
                                <Input id="budget" type="number" placeholder="50000000" {...register("budget")} />
                                <p className="text-xs text-muted-foreground text-right">
                                    想定仲介手数料: <span className="font-bold text-blue-600">{commissionFmt}</span>
                                </p>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="discountRate">手数料値引き率 (1.0=定価, 0.5=半額)</Label>
                                <Input id="discountRate" type="number" step="0.1" placeholder="1.0" {...register("discountRate")} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="area">希望エリア</Label>
                                    <Input id="area" placeholder="渋谷区" {...register("preferredArea")} />
                                </div>
                                {/* <div className="grid gap-2">
                            <Label htmlFor="type">Type</Label>
                            <Select onValueChange={(val) => setValue("propertyType", val)} defaultValue="Mansion">
                                <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Mansion">Mansion</SelectItem>
                                    <SelectItem value="House">House</SelectItem>
                                    <SelectItem value="Land">Land</SelectItem>
                                </SelectContent>
                            </Select>
                        </div> */}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="agent">担当者 <span className="text-red-500">*</span></Label>
                                    <Input id="agent" placeholder="担当者名" {...register("assignedAgent")} />
                                    {errors.assignedAgent && <span className="text-red-500 text-xs">{errors.assignedAgent.message}</span>}
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="priority">優先度</Label>
                                    <Select onValueChange={(val: "High" | "Mid" | "Low") => setValue("priority", val)} defaultValue="Mid">
                                        <SelectTrigger>
                                            <SelectValue placeholder="優先度を選択" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="High">高</SelectItem>
                                            <SelectItem value="Mid">中</SelectItem>
                                            <SelectItem value="Low">低</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="status">ステータス</Label>
                                <Select onValueChange={(val) => setValue("status", val)} defaultValue="New">
                                    <SelectTrigger>
                                        <SelectValue placeholder="ステータスを選択" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {statuses.map((status) => (
                                            <SelectItem key={status.id} value={status.id}>
                                                {status.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* Note Section */}
                    <div className="grid gap-2">
                        <Label htmlFor="memo">メモ</Label>
                        <Textarea id="memo" placeholder="その他の情報..." className="h-24" {...register("memo")} />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>キャンセル</Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? (lead ? "更新中..." : "登録中...") : (lead ? "更新" : "登録")}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
