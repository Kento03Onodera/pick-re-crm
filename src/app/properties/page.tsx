"use client";

import { useState, useEffect } from "react";
import { collection, onSnapshot, query, orderBy, deleteDoc, doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Property } from "@/types/property";
import { MOCK_PROPERTIES } from "@/mocks/properties";
import { Header } from "@/components/layout/Header";
import { PropertyRegistrationModal } from "@/components/properties/PropertyRegistrationModal";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Search, MapPin, Calendar, List, Map as MapIcon, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { PropertyMap } from "@/components/properties/PropertyMap";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

// Extend Property type locally to support 'deleted' flag (Soft Delete)
type ExtendedProperty = Property & { deleted?: boolean };

export default function PropertiesPage() {
    const [properties, setProperties] = useState<Property[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<"list" | "map">("list");

    // Edit Modal State
    const [editingProperty, setEditingProperty] = useState<Property | undefined>(undefined);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    useEffect(() => {
        // Real-time listener
        const q = query(collection(db, "properties"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedPropsMap = new Map<string, ExtendedProperty>();
            snapshot.forEach((doc) => {
                fetchedPropsMap.set(doc.id, { id: doc.id, ...doc.data() } as ExtendedProperty);
            });

            // Merge logic: Start with Mock, override with Real
            const combinedProperties: Property[] = [];

            // 1. Process Mock Properties
            MOCK_PROPERTIES.forEach(mockProp => {
                if (fetchedPropsMap.has(mockProp.id)) {
                    // Property exists in Firestore (edited or deleted)
                    const realProp = fetchedPropsMap.get(mockProp.id)!;

                    // Only add if NOT deleted
                    if (!realProp.deleted) {
                        combinedProperties.push(realProp);
                    }

                    // Remove from map to indicate processed
                    fetchedPropsMap.delete(mockProp.id);
                } else {
                    // Property exists only in Mock (never edited/deleted)
                    combinedProperties.push(mockProp);
                }
            });

            // 2. Process remaining Firestore Properties (New creations)
            fetchedPropsMap.forEach(realProp => {
                if (!realProp.deleted) {
                    combinedProperties.push(realProp);
                }
            });

            // 3. Sort by createdAt desc (handling both string and Date)
            combinedProperties.sort((a, b) => {
                const dateA = new Date(a.updatedAt || a.createdAt).getTime();
                const dateB = new Date(b.updatedAt || b.createdAt).getTime();
                return dateB - dateA;
            });

            setProperties(combinedProperties);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        // Stop propagation strictly to avoid parent clicks (link navigation)
        e.preventDefault();
        e.stopPropagation();

        if (confirm("本当にこの物件を削除しますか？")) {
            try {
                // Soft Delete
                await setDoc(doc(db, "properties", id), { deleted: true }, { merge: true });
            } catch (error) {
                console.error("Error deleting property:", error);
                alert("削除に失敗しました");
            }
        }
    };

    const openEditModal = (e: React.MouseEvent, prop: Property) => {
        e.preventDefault();
        e.stopPropagation(); // Avoid navigating to detail
        setEditingProperty(prop);
        setIsEditModalOpen(true);
    };

    const filteredProperties = properties.filter(p =>
        p.name.includes(searchQuery) ||
        p.address.includes(searchQuery)
    );

    const formatPrice = (price: number) => {
        if (price >= 100000000) {
            return `${(price / 100000000).toFixed(1)}億円`;
        }
        return `${(price / 10000).toLocaleString()}万円`;
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active':
                return <Badge className="bg-emerald-500 hover:bg-emerald-600">販売中</Badge>;
            case 'negotiating':
                return <Badge className="bg-orange-500 hover:bg-orange-600">商談中</Badge>;
            case 'sold':
                return <Badge className="bg-slate-500 hover:bg-slate-600">成約済</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-slate-50">
            <Header />

            <main className="flex-1 p-6 space-y-6 max-w-[1600px] mx-auto w-full">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">物件管理</h1>
                        <p className="text-muted-foreground">登録物件の一覧・管理</p>
                    </div>

                    <div className="flex items-center gap-4">
                        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "list" | "map")}>
                            <TabsList>
                                <TabsTrigger value="list" className="gap-2">
                                    <List className="w-4 h-4" />
                                    一覧
                                </TabsTrigger>
                                <TabsTrigger value="map" className="gap-2">
                                    <MapIcon className="w-4 h-4" />
                                    地図
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>

                        {/* Global Property Registration (New) */}
                        <PropertyRegistrationModal />
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 min-h-[600px]">
                    {viewMode === "list" ? (
                        <>
                            <div className="relative mb-6">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="物件名、住所で検索..."
                                    className="pl-10 max-w-md"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

                            {/* Desktop Table View */}
                            <div className="hidden md:block rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[100px]">画像</TableHead>
                                            <TableHead>物件名 / 住所</TableHead>
                                            <TableHead>価格</TableHead>
                                            <TableHead>間取り / 面積</TableHead>
                                            <TableHead>築年数</TableHead>
                                            <TableHead>ステータス</TableHead>
                                            <TableHead className="w-[50px]"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {loading ? (
                                            <TableRow>
                                                <TableCell colSpan={7} className="text-center py-8">読み込み中...</TableCell>
                                            </TableRow>
                                        ) : filteredProperties.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={7} className="text-center py-8">物件が見つかりません</TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredProperties.map((prop) => (
                                                <TableRow key={prop.id} className="cursor-pointer hover:bg-slate-50 group">
                                                    <TableCell>
                                                        <Link href={`/properties/${prop.id}`} className="block">
                                                            <div className="w-16 h-12 bg-slate-200 rounded overflow-hidden">
                                                                {prop.images && prop.images.length > 0 ? (
                                                                    <img src={prop.images[0]} alt={prop.name} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">No Img</div>
                                                                )}
                                                            </div>
                                                        </Link>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Link href={`/properties/${prop.id}`} className="block">
                                                            <div className="font-medium text-slate-900 group-hover:text-blue-600 transition-colors">{prop.name}</div>
                                                            <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                                                <MapPin className="w-3 h-3" />
                                                                {prop.address}
                                                            </div>
                                                        </Link>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="font-bold text-slate-800">{formatPrice(prop.price)}</div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="text-sm">
                                                            {prop.layout} <span className="text-slate-300">|</span> {prop.size}㎡
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="text-sm flex items-center gap-1">
                                                            <Calendar className="w-3 h-3 text-slate-400" />
                                                            {prop.builtYear}年
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {getStatusBadge(prop.status)}
                                                    </TableCell>
                                                    <TableCell onClick={(e) => e.stopPropagation()}>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100">
                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem onClick={(e) => openEditModal(e, prop)}>
                                                                    <Pencil className="mr-2 h-4 w-4" />
                                                                    編集
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={(e) => handleDelete(e, prop.id)} className="text-red-600 focus:text-red-600">
                                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                                    削除
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Mobile Card View */}
                            <div className="md:hidden space-y-4">
                                {loading ? (
                                    <div className="text-center py-8">読み込み中...</div>
                                ) : filteredProperties.length === 0 ? (
                                    <div className="text-center py-8">物件が見つかりません</div>
                                ) : (
                                    filteredProperties.map((prop) => (
                                        <Link href={`/properties/${prop.id}`} key={prop.id} className="block">
                                            <Card>
                                                <div className="h-40 bg-slate-200 relative">
                                                    {prop.images && prop.images.length > 0 ? (
                                                        <img src={prop.images[0]} alt={prop.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-slate-400">No Image</div>
                                                    )}
                                                    <div className="absolute top-2 right-2">
                                                        {getStatusBadge(prop.status)}
                                                    </div>
                                                </div>
                                                <CardContent className="p-4">
                                                    <h3 className="font-bold text-lg mb-1">{prop.name}</h3>
                                                    <div className="flex items-center gap-1 text-sm text-slate-500 mb-3">
                                                        <MapPin className="w-3 h-3" />
                                                        {prop.address}
                                                    </div>
                                                    <div className="flex justify-between items-end border-t pt-3">
                                                        <div className="font-bold text-xl text-blue-700">{formatPrice(prop.price)}</div>
                                                        <div className="text-sm text-slate-600">
                                                            {prop.layout} / {prop.size}㎡
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </Link>
                                    ))
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="h-[600px] rounded-lg overflow-hidden">
                            <PropertyMap properties={filteredProperties} />
                        </div>
                    )}
                </div>
            </main>

            {/* Global Edit Modal */}
            <PropertyRegistrationModal
                key={editingProperty?.id || 'new'}
                initialData={editingProperty}
                open={isEditModalOpen}
                onOpenChange={(open) => {
                    setIsEditModalOpen(open);
                    if (!open) setEditingProperty(undefined); // Reset on close
                }}
            />
        </div>
    );
}
