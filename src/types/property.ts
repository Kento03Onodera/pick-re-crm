export type PropertyStatus = 'active' | 'negotiating' | 'sold';

export interface Property {
    id: string;
    name: string;
    address: string;
    price: number; // JPY
    layout: string; // e.g., '3LDK'
    size: number; // sqm
    builtYear: number; // Year built
    status: PropertyStatus;
    images: string[]; // URLs
    memo?: string; // Internal notes
    createdAt: Date | string; // Allow string for serializable dates (Firestore/JSON)
    updatedAt: Date | string;
}
