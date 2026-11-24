import { describe, expect, it } from 'vitest';
import {
  cancelFetch,
  isLatestRefresh,
  resetNativeAssetPlaceholder,
} from './fetchUtils';

describe('fetchUtils', () => {
  it('cancelFetch aborts an AbortController', () => {
    const controller = new AbortController();
    expect(() => cancelFetch(controller)).not.toThrow();
  });

  it('cancelFetch does nothing for null', () => {
    expect(() => cancelFetch(null)).not.toThrow();
  });

  it('resetNativeAssetPlaceholder builds correct placeholder entry', () => {
    const p = resetNativeAssetPlaceholder('USDC', 6);
    expect(p.key).toBe('native-usdc');
    expect(p.symbol).toBe('USDC');
    expect(p.balance).toBe('0');
    expect(p.decimals).toBe(6);
  });

  it('isLatestRefresh returns true only for matching generations', () => {
    expect(isLatestRefresh(5, 5)).toBe(true);
    expect(isLatestRefresh(5, 4)).toBe(false);
    expect(isLatestRefresh(7, 5)).toBe(false);
  });
});