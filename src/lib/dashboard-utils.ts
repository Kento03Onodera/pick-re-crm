
import { Lead, LEAD_STATUSES } from "@/types/lead";
import { calculateEstimatedRevenue } from "@/utils/calculations";

export interface DashboardMetrics {
    // Card 1: Monthly Target
    currentMonthTarget: number;
    currentMonthRevenue: number; // Closed deals this month
    achievementRate: number;
    momRevenue: number; // Month-over-Month growth rate

    // Card 2: Monthly Forecast
    currentMonthForecast: number; // Closed + Expected (Negotiating/Scheduled/Viewed)
    currentMonthClosed: number; // Same as above revenue (for display)
    currentMonthExpected: number; // Pipeline part

    // Card 3: Total Revenue
    yearTotalRevenue: number;
    yearTotalTarget: number;
}

export interface PipelineDataPoint {
    name: string; // Agent Name
    // Keys for each status: value or count
    New: number;
    Sent: number;
    Scheduled: number;
    Viewed: number;
    Negotiating: number;
    Closed: number;
}

export const calculateMetrics = (leads: Lead[], targets: Record<string, number>): DashboardMetrics => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-11
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    // Targets
    // Target keys are likely "1".."12" based on TargetEditModal logic
    const currentMonthTarget = targets[String(currentMonth + 1)] || 0;
    const yearTotalTarget = Object.values(targets).reduce((a, b) => a + b, 0);

    let currentMonthRevenue = 0;
    let currentMonthExpected = 0;
    let yearTotalRevenue = 0;
    let lastMonthRevenue = 0;

    leads.forEach(lead => {
        const value = calculateEstimatedRevenue(lead);
        const updatedDate = new Date(lead.updatedAt);
        const isCurrentMonth = updatedDate.getMonth() === currentMonth && updatedDate.getFullYear() === currentYear;
        const isLastMonth = updatedDate.getMonth() === lastMonth && updatedDate.getFullYear() === lastMonthYear;
        const isCurrentYear = updatedDate.getFullYear() === currentYear;

        // 1. Revenue (Closed)
        if (lead.status === 'Closed') {
            if (isCurrentYear) {
                yearTotalRevenue += value;
            }
            if (isCurrentMonth) {
                currentMonthRevenue += value;
            }
            if (isLastMonth) {
                lastMonthRevenue += value;
            }
        }

        // 2. Expected (Pipeline - Active deals)
        // Definition: "今月見込み" (This Month Forecast)
        // Assuming all currently active deals are potential for "This Month" or general pipeline.
        // User asked for "成約済み + 見込み". 
        // We will sum Closed (This Month) + Active (All).
        // Refinement: If lead is active, it's "Expected".
        if (['Negotiating', 'Scheduled', 'Viewed'].includes(lead.status)) {
            currentMonthExpected += value;
        }
    });

    const achievementRate = currentMonthTarget > 0 ? (currentMonthRevenue / currentMonthTarget) * 100 : 0;

    // MoM Calculation
    let momRevenue = 0;
    if (lastMonthRevenue > 0) {
        momRevenue = ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100;
    } else if (currentMonthRevenue > 0) {
        momRevenue = 100; // 0 to something is infinite, cap at 100 or show as new
    }

    return {
        currentMonthTarget,
        currentMonthRevenue,
        achievementRate,
        momRevenue,
        currentMonthForecast: currentMonthRevenue + currentMonthExpected,
        currentMonthClosed: currentMonthRevenue,
        currentMonthExpected,
        yearTotalRevenue,
        yearTotalTarget,
    };
};

export const calculatePipelineData = (leads: Lead[], mode: 'amount' | 'count'): PipelineDataPoint[] => {
    const agentMap: Record<string, PipelineDataPoint> = {};

    leads.forEach(lead => {
        const agent = lead.agentName || "Unknown";
        if (!agentMap[agent]) {
            agentMap[agent] = {
                name: agent,
                New: 0,
                Sent: 0,
                Scheduled: 0,
                Viewed: 0,
                Negotiating: 0,
                Closed: 0,
            };
        }

        const value = mode === 'amount' ? calculateEstimatedRevenue(lead) : 1;

        // TypeScript safe access if status matches keys
        if (LEAD_STATUSES.includes(lead.status)) {
            agentMap[agent][lead.status] += value;
        }
    });

    return Object.values(agentMap);
};

export const getRecentWins = (leads: Lead[]): Lead[] => {
    return leads
        .filter(l => l.status === 'Closed')
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 5);
};
