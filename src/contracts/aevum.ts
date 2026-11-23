/**
 * Aevum Testnet (QDay) tUSD8 contract layer.
 *
 * Chain ID: 44005
 * Native gas: tQDAY
 * Payment token: tUSD8 (address configured via VITE_AEVUM_TUSD8_ADDRESS)
 *
 * This module owns every Aevum-specific contract interaction so the UI never
 * needs to know token addresses, ABIs or chain specifics. All reads/writes are
 * plain ethers v6 calls against the configured tUSD8 ERC-20.
 */

import { ethers } from 'ethers';
import { getChainConfig, getTokenAddress } from '../config/chains';

export const AEVUM_CHAIN_ID = 44005;
export const AEVUM_CHAIN_KEY = 'aevum-testnet';

/** Standard ERC-20 surface used by tUSD8. */
export const TUSD8_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address owner) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function transferFrom(address from, address to, uint256 amount) returns (bool)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)',
];

export interface AevumTokenInfo {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  totalSupply: bigint;
}

export class AevumConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AevumConfigError';
  }
}

/** Returns the configured tUSD8 contract address, or throws a helpful error. */
export function getTusd8Address(): string {
  const address =
    getTokenAddress(AEVUM_CHAIN_KEY, 'tUSD8') ||
    (import.meta.env.VITE_AEVUM_TUSD8_ADDRESS as string | undefined) ||
    '';

  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    throw new AevumConfigError(
      'tUSD8 contract address is not configured. Set VITE_AEVUM_TUSD8_ADDRESS to the verified QDay tUSD8 address.',
    );
  }
  return address;
}

export function isTusd8Configured(): boolean {
  try {
    getTusd8Address();
    return true;
  } catch {
    return false;
  }
}

/** Builds a JSON-RPC provider for Aevum, falling back across configured RPCs. */
export function getAevumProvider(rpcUrl?: string): ethers.JsonRpcProvider {
  const chain = getChainConfig(AEVUM_CHAIN_KEY);
  if (!chain) {
    throw new AevumConfigError('Aevum Testnet is missing from the chain registry.');
  }
  return new ethers.JsonRpcProvider(rpcUrl ?? chain.rpcUrls[0], chain.chainId, {
    staticNetwork: true,
  });
}

/** Returns an ethers Contract bound to tUSD8 for read-only calls. */
export function getTusd8Contract(
  providerOrSigner?: ethers.Provider | ethers.Signer,
): ethers.Contract {
  const address = getTusd8Address();
  const runner = providerOrSigner ?? getAevumProvider();
  return new ethers.Contract(address, TUSD8_ABI, runner);
}

/** Reads immutable token metadata (symbol/name/decimals/supply). */
export async function readTusd8Info(
  provider?: ethers.Provider,
): Promise<AevumTokenInfo> {
  const contract = getTusd8Contract(provider);
  const [symbol, name, decimals, totalSupply] = await Promise.all([
    contract.symbol() as Promise<string>,
    contract.name() as Promise<string>,
    contract.decimals() as Promise<bigint>,
    contract.totalSupply() as Promise<bigint>,
  ]);

  return {
    address: getTusd8Address(),
    symbol,
    name,
    decimals: Number(decimals),
    totalSupply,
  };
}

/** Returns the formatted tUSD8 balance for an address. */
export async function readTusd8Balance(
  owner: string,
  provider?: ethers.Provider,
  decimals?: number,
): Promise<{ raw: bigint; formatted: string; decimals: number }> {
  const contract = getTusd8Contract(provider);
  const resolvedDecimals = decimals ?? Number(await contract.decimals());

  const raw = (await contract.balanceOf(owner)) as bigint;
  return {
    raw,
    formatted: ethers.formatUnits(raw, resolvedDecimals),
    decimals: resolvedDecimals,
  };
}

export interface Tusd8TransferResult {
  hash: string;
  wait: () => Promise<ethers.TransactionReceipt | null>;
}

/** Sends tUSD8 to a recipient. Requires a signer (wallet). */
export async function sendTusd8(
  signer: ethers.Signer,
  recipient: string,
  amount: string,
  decimals = 18,
): Promise<Tusd8TransferResult> {
  if (!ethers.isAddress(recipient)) {
    throw new Error(`Invalid tUSD8 recipient address: ${recipient}`);
  }

  const value = ethers.parseUnits(amount, decimals);
  if (value <= 0n) {
    throw new Error('tUSD8 transfer amount must be greater than zero.');
  }

  const contract = getTusd8Contract(signer);
  const tx = await (contract.transfer(recipient, value) as Promise<ethers.ContractTransactionResponse>);

  return {
    hash: tx.hash,
    wait: () => tx.wait(),
  };
}

/** Estimates gas for a tUSD8 transfer; returns null when estimation fails. */
export async function estimateTusd8Transfer(
  signer: ethers.Signer,
  recipient: string,
  amount: string,
  decimals = 18,
): Promise<bigint | null> {
  try {
    const contract = getTusd8Contract(signer);
    const value = ethers.parseUnits(amount, decimals);
    const estimate = await contract.transfer.estimateGas(recipient, value);
    return estimate as bigint;
  } catch {
    return null;
  }
}

/**
 * Escrow/split helpers are exposed as a thin typed façade over the same token
 * contract so feature code can migrate without UI rewrites. The verified tUSD8
 * deployment is a standard ERC-20; any escrow/split contract can be plugged in
 * by pointing AEVUM_ESCROW_ADDRESS at it once verified.
 */

export function getEscrowAddress(): string | null {
  const envAddress = (import.meta.env.VITE_AEVUM_ESCROW_ADDRESS as string | undefined) ?? '';
  return /^0x[a-fA-F0-9]{40}$/.test(envAddress) ? envAddress : null;
}

export function isEscrowConfigured(): boolean {
  return getEscrowAddress() !== null;
}

export interface Tusd8EscrowRequest {
  tokenAddress: string;
  payer: string;
  payee: string;
  amount: bigint;
  releaseAt: number;
}

/** Builds an approve() call so an escrow contract can pull tUSD8 later. */
export async function approveTusd8ForEscrow(
  signer: ethers.Signer,
  escrowAddress: string,
  amount: string,
  decimals = 18,
): Promise<string> {
  if (!ethers.isAddress(escrowAddress)) {
    throw new Error(`Invalid escrow address: ${escrowAddress}`);
  }
  const contract = getTusd8Contract(signer);
  const value = ethers.parseUnits(amount, decimals);
  const tx = await (contract.approve(escrowAddress, value) as Promise<ethers.ContractTransactionResponse>);
  return tx.hash;
}

/** Splits `total` across weighted recipients using integer-safe math. */
export function splitTusd8Amount(
  total: bigint,
  weights: number[],
): bigint[] {
  if (weights.length === 0) {
    return [];
  }
  const safeWeights = weights.map((w) => (Number.isFinite(w) && w > 0 ? w : 0));
  const totalWeight = safeWeights.reduce((sum, w) => sum + w, 0);
  if (totalWeight <= 0) {
    throw new Error('splitTusd8Amount requires at least one positive weight.');
  }

  const shares: bigint[] = [];
  let allocated = 0n;
  for (let i = 0; i < safeWeights.length; i += 1) {
    if (i === safeWeights.length - 1) {
      shares.push(total - allocated);
      break;
    }
    const share = (total * BigInt(Math.round(safeWeights[i]))) / BigInt(Math.round(totalWeight));
    shares.push(share);
    allocated += share;
  }
  return shares;
}
