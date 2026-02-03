"use client";

import { useState, useEffect, useRef } from "react";
import { useAgents, Agent } from "@/hooks/use-agents";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";

export default function SettingsAgentsPage() {
    const { agents, loading } = useAgents();

    return (
        <div className="space-y-6">
            <Breadcrumbs items={[{ label: "設定" }, { label: "担当者設定" }]} />
            <div>
                <h1 className="text-2xl font-bold tracking-tight">担当者設定</h1>
                <p className="text-muted-foreground mt-2">
                    リードに割り当てる担当者を管理します。
                </p>
            </div>

            <Separator />

            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">担当者一覧</CardTitle>
                        <CardDescription>
                            サインアップ済みのユーザーが自動的に表示されます。<br />
                            担当者の追加は、新しいユーザーにサインアップを依頼してください。
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {agents.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground text-sm">
                                担当者が登録されていません。
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {agents.map((agent) => (
                                    <div key={agent.id} className="flex items-center justify-between p-4 border rounded-lg bg-white shadow-sm">
                                        <div className="flex items-center gap-4">
                                            <Avatar>
                                                <AvatarImage src={agent.avatarUrl} />
                                                <AvatarFallback>{(agent.lastName && agent.lastName[0]) || (agent.name && agent.name[0]) || "?"}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-medium text-sm">{agent.name}</p>
                                                <p className="text-xs text-muted-foreground">{agent.email}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
