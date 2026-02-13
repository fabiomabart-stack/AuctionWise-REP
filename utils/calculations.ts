
import { AuctionData, InvestmentResults, AppSettings } from "../types";

const parseLegalFees = (input: string, bid: number): number => {
  if (!input) return 0;
  
  const cleanInput = input.replace(/R\$/gi, '').replace(/\s/g, '');

  if (cleanInput.includes('%')) {
    const percentage = parseFloat(cleanInput.replace('%', '').replace(',', '.')) || 0;
    return bid * (percentage / 100);
  }

  const normalizedValue = cleanInput
    .replace(/\./g, '')
    .replace(',', '.');
    
  return parseFloat(normalizedValue) || 0;
};

export const calculateInvestment = (data: AuctionData, settings: AppSettings): InvestmentResults => {
  const bid = data.minBid2ndAuction;
  
  const commission = bid * (settings.auctioneerCommissionRate / 100);
  const itbi = bid * (settings.itbiRate / 100);
  const registry = bid * (settings.registryRate / 100);
  const legalFees = parseLegalFees(data.legalFeesInput, bid);
  
  const iptuAtAcquisition = data.iptuResponsible === 'Purchaser' ? data.iptuDebt : (data.iptuResponsible === 'Shared' ? data.iptuDebt / 2 : 0);
  const condoAtAcquisition = data.condoResponsible === 'Purchaser' ? data.condoDebt : (data.condoResponsible === 'Shared' ? data.condoDebt / 2 : 0);
  const otherAtAcquisition = data.otherDebtsResponsible === 'Purchaser' ? data.otherDebts : (data.otherDebtsResponsible === 'Shared' ? data.otherDebts / 2 : 0);
  
  const acquisitionTaxAndFees = commission + itbi + registry + legalFees + iptuAtAcquisition + condoAtAcquisition + otherAtAcquisition + data.evictionCost;
  const totalAcquisitionCost = bid + acquisitionTaxAndFees;
  
  const totalHoldingCosts = (data.monthlyCondoFee + data.monthlyTaxFee) * data.estimatedMonthsToResale;
  
  const totalInvestment = totalAcquisitionCost + data.estimatedRenovationCost + totalHoldingCosts;
  
  const sellingCommissionRateDecimal = data.sellingCommissionRate / 100;
  const sellingCommission = data.marketValue * sellingCommissionRateDecimal;
  const grossProfit = data.marketValue - totalInvestment - sellingCommission;
  
  const capitalGainsTax = grossProfit > 0 ? grossProfit * (settings.capitalGainsTaxRate / 100) : 0;
  const projectedProfit = grossProfit - capitalGainsTax;
  
  const roiPercent = totalInvestment > 0 ? (projectedProfit / totalInvestment) * 100 : 0;
  
  // Rentabilidade anualizada: (ROI / meses) * 12
  const annualizedRoi = data.estimatedMonthsToResale > 0 ? (roiPercent / data.estimatedMonthsToResale) * 12 : 0;
  
  const breakEvenPrice = totalInvestment / (1 - sellingCommissionRateDecimal);

  return {
    totalAcquisitionCost,
    totalInvestment,
    projectedProfit,
    roiPercent,
    annualizedRoi,
    breakEvenPrice,
    breakdown: {
      commission,
      itbi,
      registry,
      legalFees,
      holdingCosts: totalHoldingCosts,
      sellingCommission,
      otherDebtsAssumed: otherAtAcquisition,
      evictionCost: data.evictionCost
    }
  };
};

export const calculateMaxBidForBreakEven = (data: AuctionData, settings: AppSettings): number => {
  const variableRates = (settings.auctioneerCommissionRate + settings.itbiRate + settings.registryRate) / 100;
  
  const isLegalFeePercent = data.legalFeesInput.includes('%');
  const legalFeeRate = isLegalFeePercent ? (parseFloat(data.legalFeesInput.replace('%', '').replace(',', '.')) || 0) / 100 : 0;
  const fixedLegalFee = isLegalFeePercent ? 0 : parseLegalFees(data.legalFeesInput, 0);

  const iptuAtAcquisition = data.iptuResponsible === 'Purchaser' ? data.iptuDebt : (data.iptuResponsible === 'Shared' ? data.iptuDebt / 2 : 0);
  const condoAtAcquisition = data.condoResponsible === 'Purchaser' ? data.condoDebt : (data.condoResponsible === 'Shared' ? data.condoDebt / 2 : 0);
  const otherAtAcquisition = data.otherDebtsResponsible === 'Purchaser' ? data.otherDebts : (data.otherDebtsResponsible === 'Shared' ? data.otherDebts / 2 : 0);

  const fixedCosts = data.estimatedRenovationCost + 
                     ((data.monthlyCondoFee + data.monthlyTaxFee) * data.estimatedMonthsToResale) +
                     iptuAtAcquisition + condoAtAcquisition + otherAtAcquisition + fixedLegalFee + data.evictionCost;

  const sellingCommission = data.marketValue * (data.sellingCommissionRate / 100);
  
  const availableBudget = data.marketValue - sellingCommission - fixedCosts;
  const totalVariableRate = 1 + variableRates + legalFeeRate;

  return Math.max(0, availableBudget / totalVariableRate);
};

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};
