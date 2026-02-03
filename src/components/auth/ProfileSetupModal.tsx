"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db, storage } from "@/lib/firebase";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User as UserIcon, Upload } from "lucide-react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export function ProfileSetupModal() {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        lastName: "",
        firstName: "",
        avatarUrl: "",
    });
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        const checkProfile = async () => {
            if (!user) {
                setLoading(false);
                return;
            }

            try {
                const docRef = doc(db, "users", user.uid);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();
                    if (data.lastName && data.firstName) {
                        // Profile exists and has required fields
                        setIsOpen(false);
                    } else {
                        // Profile exists but incomplete
                        setFormData({
                            lastName: data.lastName || "",
                            firstName: data.firstName || "",
                            avatarUrl: data.avatarUrl || "",
                        });
                        setIsOpen(true);
                    }
                } else {
                    // No profile doc
                    setIsOpen(true);
                }
            } catch (error) {
                console.error("Error checking profile:", error);
            } finally {
                setLoading(false);
            }
        };

        checkProfile();
    }, [user]);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        if (file.size > 5 * 1024 * 1024) {
            alert("画像サイズは5MB以下にしてください。");
            return;
        }

        setUploading(true);
        try {
            const storageRef = ref(storage, `avatars/${user.uid}_${Date.now()}`);
            await uploadBytes(storageRef, file);
            const url = await getDownloadURL(storageRef);
            setFormData(prev => ({ ...prev, avatarUrl: url }));
        } catch (error) {
            console.error("Upload failed", error);
            alert("画像のアップロードに失敗しました。");
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async () => {
        if (!user || !formData.lastName || !formData.firstName) return;

        setSaving(true);
        try {
            await setDoc(doc(db, "users", user.uid), {
                email: user.email,
                lastName: formData.lastName,
                firstName: formData.firstName,
                avatarUrl: formData.avatarUrl,
                name: `${formData.lastName} ${formData.firstName}`,
                updatedAt: new Date().toISOString(),
                isAgent: true // Default to true for now as requested
            }, { merge: true });

            setIsOpen(false);
        } catch (error) {
            console.error("Error saving profile:", error);
            alert("プロフィールの保存に失敗しました。");
        } finally {
            setSaving(false);
        }
    };

    if (loading || !isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={() => { }}>
            <DialogContent className="sm:max-w-[425px]" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle>プロフィール設定</DialogTitle>
                    <DialogDescription>
                        初回ログインのため、プロフィール情報を登録してください。<br />
                        これらは担当者情報として使用されます。
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                    {/* Avatar Upload */}
                    <div className="flex flex-col items-center gap-3">
                        <Avatar className="w-24 h-24 border-2 border-slate-100">
                            <AvatarImage src={formData.avatarUrl} />
                            <AvatarFallback><UserIcon className="w-10 h-10 text-slate-400" /></AvatarFallback>
                        </Avatar>
                        <div className="flex items-center gap-2">
                            <Label htmlFor="setup-avatar-upload" className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2">
                                <Upload className="w-4 h-4" />
                                {uploading ? "アップロード中..." : "画像を選択"}
                            </Label>
                            <Input
                                id="setup-avatar-upload"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleImageUpload}
                                disabled={uploading}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="setup-lastName">姓 <span className="text-red-500">*</span></Label>
                            <Input
                                id="setup-lastName"
                                value={formData.lastName}
                                onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                                placeholder="山田"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="setup-firstName">名 <span className="text-red-500">*</span></Label>
                            <Input
                                id="setup-firstName"
                                value={formData.firstName}
                                onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                                placeholder="太郎"
                            />
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleSave} disabled={!formData.lastName || !formData.firstName || saving || uploading} className="w-full">
                        {saving ? "保存中..." : "登録して開始"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
