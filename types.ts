
export interface AuctionData {
  address: string;
  buildingName?: string;
  appraisalValue: number;
  minBid2ndAuction: number;
  auctionDate: string;
  auctionType: 'Judicial' | 'Extrajudicial' | 'Unknown';
  iptuDebt: number;
  iptuResponsible: 'Purchaser' | 'Seller' | 'Shared' | 'Unknown';
  condoDebt: number;
  condoResponsible: 'Purchaser' | 'Seller' | 'Shared' | 'Unknown';
  otherDebts: number;
  otherDebtsResponsible: 'Purchaser' | 'Seller' | 'Shared' | 'Unknown';
  occupancyStatus: 'Occupied' | 'Vacant' | 'Unknown';
  evictionCost: number;
  rgiInfo: string;
  marketValue: number;
  monthlyCondoFee: number;
  monthlyTaxFee: number;
  estimatedRenovationCost: number;
  estimatedMonthsToResale: number;
  sellingCommissionRate: number;
  legalFeesInput: string;
  attentionNotes: string;
}

export interface AppSettings {
  auctioneerCommissionRate: number;
  itbiRate: number;
  registryRate: number;
  capitalGainsTaxRate: number;
  defaultSellingCommissionRate: number;
}

export interface InvestmentResults {
  totalAcquisitionCost: number;
  totalInvestment: number;
  projectedProfit: number;
  roiPercent: number;
  annualizedRoi: number;
  breakEvenPrice: number;
  breakdown: {
    commission: number;
    itbi: number;
    registry: number;
    legalFees: number;
    holdingCosts: number;
    sellingCommission: number;
    otherDebtsAssumed: number;
    evictionCost: number;
  };
}

export interface AnalysisHistory {
  id: string;
  date: string;
  data: AuctionData;
  results: InvestmentResults;
  settings: AppSettings;
}

export interface User {
  id: string;
  email: string;
  username: string;
  password?: string;
  isActive: boolean;
  isAdmin: boolean;
  createdAt: string;
}
