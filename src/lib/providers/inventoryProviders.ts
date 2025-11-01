export type InventoryProviderKey = 'carsforsale' | 'automanager' | 'autoraptor' | 'dealercenter' | 'dealeron' | 'trailerops' | 'vauto' | 'dealercarsearch' | 'dealerinspire' | 'dealerslink';

export interface InventoryProvider {
  name: string;
  toEmail: string;
  ftpHost: string;
  ftpUser: string;
  ftpPass: string;
  filenameConvention: (dealerName: string) => string;
  customFilenameFormat?: string; // Optional custom format for specific providers
  requiresCustomId?: boolean; // Flag to show custom ID input field
}

export const inventoryProviders: Record<InventoryProviderKey, InventoryProvider> = {
  carsforsale: {
    name: 'CarsforSale',
    toEmail: 'uniqueleverage@icloud.com', // TEST EMAIL - Change back to 'exports@carsforsale.com' for production
    ftpHost: 'uniqueleverage.com',
    ftpUser: 'carsforsale@uniqueleverage.com',
    ftpPass: 'DetroitMotorCity',
    filenameConvention: (dealerName: string) => dealerName.replace(/\s+/g, '') + '.csv'
  },
  automanager: {
    name: 'AutoManager',
    toEmail: 'exports@automanager.com',
    ftpHost: 'uniqueleverage.com',
    ftpUser: 'automanager@uniqueleverage.com',
    ftpPass: 'DetroitMotorCity',
    filenameConvention: (dealerName: string) => dealerName.replace(/\s+/g, '') + '.csv'
  },
  autoraptor: {
    name: 'AutoRaptor',
    toEmail: 'support@autoraptor.com',
    ftpHost: 'uniqueleverage.com',
    ftpUser: 'autoraptor@uniqueleverage.com',
    ftpPass: 'DetroitMotorCity',
    filenameConvention: (dealerName: string) => dealerName.replace(/\s+/g, '') + '.csv'
  },
  dealercenter: {
    name: 'DealerCenter',
    toEmail: 'exports@dealercenter.com',
    ftpHost: 'uniqueleverage.com',
    ftpUser: 'dealercenter@uniqueleverage.com',
    ftpPass: 'DetroitMotorCity',
    filenameConvention: (dealerName: string) => dealerName.replace(/\s+/g, '') + '.csv'
  },
  dealeron: {
    name: 'DealerOn',
    toEmail: 'help@dealeron.com',
    ftpHost: 'uniqueleverage.com',
    ftpUser: 'dealeron@uniqueleverage.com',
    ftpPass: 'DetroitMotorCity',
    filenameConvention: (dealerName: string) => dealerName.replace(/\s+/g, '') + '.csv'
  },
  trailerops: {
    name: 'TrailerOps',
    toEmail: 'danny@trailerops.com',
    ftpHost: 'uniqueleverage.com',
    ftpUser: 'trailerops@uniqueleverage.com',
    ftpPass: 'DetroitMotorCity',
    filenameConvention: (dealerName: string) => dealerName.replace(/\s+/g, '') + '.csv'
  },
  vauto: {
    name: 'vAuto',
    toEmail: 'vat.exports@coxautoinc.com',
    ftpHost: 'uniqueleverage.com',
    ftpUser: 'vauto@uniqueleverage.com',
    ftpPass: 'DetroitMotorCity',
    filenameConvention: (dealerName: string) => dealerName.replace(/\s+/g, '') + '.csv'
  },
  dealercarsearch: {
    name: 'DealerCarSearch',
    toEmail: 'exports@dealercarsearch.com',
    ftpHost: 'uniqueleverage.com',
    ftpUser: 'dealercarsearch@uniqueleverage.com',
    ftpPass: 'DetroitMotorCity',
    filenameConvention: (dealerName: string) => dealerName.replace(/\s+/g, '') + '.csv',
    customFilenameFormat: 'DCS_Inventory{dcsId}.csv', // Custom format for Dealercarsearch
    requiresCustomId: true // Show DCS ID input field
  },
  dealerinspire: {
    name: 'Dealer Inspire',
    toEmail: 'support@dealerinspire.com',
    ftpHost: 'uniqueleverage.com',
    ftpUser: 'dealerinspire@uniqueleverage.com',
    ftpPass: 'DetroitMotorCity',
    filenameConvention: (dealerName: string) => dealerName.replace(/\s+/g, '') + '.csv'
  },
  dealerslink: {
    name: 'Dealers Link',
    toEmail: 'support@dealerslink.com',
    ftpHost: 'uniqueleverage.com',
    ftpUser: 'dealerslink@uniqueleverage.com',
    ftpPass: 'DetroitMotorCity',
    filenameConvention: (dealerName: string) => dealerName.replace(/\s+/g, '') + '.csv'
  }
};

export function getInventoryProvider(key: InventoryProviderKey): InventoryProvider {
  const provider = inventoryProviders[key];
  if (!provider) {
    throw new Error(`Unknown inventory provider: ${key}`);
  }
  return provider;
}
