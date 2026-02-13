
import { AppSettings } from './types';

export const DEFAULT_SETTINGS: AppSettings = {
  auctioneerCommissionRate: 5.0,     // 5% standard
  itbiRate: 3.0,                     // ~3% average in Brazil
  registryRate: 1.0,                 // ~1% for RGI/Deeds
  capitalGainsTaxRate: 15.0,         // 15% on profit
  defaultSellingCommissionRate: 5.0,  // 5% solicitado
};
