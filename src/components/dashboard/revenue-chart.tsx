"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface RevenueChartProps {
    data: {
        name: string;
        total: number;
    }[]
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(value);
};

export function RevenueChart({ data }: RevenueChartProps) {
    return (
        <Card className="col-span-4">
            <CardHeader>
                <CardTitle>Estimated Revenue by Agent (Mock)</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
                <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={data}>
                        <XAxis
                            dataKey="name"
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `¥${value / 10000}万`}
                        />
                        <Tooltip
                            formatter={(value: number | string | Array<number | string> | undefined) => {
                                if (typeof value === 'number') {
                                    return formatCurrency(value);
                                }
                                return String(value);
                            }}
                            cursor={{ fill: 'transparent' }}
                        />
                        <Bar
                            dataKey="total"
                            fill="currentColor"
                            radius={[4, 4, 0, 0]}
                            className="fill-primary"
                            name="Estimated Revenue"
                        />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}
