/*
 * FILE: /src/components/dashboard/index.ts
 * DESC: This file acts as a "barrel" to export all dashboard widgets
 * from a single, clean import path.
 */

export * from './KpiCard';
export * from './ChartPlaceholder'; // We can keep this for other roles for now
export * from './RecentLeadsTable';
export * from './NurturingKanban';
export * from './LeadsBySourceChart'; // Add new export
export * from './LeadTrendChart';      // Add new export
export * from './LeadsByLocationChart'; // New export
export * from './TargetVsActualChart'; // New export
export * from './PeerComparisonTable'; // New export

