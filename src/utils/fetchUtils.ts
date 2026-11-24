// src/utils/fetchUtils.ts

/**
 * Abort an in-flight fetch via its AbortController, ignoring null/undefined.
 * Used by refresh paths so a superseded switch can cancel a stale request.
 */
export const cancelFetch = (controller: AbortController | null): void => {
  if (controller) {
    controller.abort();
  }
};

/**
 * Build the native-currency placeholder asset entry used to reset holdings
 * state immediately after an account or network switch, before the new
 * fetch resolves. This prevents phantom balances from the previous wallet
 * or chain from being displayed while the refresh is in flight.
 */
export const resetNativeAssetPlaceholder = (nativeSymbol: string, decimals: number) => ({
  key: `native-${nativeSymbol.toLowerCase()}`,
  symbol: nativeSymbol,
  balance: '0',
  decimals,
});

/**
 * Returns true only when `generation` is the most recent refresh generation
 * issued (`currentGeneration`). Superseded refreshes (from an earlier account
 * or network switch whose response arrives late) must be discarded so they
 * can never overwrite the current wallet's balances.
 */
export const isLatestRefresh = (generation: number, currentGeneration: number): boolean => {
  return generation === currentGeneration;
};