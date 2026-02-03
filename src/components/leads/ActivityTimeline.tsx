import { useState } from "react";
import { Activity, ActivityType } from "@/types/lead";
import { ActivityInputModal } from "./ActivityInputModal";
import { Phone, Mail, Users, FileText, Plus, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface ActivityTimelineProps {
    activities?: Activity[];
    leadId?: string;
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

export function ActivityTimeline({ activities = [], leadId }: ActivityTimelineProps) {
    // Sort by timestamp desc
    const sortedActivities = [...activities].sort((a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingActivity, setEditingActivity] = useState<Activity | null>(null);

    const handleEdit = (activity: Activity) => {
        setEditingActivity(activity);
        setIsModalOpen(true);
    };

    const handleDelete = async (activityId: string) => {
        if (!leadId || !confirm("この記録を削除してもよろしいですか？")) return;

        try {
            const leadRef = doc(db, "leads", leadId);
            const docSnap = await getDoc(leadRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                const currentActivities = data.activities as Activity[] || [];
                const updatedActivities = currentActivities.filter(a => a.id !== activityId);

                await updateDoc(leadRef, {
                    activities: updatedActivities,
                    updatedAt: new Date().toISOString()
                });
            }
        } catch (error) {
            console.error("Failed to delete activity", error);
            alert("削除に失敗しました。");
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingActivity(null);
    };

    return (
        <div className="bg-white border-l h-full flex flex-col w-[400px] shrink-0">
            <div className="p-4 border-b flex items-center justify-between bg-gray-50/50">
                <h3 className="font-semibold text-gray-900">営業記録</h3>
                <Button size="sm" className="h-8 gap-1" onClick={() => setIsModalOpen(true)}>
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
                            <div key={activity.id} className="group flex gap-4">
                                <div className="flex flex-col items-center">
                                    <ActivityIcon type={activity.type} />
                                    <div className="w-px h-full bg-gray-200 mt-2 min-h-[20px]" />
                                </div>
                                <div className="flex-1 pb-4">
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-gray-900">{activity.type}</span>
                                            <span className="text-xs text-gray-500">
                                                {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true, locale: ja })}
                                            </span>
                                        </div>

                                        {/* Actions Menu */}
                                        {leadId && (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <MoreHorizontal className="w-4 h-4 text-gray-400" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => handleEdit(activity)}>
                                                        <Pencil className="w-3.5 h-3.5 mr-2" />
                                                        編集
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => handleDelete(activity.id)}>
                                                        <Trash2 className="w-3.5 h-3.5 mr-2" />
                                                        削除
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        )}
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

            {leadId && (
                <ActivityInputModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    leadId={leadId}
                    initialData={editingActivity}
                />
            )}
        </div>
    );
}
