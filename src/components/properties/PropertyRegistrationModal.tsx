import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { addDoc, updateDoc, setDoc, doc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Property } from "@/types/property";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const propertyFormSchema = z.object({
    name: z.string().min(1, "物件名は必須です"),
    address: z.string().min(1, "住所は必須です"),
    price: z.coerce.number().min(1, "有効な価格を入力してください"),
    layout: z.string().min(1, "間取りは必須です"),
    size: z.coerce.number().min(1, "有効な面積を入力してください"),
    builtYear: z.coerce.number().min(1900, "有効な西暦を入力してください").max(2100, "有効な西暦を入力してください"),
    status: z.enum(["active", "negotiating", "sold"]),
    memo: z.string().optional(),
});

type PropertyFormValues = z.infer<typeof propertyFormSchema>;

interface PropertyRegistrationModalProps {
    initialData?: Property;
    trigger?: React.ReactNode;
    onSuccess?: () => void;
}

export function PropertyRegistrationModal({ initialData, trigger, onSuccess }: PropertyRegistrationModalProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const form = useForm<PropertyFormValues>({
        resolver: zodResolver(propertyFormSchema) as any,
        defaultValues: {
            name: "",
            address: "",
            price: 0,
            layout: "",
            size: 0,
            builtYear: new Date().getFullYear(),
            status: "active",
            memo: "",
        },
    });

    useEffect(() => {
        if (open) {
            if (initialData) {
                form.reset({
                    name: initialData.name,
                    address: initialData.address,
                    price: initialData.price,
                    layout: initialData.layout,
                    size: initialData.size,
                    builtYear: initialData.builtYear,
                    status: initialData.status,
                    memo: initialData.memo || "",
                });
            } else {
                form.reset({
                    name: "",
                    address: "",
                    price: 0,
                    layout: "",
                    size: 0,
                    builtYear: new Date().getFullYear(),
                    status: "active",
                    memo: "",
                });
            }
        }
    }, [open, initialData, form]);

    const onSubmit = async (data: PropertyFormValues) => {
        setLoading(true);
        try {
            if (initialData) {
                // Update existing property
                // Use setDoc with merge: true to handle both real updates and "promoting" mock data to real Firestore docs
                await setDoc(doc(db, "properties", initialData.id), {
                    ...data,
                    updatedAt: serverTimestamp(),
                }, { merge: true });
            } else {
                // Create new property
                await addDoc(collection(db, "properties"), {
                    ...data,
                    images: [], // Placeholder for now
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                });
            }
            setOpen(false);
            form.reset();
            if (onSuccess) onSuccess();
        } catch (error) {
            console.error("Error saving property:", error);
            alert("エラーが発生しました");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || <Button>+ 新規物件</Button>}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{initialData ? "物件情報の編集" : "新規物件登録"}</DialogTitle>
                    <DialogDescription>
                        {initialData ? "物件情報を更新してください。" : "新しい物件の情報を入力してください。"}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">物件名</Label>
                        <Input id="name" {...form.register("name")} placeholder="例: パークコート赤坂" />
                        {form.formState.errors.name && <span className="text-destructive text-xs">{form.formState.errors.name.message}</span>}
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="address">住所</Label>
                        <Input id="address" {...form.register("address")} placeholder="例: 東京都港区..." />
                        {form.formState.errors.address && <span className="text-destructive text-xs">{form.formState.errors.address.message}</span>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="price">価格 (円)</Label>
                            <Input id="price" type="number" {...form.register("price")} placeholder="50000000" />
                            {form.formState.errors.price && <span className="text-destructive text-xs">{form.formState.errors.price.message}</span>}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="status">ステータス</Label>
                            <Select onValueChange={(val: any) => form.setValue("status", val)} defaultValue={initialData?.status || "active"}>
                                <SelectTrigger>
                                    <SelectValue placeholder="選択" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">販売中</SelectItem>
                                    <SelectItem value="negotiating">商談中</SelectItem>
                                    <SelectItem value="sold">成約済</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="layout">間取り</Label>
                            <Input id="layout" {...form.register("layout")} placeholder="3LDK" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="size">専有面積 (㎡)</Label>
                            <Input id="size" type="number" step="0.01" {...form.register("size")} placeholder="70.5" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="builtYear">築年 (西暦)</Label>
                            <Input id="builtYear" type="number" {...form.register("builtYear")} placeholder="2020" />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="memo">メモ</Label>
                        <Textarea id="memo" {...form.register("memo")} placeholder="特記事項など" />
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading ? "保存中..." : (initialData ? "更新" : "登録")}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
