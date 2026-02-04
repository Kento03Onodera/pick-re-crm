"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Lead, LeadStatus } from "@/types/lead";
import { doc, updateDoc, addDoc, collection } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Plus } from "lucide-react";
import { useStatuses } from "@/hooks/use-statuses";

// Constants for Options
const LAYOUT_OPTIONS = ["1R/1K", "1DK/1LDK", "2K/2DK/2LDK", "3K/3DK/3LDK", "4K〜"];
const PROPERTY_TYPE_OPTIONS = ["マンション", "戸建", "土地", "収益物件"];

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

    // Areas (1st, 2nd, 3rd)
    area1: z.string().optional(),
    area2: z.string().optional(),
    area3: z.string().optional(),

    // Stations (1st, 2nd, 3rd)
    station1: z.string().optional(),
    station2: z.string().optional(),
    station3: z.string().optional(),

    propertyType: z.string().optional(), // Legacy single select
    desiredPropertyTypes: z.array(z.string()).optional(), // New Multi-select
    moveInDate: z.string().optional(),

    // New criteria
    size: z.coerce.number().min(0).optional(),
    layout: z.array(z.string()).optional(),
    builtYear: z.coerce.number().min(0).optional(),
    petsAllowed: z.boolean().default(false).optional(),
    carOwned: z.boolean().default(false).optional(),
    parkingNeeded: z.boolean().default(false).optional(),
    floorLevel: z.string().optional(), // Free text "{N}階以内"

    // Search Settings
    isSearchRequested: z.boolean().default(false).optional(),
    searchFrequency: z.enum(["3days", "1week", "2week"]).optional(),

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

            // Map array to individual fields
            area1: lead?.areas?.[0] || "",
            area2: lead?.areas?.[1] || "",
            area3: lead?.areas?.[2] || "",

            station1: lead?.stations?.[0] || "",
            station2: lead?.stations?.[1] || "",
            station3: lead?.stations?.[2] || "",

            propertyType: lead?.propertyType || "Mansion",
            desiredPropertyTypes: lead?.desiredPropertyTypes || [],
            moveInDate: lead?.moveInDate || "",

            // New Fields Defaults
            size: lead?.size || 0,
            layout: lead?.layout || [],
            builtYear: lead?.builtYear || 0,
            petsAllowed: lead?.petsAllowed || false,
            carOwned: lead?.carOwned || false,
            parkingNeeded: lead?.parkingNeeded || false,
            floorLevel: lead?.floorLevel || "",

            isSearchRequested: lead?.isSearchRequested || false,
            searchFrequency: lead?.searchFrequency || "1week",

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
                form.reset({
                    name: lead.name,
                    email: lead.mail,
                    phone: lead.tel,
                    budget: lead.budget,
                    discountRate: lead.discountRate ?? 1.0,

                    area1: lead.areas?.[0] || "",
                    area2: lead.areas?.[1] || "",
                    area3: lead.areas?.[2] || "",

                    station1: lead.stations?.[0] || "",
                    station2: lead.stations?.[1] || "",
                    station3: lead.stations?.[2] || "",

                    propertyType: lead.propertyType,
                    desiredPropertyTypes: lead.desiredPropertyTypes || [],
                    moveInDate: lead.moveInDate,

                    size: lead.size || 0,
                    layout: lead.layout || [],
                    builtYear: lead.builtYear || 0,
                    petsAllowed: lead.petsAllowed || false,
                    carOwned: lead.carOwned || false,
                    parkingNeeded: lead.parkingNeeded || false,
                    floorLevel: lead.floorLevel || "",

                    isSearchRequested: lead.isSearchRequested || false,
                    searchFrequency: lead.searchFrequency || "1week",

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

    const { watch, register, handleSubmit, setValue, control, formState: { errors } } = form;

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

            // Construct arrays (filtering out empty strings)
            const areas = [data.area1, data.area2, data.area3].filter(Boolean) as string[];
            const stations = [data.station1, data.station2, data.station3].filter(Boolean) as string[];

            const commonData = {
                name: data.name,
                mail: data.email,
                tel: data.phone,
                budget: data.budget,
                discountRate: data.discountRate ?? 1.0,

                areas: areas,
                stations: stations,

                // Standardize: If desiredPropertyTypes is used, prefer it.
                desiredPropertyTypes: data.desiredPropertyTypes || [],
                // Still keep legacy propertyType for backward compat if needed, or just map first value.
                propertyType: data.desiredPropertyTypes?.[0] || data.propertyType,

                // New fields
                size: data.size,
                layout: data.layout,
                builtYear: data.builtYear,
                petsAllowed: data.petsAllowed,
                carOwned: data.carOwned,
                parkingNeeded: data.parkingNeeded,
                floorLevel: data.floorLevel,

                isSearchRequested: data.isSearchRequested,
                searchFrequency: data.searchFrequency,

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
                });
            } else {
                // Create new
                await addDoc(collection(db, "leads"), {
                    ...commonData,
                    createdAt: new Date().toISOString(),
                    tags: [], // No longer adding "新規登録"
                });
            }

            setOpen(false);
            if (!lead) form.reset();
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
                            <div className="grid gap-2">
                                <Label htmlFor="phone">電話番号 <span className="text-red-500">*</span></Label>
                                <Input id="phone" placeholder="090-1234-5678" {...register("phone")} />
                                {errors.phone && <span className="text-red-500 text-xs">{errors.phone.message}</span>}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="email">メールアドレス (任意)</Label>
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

                            {/* Preferred Areas */}
                            <div className="grid gap-2">
                                <Label>希望エリア (第1〜第3候補)</Label>
                                <div className="grid grid-cols-1 gap-2">
                                    <Input placeholder="第1候補 (例: 渋谷区)" {...register("area1")} />
                                    <Input placeholder="第2候補" {...register("area2")} />
                                    <Input placeholder="第3候補" {...register("area3")} />
                                </div>
                            </div>

                            {/* Preferred Stations */}
                            <div className="grid gap-2">
                                <Label>希望沿線・駅 (第1〜第3候補)</Label>
                                <div className="grid grid-cols-1 gap-2">
                                    <Input placeholder="第1候補 (例: 山手線 渋谷駅)" {...register("station1")} />
                                    <Input placeholder="第2候補" {...register("station2")} />
                                    <Input placeholder="第3候補" {...register("station3")} />
                                </div>
                            </div>

                            {/* New Detailed Criteria */}
                            <div className="grid grid-cols-2 gap-4 pt-2 mt-2 border-t">
                                <div className="col-span-2">
                                    <Label className="mb-2 block">希望物件種別 (複数選択可)</Label>
                                    <div className="flex flex-wrap gap-4">
                                        <Controller
                                            control={control}
                                            name="desiredPropertyTypes"
                                            render={({ field }) => (
                                                <>
                                                    {PROPERTY_TYPE_OPTIONS.map((type) => (
                                                        <div key={type} className="flex items-center space-x-2">
                                                            <Checkbox
                                                                id={`propType-${type}`}
                                                                checked={field.value?.includes(type)}
                                                                onCheckedChange={(checked) => {
                                                                    const newValue = checked
                                                                        ? [...(field.value || []), type]
                                                                        : (field.value || []).filter((v) => v !== type);
                                                                    field.onChange(newValue);
                                                                }}
                                                            />
                                                            <Label htmlFor={`propType-${type}`} className="font-normal">{type}</Label>
                                                        </div>
                                                    ))}
                                                </>
                                            )}
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-2 col-span-1">
                                    <Label htmlFor="size">広さ (㎡)</Label>
                                    <Input id="size" type="number" placeholder="60" {...register("size")} />
                                </div>

                                <div className="grid gap-2 col-span-1">
                                    <Label htmlFor="builtYear">築年数 (年以内)</Label>
                                    <Input id="builtYear" type="number" placeholder="20" {...register("builtYear")} />
                                </div>

                                <div className="col-span-2">
                                    <Label className="mb-2 block">希望間取り (複数選択可)</Label>
                                    <div className="flex flex-wrap gap-y-2 gap-x-4">
                                        <Controller
                                            control={control}
                                            name="layout"
                                            render={({ field }) => (
                                                <>
                                                    {LAYOUT_OPTIONS.map((lo) => (
                                                        <div key={lo} className="flex items-center space-x-2">
                                                            <Checkbox
                                                                id={`layout-${lo}`}
                                                                checked={field.value?.includes(lo)}
                                                                onCheckedChange={(checked) => {
                                                                    const newValue = checked
                                                                        ? [...(field.value || []), lo]
                                                                        : (field.value || []).filter((v) => v !== lo);
                                                                    field.onChange(newValue);
                                                                }}
                                                            />
                                                            <Label htmlFor={`layout-${lo}`} className="font-normal">{lo}</Label>
                                                        </div>
                                                    ))}
                                                </>
                                            )}
                                        />
                                    </div>
                                </div>

                                <div className="col-span-2 grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="floorLevel">所在階の希望</Label>
                                        <Input id="floorLevel" placeholder="例: 3階以上、最上階など" {...register("floorLevel")} />
                                    </div>
                                </div>

                                <div className="col-span-2 flex flex-wrap gap-6 pt-2">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="petsAllowed"
                                            checked={watch("petsAllowed")}
                                            onCheckedChange={(c) => setValue("petsAllowed", c as boolean)}
                                        />
                                        <Label htmlFor="petsAllowed">ペット有り</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="carOwned"
                                            checked={watch("carOwned")}
                                            onCheckedChange={(c) => setValue("carOwned", c as boolean)}
                                        />
                                        <Label htmlFor="carOwned">車所有</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="parkingNeeded"
                                            checked={watch("parkingNeeded")}
                                            onCheckedChange={(c) => setValue("parkingNeeded", c as boolean)}
                                        />
                                        <Label htmlFor="parkingNeeded">駐車場必要</Label>
                                    </div>
                                </div>
                            </div>

                            {/* Search Settings */}
                            <div className="grid grid-cols-2 gap-4 pt-2 border-t mt-2">
                                <div className="flex items-center space-x-2 mt-4">
                                    <Checkbox
                                        id="searchRequest"
                                        checked={watch("isSearchRequested")}
                                        onCheckedChange={(c) => setValue("isSearchRequested", c as boolean)}
                                    />
                                    <Label htmlFor="searchRequest">検索依頼あり</Label>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="searchFrequency">検索頻度</Label>
                                    <Select onValueChange={(val: "3days" | "1week" | "2week") => setValue("searchFrequency", val)} defaultValue="1week">
                                        <SelectTrigger>
                                            <SelectValue placeholder="頻度を選択" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="3days">3日ごと</SelectItem>
                                            <SelectItem value="1week">1週間ごと</SelectItem>
                                            <SelectItem value="2week">2週間ごと</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
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
