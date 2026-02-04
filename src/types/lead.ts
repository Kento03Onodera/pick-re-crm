export type LeadStatus = "New" | "Sent" | "Scheduled" | "Viewed" | "Negotiating" | "Closed";

export interface StatusConfig {
    id: LeadStatus;
    label: string;
    color: string;
    order: number;
}

export const DEFAULT_STATUS_CONFIG: StatusConfig[] = [
    { id: "New", label: "新規", color: "#cbd5e1", order: 1 },
    { id: "Sent", label: "資料送付", color: "#8b5cf6", order: 2 },
    { id: "Scheduled", label: "案内予定", color: "#6366f1", order: 3 },
    { id: "Viewed", label: "内見済", color: "#3b82f6", order: 4 },
    { id: "Negotiating", label: "商談中", color: "#f59e0b", order: 5 },
    { id: "Closed", label: "成約", color: "#10b981", order: 6 },
];

// Fallback legacy maps (for partial migration safety, though we should prefer the hook)
export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
    "New": "新規",
    "Sent": "資料送付",
    "Scheduled": "案内予定",
    "Viewed": "内見済",
    "Negotiating": "商談中",
    "Closed": "成約",
};

export const LEAD_STATUSES: LeadStatus[] = [
    "New",
    "Sent",
    "Scheduled",
    "Viewed",
    "Negotiating",
    "Closed",
];

export interface Lead {
    id: string; // Document ID
    name: string;
    mail?: string; // mail in DB
    tel?: string; // tel in DB
    status: LeadStatus;
    leadType: 'Buy' | 'Sell'; // "Transaction Type"
    source?: string;
    createdAt: string; // ISO string
    updatedAt: string; // ISO string

    // Requirements
    budget: number;
    discountRate?: number; // 0.0 to 1.0 (or 100). Default 1.0
    areas: string[]; // Changed from preferredArea to areas
    propertyType?: string; // Legacy? Or keep as single preferred?
    desiredPropertyTypes?: string[]; // New Multi-select
    moveInDate?: string;

    // New Search Criteria
    size?: number; // sqm
    layout?: string[]; // Multi-select (e.g. 2LDK, 3LDK)
    builtYear?: number; // Year built (e.g. 5, 10, 20) -> "within N years"
    petsAllowed?: boolean;
    carOwned?: boolean; // Car owned
    parkingNeeded?: boolean; // Parking needed
    floorLevel?: string; // Desired floor (free text)

    isSearchRequested?: boolean; // Search Request (Checkbox)
    searchFrequency?: "3days" | "1week" | "2week";
    stations?: string[]; // Preferred Stations (1st, 2nd, 3rd)

    inquiredProperties?: {
        id: string;
        name: string;
        address: string;
        price: number;
        inquiredAt: string;
    }[];

    // Contact Logic
    priority: "High" | "Mid" | "Low";
    tags?: string[];

    // Family Info
    familyStructure?: string; // Changed from familyComposition
    age?: number;
    commTool?: string; // Contact Method (e.g. Line, Phone)
    nameKana?: string;

    // Agent assignment
    agentId?: string;
    agentName?: string;

    notes?: string;
    memo?: string; // Added memo

    // Kanban Position
    order?: number; // For drag and drop sorting within column

    activities?: Activity[];
}

export type ActivityType = "Call" | "Email" | "Meeting" | "Note" | "Visit";

export interface Activity {
    id: string;
    type: ActivityType;
    timestamp: string; // ISO string
    content: string;
    agentId?: string;
    agentName?: string;
}
