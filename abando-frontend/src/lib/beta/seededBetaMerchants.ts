export type BetaMerchantStatus =
  | "invited"
  | "scorecard_viewed"
  | "install_started"
  | "connected"
  | "active_beta";

export type BetaMerchantRecord = {
  merchantName: string;
  shopDomain: string;
  status: BetaMerchantStatus;
  scorecardViewed: boolean;
  installStarted: boolean;
  installCompleted: boolean;
  dashboardVisited: boolean;
  notes: string;
};

export const seededBetaMerchants: BetaMerchantRecord[] = [
  {
    merchantName: "Northstar Outdoors",
    shopDomain: "northstar-outdoors.myshopify.com",
    status: "connected",
    scorecardViewed: true,
    installStarted: true,
    installCompleted: true,
    dashboardVisited: true,
    notes: "Connected successfully. Waiting for more live checkout activity before deeper review.",
  },
  {
    merchantName: "Forge Fitness Co",
    shopDomain: "forge-fitnessco.myshopify.com",
    status: "install_started",
    scorecardViewed: true,
    installStarted: true,
    installCompleted: false,
    dashboardVisited: false,
    notes: "Viewed scorecard and started install. Follow up if Shopify approval is not completed.",
  },
  {
    merchantName: "Cuts Clothing",
    shopDomain: "cutsclothing.com",
    status: "scorecard_viewed",
    scorecardViewed: true,
    installStarted: false,
    installCompleted: false,
    dashboardVisited: false,
    notes: "Public-domain lead. Needs real myshopify domain before install can begin.",
  },
];

export function statusLabel(status: BetaMerchantStatus) {
  switch (status) {
    case "invited":
      return "Invited";
    case "scorecard_viewed":
      return "Scorecard viewed";
    case "install_started":
      return "Install started";
    case "connected":
      return "Connected";
    case "active_beta":
      return "Active beta";
    default:
      return status;
  }
}

export function summarizeBetaMerchants(records: BetaMerchantRecord[]) {
  return records.reduce<Record<BetaMerchantStatus, number>>(
    (acc, record) => {
      acc[record.status] += 1;
      return acc;
    },
    {
      invited: 0,
      scorecard_viewed: 0,
      install_started: 0,
      connected: 0,
      active_beta: 0,
    },
  );
}
