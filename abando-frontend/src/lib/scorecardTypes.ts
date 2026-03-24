export type PublicScorecard = {
  domain: string;
  slug: string;
  publicUrl: string;
  conversion?: string;
  shopifyMedian?: string;
  revenueOpportunityCents: number;
  revenueOpportunityDisplay: string;
  opportunityBreakdown?: Record<string, number>;
  topFindings?: string[];
  installPath: string;
  createdAt?: string;
  benchmarkSummary?: string | null;
  checkoutScore?: number;
  confidence?: string | null;
  source?: {
    scoreBand?: string;
    componentBreakdown?: Record<string, number>;
  } | null;
};
