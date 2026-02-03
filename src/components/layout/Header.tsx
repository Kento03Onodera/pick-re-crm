"use client";

import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, LogOut, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";


export function Header() {
    const { signOut } = useAuth();
    const pathname = usePathname();

    return (
        <header className="bg-white border-b border-border h-[64px] px-6 flex items-center justify-between sticky top-0 z-50 shrink-0 shadow-sm">
            <div className="flex items-center gap-8">
                {/* Logo Section */}
                <div className="flex items-center gap-3">
                    <div className="bg-[#1d4ed8] text-white font-bold rounded-lg w-8 h-8 flex items-center justify-center text-[10px] tracking-tighter">CRM</div>
                    <span className="font-bold text-sm text-[#0f172a]">不動産CRM</span>
                </div>

                {/* Navigation */}
                <nav className="flex items-center gap-2">
                    <Link href="/leads">
                        <Button
                            variant="ghost"
                            className={cn(
                                "gap-2 h-9 text-xs font-medium rounded-md px-3 text-[#64748b] hover:text-[#0f172a] hover:bg-transparent",
                                pathname.startsWith("/leads") && "text-[#1d4ed8] bg-blue-50/50 hover:bg-blue-50/80 hover:text-[#1d4ed8]"
                            )}
                        >
                            <Users className="w-4 h-4" />
                            顧客一覧
                        </Button>
                    </Link>
                    <Link href="/properties">
                        <Button
                            variant="ghost"
                            className={cn(
                                "gap-2 h-9 text-xs font-medium rounded-md px-3 text-[#64748b] hover:text-[#0f172a] hover:bg-transparent",
                                pathname.startsWith("/properties") && "text-[#1d4ed8] bg-blue-50/50 hover:bg-blue-50/80 hover:text-[#1d4ed8]"
                            )}
                        >
                            <LayoutDashboard className="w-4 h-4" /> {/* Using LayoutDashboard for now, consider adding a specific icon for properties if available */}
                            物件管理
                        </Button>
                    </Link>
                    <Link href="/dashboard">
                        <Button
                            variant="ghost"
                            className={cn(
                                "gap-2 h-9 text-xs font-medium rounded-md px-3 text-[#64748b] hover:text-[#0f172a] hover:bg-transparent",
                                pathname.startsWith("/dashboard") && "text-[#1d4ed8] bg-blue-50/50 hover:bg-blue-50/80 hover:text-[#1d4ed8]"
                            )}
                        >
                            <LayoutDashboard className="w-4 h-4" />
                            ダッシュボード
                        </Button>
                    </Link>
                </nav>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4">
                <Link href="/settings/statuses">
                    <Button variant="ghost" size="icon" className="text-[#64748b] hover:text-[#0f172a] hover:bg-transparent" title="設定">
                        <Settings className="w-5 h-5" />
                    </Button>
                </Link>
                <Button
                    variant="ghost"
                    className="text-[#64748b] hover:text-[#0f172a] gap-2 h-9 text-xs font-medium px-2 hover:bg-transparent"
                    onClick={signOut}
                >
                    <LogOut className="w-4 h-4" />
                    ログアウト
                </Button>
            </div>
        </header>
    );
}
