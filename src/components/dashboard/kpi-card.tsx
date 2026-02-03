import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface KPICardProps {
    title: string;
    value: string | number;
    subValue?: string;
    icon: LucideIcon;
}

export function KPICard({ title, value, subValue, icon: Icon }: KPICardProps) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    {title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                {subValue && (
                    <p className="text-xs text-muted-foreground">
                        {subValue}
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
