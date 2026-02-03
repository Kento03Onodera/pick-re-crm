"use client";

import { Activity, ActivityType } from "@/types/lead";
import { Phone, Mail, Users, FileText, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";

interface ActivityTimelineProps {
    activities?: Activity[];
}

const ActivityIcon = ({ type }: { type: ActivityType }) => {
    switch (type) {
        case "Call":
            return <div className="bg-blue-100 p-2 rounded-full text-blue-600"><Phone className="w-4 h-4" /></div>;
        case "Email":
            return <div className="bg-green-100 p-2 rounded-full text-green-600"><Mail className="w-4 h-4" /></div>;
        case "Visit":
        case "Meeting":
            return <div className="bg-purple-100 p-2 rounded-full text-purple-600"><Users className="w-4 h-4" /></div>;
        default:
            return <div className="bg-gray-100 p-2 rounded-full text-gray-600"><FileText className="w-4 h-4" /></div>;
    }
};

export function ActivityTimeline({ activities = [] }: ActivityTimelineProps) {
    // Sort by timestamp desc
    const sortedActivities = [...activities].sort((a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return (
        <div className="bg-white border-l h-full flex flex-col w-[400px] shrink-0">
            <div className="p-4 border-b flex items-center justify-between bg-gray-50/50">
                <h3 className="font-semibold text-gray-900">営業記録</h3>
                <Button size="sm" className="h-8 gap-1">
                    <Plus className="w-4 h-4" />
                    追加
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
                {sortedActivities.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground text-sm">記録がありません</div>
                ) : (
                    <div className="space-y-6">
                        {sortedActivities.map((activity) => (
                            <div key={activity.id} className="flex gap-4">
                                <div className="flex flex-col items-center">
                                    <ActivityIcon type={activity.type} />
                                    <div className="w-px h-full bg-gray-200 mt-2 min-h-[20px]" />
                                </div>
                                <div className="flex-1 pb-4">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm font-medium text-gray-900">{activity.type}</span>
                                        <span className="text-xs text-gray-500">
                                            {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true, locale: ja })}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
                                        {activity.content}
                                    </p>
                                    {activity.agentName && (
                                        <p className="text-xs text-gray-400 mt-2">by {activity.agentName}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
