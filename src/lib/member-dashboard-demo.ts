/**
 * Demo member + plan fields for the profile dashboard (illustrative UI).
 * Replace with API-backed data when member services are wired.
 */

export interface DemoMemberDashboard {
  primaryName: string;
  sex: string;
  ageYears: number;
  statusLabel: string;
  coverage: string;
  dependentMemberName: string;
  memberId: string;
  pcpName: string;
  addressLine: string;
  dateOfBirth: string;
  planType: string;
  planGroup: string;
  planId: string;
  divisionId: string;
  planStart: string;
  planEnd: string;
  currentPcp: string;
  pcpNpi: string;
  pcpPhone: string;
  pcpProviderId: string;
}

/** Sample values aligned with the legacy portal screenshot (for layout review). */
export const demoMemberDashboard: DemoMemberDashboard = {
  primaryName: "SREEDHAR REDDY JUNUTULA",
  sex: "M",
  ageYears: 68,
  statusLabel: "Active",
  coverage: "Active",
  dependentMemberName: "JYOTHI JUNUTULA",
  memberId: "02048011901",
  pcpName: "SARAT BURRI",
  addressLine: "608 SPANISH MUSTANG DR, CEDAR PARK, TX, 78613",
  dateOfBirth: "12/1/1957",
  planType: "Sendero Health Original Silver 94",
  planGroup: "Sendero Health Plans",
  planId: "PLAN106-26",
  divisionId: "REGULAR",
  planStart: "01-01-2026",
  planEnd: "12-31-2026",
  currentPcp: "MD SARAT BURRI",
  pcpNpi: "1831325380",
  pcpPhone: "7372207500",
  pcpProviderId: "642196879",
};

export type DemoPieRow = { name: string; value: number };

export type DemoBarRow = { month: string; visits: number };

export const demoVisitMix: DemoPieRow[] = [
  { name: "Primary care", value: 42 },
  { name: "Specialty", value: 28 },
  { name: "Urgent / convenience", value: 18 },
  { name: "Other", value: 12 },
];

export const demoBenefitMix: DemoPieRow[] = [
  { name: "Medical", value: 55 },
  { name: "Pharmacy", value: 25 },
  { name: "Preventive", value: 20 },
];

export const demoMonthlyTouchpoints: DemoBarRow[] = [
  { month: "Nov", visits: 1 },
  { month: "Dec", visits: 2 },
  { month: "Jan", visits: 3 },
  { month: "Feb", visits: 1 },
  { month: "Mar", visits: 2 },
  { month: "Apr", visits: 2 },
];
