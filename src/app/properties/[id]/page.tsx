"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Property } from "@/types/property";
import { MOCK_PROPERTIES } from "@/mocks/properties";
import { Header } from "@/components/layout/Header";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { MapPin, Calendar, Ruler, LayoutGrid, Building2, Wallet } from "lucide-react";

export default function PropertyDetailPage() {
    const params = useParams();
    const id = params.id as string;
    const [property, setProperty] = useState<Property | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeImage, setActiveImage] = useState<string>("");

    useEffect(() => {
        // Try to find in mock first (fastest for demo)
        const mockProp = MOCK_PROPERTIES.find(p => p.id === id);

        // Listen to Firestore
        const docRef = doc(db, "properties", id);
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = { id: docSnap.id, ...docSnap.data() } as Property;
                setProperty(data);
                if (data.images?.length > 0) setActiveImage(data.images[0]);
            } else if (mockProp) {
                // Return mock if DB doc invalid/missing but id matches mock
                setProperty(mockProp);
                if (mockProp.images?.length > 0) setActiveImage(mockProp.images[0]);
            } else {
                console.log("No property found");
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [id]);

    if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading...</div>;

    if (!property) return (
        <div className="min-h-screen bg-slate-50">
            <Header />
            <div className="p-8 text-center">物件が見つかりませんでした</div>
        </div>
    );

    const formatPrice = (price: number) => {
        return price.toLocaleString() + "円";
    };

    const formatPriceJapanese = (price: number) => {
        if (price >= 100000000) {
            const oku = Math.floor(price / 100000000);
            const man = Math.floor((price % 100000000) / 10000);
            return `${oku}億${man > 0 ? man + "万" : ""}円`;
        }
        return `${(price / 10000).toLocaleString()}万円`;
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active':
                return <Badge className="bg-emerald-500 text-base px-3 py-1">販売中</Badge>;
            case 'negotiating':
                return <Badge className="bg-orange-500 text-base px-3 py-1">商談中</Badge>;
            case 'sold':
                return <Badge className="bg-slate-500 text-base px-3 py-1">成約済</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-slate-50">
            <Header />

            <main className="flex-1 p-6 space-y-6 max-w-[1200px] mx-auto w-full">
                <Breadcrumbs
                    items={[
                        { label: "物件管理", href: "/properties" },
                        { label: property.name }
                    ]}
                />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column: Images */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="aspect-video bg-gray-200 rounded-xl overflow-hidden shadow-sm relative group">
                            {activeImage ? (
                                <img src={activeImage} alt={property.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-400">No Image</div>
                            )}
                            <div className="absolute top-4 left-4">
                                {getStatusBadge(property.status)}
                            </div>
                        </div>
                        {property.images && property.images.length > 0 && (
                            <div className="flex gap-2 overflow-x-auto pb-2">
                                {property.images.map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setActiveImage(img)}
                                        className={`w-24 h-16 rounded-lg overflow-hidden shrink-0 border-2 ${activeImage === img ? "border-blue-500" : "border-transparent"}`}
                                    >
                                        <img src={img} alt="" className="w-full h-full object-cover" />
                                    </button>
                                ))}
                                {/* Mock placeholders since we only have 1 image usually */}
                                {[...Array(3)].map((_, i) => (
                                    <div key={`p-${i}`} className="w-24 h-16 bg-gray-200 rounded-lg shrink-0" />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right Column: Key Info */}
                    <div className="lg:col-span-1 space-y-6">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 mb-2">{property.name}</h1>
                            <div className="flex items-start gap-2 text-slate-500">
                                <MapPin className="w-5 h-5 shrink-0 mt-0.5" />
                                <span>{property.address}</span>
                            </div>
                        </div>

                        <Separator />

                        <div>
                            <p className="text-sm text-slate-500 mb-1">販売価格</p>
                            <p className="text-4xl font-bold text-blue-700">{formatPriceJapanese(property.price)}</p>
                            <p className="text-sm text-slate-400 text-right">({formatPrice(property.price)})</p>
                        </div>

                        <Card>
                            <CardContent className="p-0">
                                <div className="divide-y">
                                    <div className="p-4 flex justify-between items-center">
                                        <div className="flex items-center gap-2 text-slate-600">
                                            <LayoutGrid className="w-5 h-5" />
                                            <span className="text-sm font-medium">間取り</span>
                                        </div>
                                        <span className="font-bold">{property.layout}</span>
                                    </div>
                                    <div className="p-4 flex justify-between items-center">
                                        <div className="flex items-center gap-2 text-slate-600">
                                            <Ruler className="w-5 h-5" />
                                            <span className="text-sm font-medium">専有面積</span>
                                        </div>
                                        <span className="font-bold">{property.size}㎡</span>
                                    </div>
                                    <div className="p-4 flex justify-between items-center">
                                        <div className="flex items-center gap-2 text-slate-600">
                                            <Calendar className="w-5 h-5" />
                                            <span className="text-sm font-medium">築年数</span>
                                        </div>
                                        <span className="font-bold">{property.builtYear}年</span>
                                    </div>
                                    <div className="p-4 flex justify-between items-center">
                                        <div className="flex items-center gap-2 text-slate-600">
                                            <Building2 className="w-5 h-5" />
                                            <span className="text-sm font-medium">坪単価</span>
                                        </div>
                                        <span className="font-bold">
                                            ≈ {Math.round(property.price / (property.size * 0.3025) / 10000).toLocaleString()}万円
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
                    <div className="md:col-span-2 space-y-6">
                        <section>
                            <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                                <span className="w-1 h-6 bg-blue-500 rounded-full"></span>
                                物件詳細情報
                            </h2>
                            <Card>
                                <CardContent className="p-6 grid grid-cols-2 gap-y-4 gap-x-8">
                                    <InfoRow label="所在地" value={property.address} fullWidth />
                                    <InfoRow label="交通" value="〇〇線 〇〇駅 徒歩〇〇分 (Mock)" fullWidth />
                                    <InfoRow label="構造/階数" value="RC造 (Mock)" />
                                    <InfoRow label="総戸数" value="100戸 (Mock)" />
                                    <InfoRow label="施工会社" value="〇〇建設 (Mock)" />
                                    <InfoRow label="管理会社" value="〇〇管理 (Mock)" />
                                </CardContent>
                            </Card>
                        </section>

                        <section>
                            <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                                <span className="w-1 h-6 bg-slate-500 rounded-full"></span>
                                社内メモ・備考
                            </h2>
                            <Card>
                                <CardContent className="p-6 bg-yellow-50/30">
                                    <p className="whitespace-pre-wrap text-slate-700 leading-relaxed">
                                        {property.memo || "メモはありません"}
                                    </p>
                                </CardContent>
                            </Card>
                        </section>
                    </div>
                </div>
            </main>
        </div>
    );
}

function InfoRow({ label, value, fullWidth = false }: { label: string; value: string; fullWidth?: boolean }) {
    return (
        <div className={`${fullWidth ? "col-span-2" : "col-span-1"}`}>
            <dt className="text-xs text-slate-500 mb-1">{label}</dt>
            <dd className="text-sm font-medium text-slate-900 border-b border-slate-100 pb-1">{value}</dd>
        </div>
    );
}
