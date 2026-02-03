"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Header } from "@/components/layout/Header";
import { Users, Settings2 } from "lucide-react";

interface SettingsLayoutProps {
    children: React.ReactNode;
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
    const pathname = usePathname();

    const tabs = [
        {
            title: "ステータス設定",
            href: "/settings/statuses",
            icon: Settings2,
        },
        {
            title: "担当者設定",
            href: "/settings/agents",
            icon: Users,
        },
    ];

    return (
        <div className="flex flex-col h-screen bg-muted/40 overflow-hidden">
            <Header />

            {/* Sub-navigation (Tabs) */}
            <div className="bg-white border-b px-6">
                <div className="flex items-center gap-6">
                    {tabs.map((tab) => (
                        <Link key={tab.href} href={tab.href}>
                            <div
                                className={cn(
                                    "flex items-center gap-2 py-4 border-b-2 text-sm font-medium transition-colors",
                                    pathname === tab.href
                                        ? "border-blue-600 text-blue-600"
                                        : "border-transparent text-slate-500 hover:text-slate-900"
                                )}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.title}
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-8">
                <div className="max-w-4xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
