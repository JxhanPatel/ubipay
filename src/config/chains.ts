/**
 * UbiPay Multichain Registry
 * Centralized chain configuration for Arc Testnet and Aevum Testnet.
 */

export interface ChainConfig {
  id: string;
  name: string;
  shortName: string;
  chainId: number;
  rpcUrls: string[];
  explorerUrl: string;
  apiUrl?: string;
  nativeCurrency: {
    symbol: string;
    name: string;
    decimals: number;
  };
  supportedTokens: string[];
  tokenAddresses?: Record<string, string>;
  arcNameSupported?: boolean;
}

export const CHAIN_REGISTRY: Record<string, ChainConfig> = {
  'arc-testnet': {
    id: 'arc-testnet',
    name: 'Arc Testnet',
    shortName: 'Arc',
    chainId: 5042002,
    rpcUrls: [
      'https://rpc.testnet.arc.network',
      'https://5042002.rpc.thirdweb.com',
    ],
    explorerUrl: 'https://testnet.arcscan.app',
    apiUrl: 'https://explorer.testnet.arc.io/api/v2',
    nativeCurrency: {
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 18,
    },
    supportedTokens: ['USDC', 'EURC', 'cirBTC'],
    tokenAddresses: {
      USDC: '0x3600000000000000000000000000000000000000',
      EURC: '0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a',
      cirBTC: '0xf0C4a4CE82A5746AbAAd9425360Ab04fbBA432BF',
    },
    arcNameSupported: true,
  },
  'aevum-testnet': {
    id: 'aevum-testnet',
    name: 'Aevum Testnet (QDay)',
    shortName: 'Aevum',
    chainId: 44005,
    rpcUrls: [
      'https://rpc-test.qday.info',
    ],
    explorerUrl: 'https://explorer-test.qday.info',
    apiUrl: 'https://explorer-test.qday.info/api/v2',
    nativeCurrency: {
      symbol: 'tQDAY',
      name: 'Test QDAY',
      decimals: 18,
    },
    supportedTokens: ['tUSD8', 'tQDAY'],
    tokenAddresses: {
      tUSD8: import.meta.env.VITE_AEVUM_TUSD8_ADDRESS ?? '',
      tQDAY: 'native',
    },
    arcNameSupported: false,
  },
} as const;

export type ChainId = keyof typeof CHAIN_REGISTRY;

export const DEFAULT_CHAIN_ID: ChainId = 'arc-testnet';

export function getChainConfig(chainIdOrName: string): ChainConfig | null {
  const normalized = chainIdOrName.toLowerCase().trim();
  
  // Try direct ID match first
  if (CHAIN_REGISTRY[normalized]) {
    return CHAIN_REGISTRY[normalized];
  }
  
  // Try chain ID numeric match
  const numericId = Number(normalized);
  if (!Number.isNaN(numericId)) {
    for (const chain of Object.values(CHAIN_REGISTRY)) {
      if (chain.chainId === numericId) {
        return chain;
      }
    }
  }
  
  // Try short name match
  for (const chain of Object.values(CHAIN_REGISTRY)) {
    if (chain.shortName.toLowerCase() === normalized) {
      return chain;
    }
  }
  
  return null;
}

export function getChainConfigByChainId(chainId: number): ChainConfig | null {
  for (const chain of Object.values(CHAIN_REGISTRY)) {
    if (chain.chainId === chainId) {
      return chain;
    }
  }
  return null;
}

export function getExplorerUrl(chainIdOrName: string): string {
  const chain = getChainConfig(chainIdOrName);
  return chain?.explorerUrl ?? '';
}

export function formatTxExplorerUrl(chainIdOrName: string, txHash: string): string {
  const baseUrl = getExplorerUrl(chainIdOrName);
  if (!baseUrl) return '';
  return `${baseUrl}/tx/${txHash}`;
}

export function formatAddressExplorerUrl(chainIdOrName: string, address: string): string {
  const baseUrl = getExplorerUrl(chainIdOrName);
  if (!baseUrl) return '';
  return `${baseUrl}/address/${address}`;
}

export function getSupportedTokens(chainIdOrName: string): string[] {
  const chain = getChainConfig(chainIdOrName);
  return chain?.supportedTokens ?? [];
}

export function getTokenAddress(chainIdOrName: string, symbol: string): string | undefined {
  const chain = getChainConfig(chainIdOrName);
  if (!chain?.tokenAddresses) return undefined;
  return chain.tokenAddresses[symbol.toUpperCase()];
}

export function isArcNameSupported(chainIdOrName: string): boolean {
  const chain = getChainConfig(chainIdOrName);
  return chain?.arcNameSupported ?? false;
}

export function getAllChainIds(): ChainId[] {
  return Object.keys(CHAIN_REGISTRY) as ChainId[];
}

export function getAllChains(): ChainConfig[] {
  return Object.values(CHAIN_REGISTRY);
}
