/**
 * UbiPay Deep Link Utility
 * Parses and builds deep link URLs for UbiPay payment flows.
 * Supports both ubipay:// (primary) and arcpay:// (backward compatibility).
 */

export type DeepLinkType = 'pay' | 'request' | 'address';

export interface DeepLinkPayload {
  type: DeepLinkType;
  id: string;
  amount?: string;
  note?: string;
  chain?: string;
}

export interface DeepLinkParseResult {
  type: DeepLinkType;
  id: string;
  amount?: string;
  note?: string;
  chain?: string;
}

const SUPPORTED_PROTOCOLS = ['ubipay:', 'arcpay:'];

function parseDeepLinkUrl(rawInput: string): DeepLinkParseResult | null {
  const trimmed = String(rawInput ?? '').trim();
  if (!trimmed) {
    return null;
  }

  // Check if it's a raw address (0x...)
  const looksLikeAddress = /^0x[a-fA-F0-9]{40}$/.test(trimmed);
  if (looksLikeAddress) {
    return {
      type: 'address',
      id: trimmed,
    };
  }

  // Check if it's a deep link
  try {
    const parsed = new URL(trimmed);
    const protocol = parsed.protocol.toLowerCase();
    
    if (!SUPPORTED_PROTOCOLS.includes(protocol)) {
      return null;
    }

    const host = parsed.host.toLowerCase();
    const id = parsed.searchParams.get('id');
    const amount = parsed.searchParams.get('amount') ?? undefined;
    const note = parsed.searchParams.get('note') ?? undefined;
    const chain = parsed.searchParams.get('chain') ?? undefined;

    if (host === 'pay' && id) {
      return {
        type: 'pay',
        id,
        amount,
        note,
        chain,
      };
    }

    if (host === 'request' && id) {
      return {
        type: 'request',
        id,
        amount,
        note,
        chain,
      };
    }

    return null;
  } catch {
    return null;
  }
}

export function parseDeepLink(rawInput: string): DeepLinkParseResult | null {
  return parseDeepLinkUrl(rawInput);
}

export function buildDeepLink(params: DeepLinkPayload): string {
  const { type, id, amount, note, chain } = params;
  
  if (!id) {
    throw new Error('Deep link requires an id parameter');
  }

  const searchParams = new URLSearchParams();
  searchParams.set('id', id);
  if (amount) {
    searchParams.set('amount', amount);
  }
  if (note) {
    searchParams.set('note', note);
  }
  if (chain) {
    searchParams.set('chain', chain);
  }

  const queryString = searchParams.toString();
  return `ubipay://${type}?${queryString}`;
}

export function buildRequestLink(
  id: string,
  amount: string,
  note = '',
  chain?: string,
): string {
  if (!id || !amount) {
    return '';
  }

  const searchParams = new URLSearchParams();
  searchParams.set('id', id);
  searchParams.set('amount', amount);
  if (note) {
    searchParams.set('note', note);
  }
  if (chain) {
    searchParams.set('chain', chain);
  }

  return `ubipay://request?${searchParams.toString()}`;
}

export function buildPayLink(
  id: string,
  amount?: string,
  note?: string,
  chain?: string,
): string {
  if (!id) {
    return '';
  }

  const searchParams = new URLSearchParams();
  searchParams.set('id', id);
  if (amount) {
    searchParams.set('amount', amount);
  }
  if (note) {
    searchParams.set('note', note);
  }
  if (chain) {
    searchParams.set('chain', chain);
  }

  return `ubipay://pay?${searchParams.toString()}`;
}

export function isDeepLinkUrl(input: string): boolean {
  const trimmed = String(input ?? '').trim();
  if (!trimmed) return false;
  
  try {
    const parsed = new URL(trimmed);
    return SUPPORTED_PROTOCOLS.includes(parsed.protocol.toLowerCase());
  } catch {
    return false;
  }
}

export function isUbiPayUrl(input: string): boolean {
  const trimmed = String(input ?? '').trim();
  if (!trimmed) return false;
  
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol.toLowerCase() === 'ubipay:';
  } catch {
    return false;
  }
}

export function isArcPayUrl(input: string): boolean {
  const trimmed = String(input ?? '').trim();
  if (!trimmed) return false;
  
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol.toLowerCase() === 'arcpay:';
  } catch {
    return false;
  }
}