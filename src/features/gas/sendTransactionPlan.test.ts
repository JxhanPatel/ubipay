import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ethers } from 'ethers';
import { buildSendTransactionPlan, ERC20_TRANSFER_ABI } from '../../App';
import { getTokenAddress } from '../../config/chains';

const AEVUM_TESTNET_TUSD8_ADDRESS = '0xE5074CBbd046AFb491EB8692abD6cF7ECCC6dEE5';

describe('buildSendTransactionPlan', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_AEVUM_TUSD8_ADDRESS', AEVUM_TESTNET_TUSD8_ADDRESS);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('uses a native value transaction for USDC', () => {
    const plan = buildSendTransactionPlan(
      { key: 'usdc', symbol: 'USDC', balance: '1', decimals: 6 },
      '0x1111111111111111111111111111111111111111',
      '1.5',
    );

    expect(plan.kind).toBe('native');
    if (plan.kind !== 'native') {
      throw new Error('Expected native plan.');
    }
    expect(plan.tx).toEqual({
      to: '0x1111111111111111111111111111111111111111',
      value: ethers.parseUnits('1.5', 18),
    });
  });

  it('uses an ERC-20 transfer for non-USDC assets when the token address is present', () => {
    const plan = buildSendTransactionPlan(
      {
        key: '0x2222222222222222222222222222222222222222',
        symbol: 'EURC',
        balance: '2',
        decimals: 6,
      },
      '0x3333333333333333333333333333333333333333',
      '2.5',
    );

    expect(plan.kind).toBe('token');
    if (plan.kind !== 'token') {
      throw new Error('Expected token plan.');
    }
    expect(plan.tokenAddress).toBe('0x2222222222222222222222222222222222222222');
    expect(plan.abi).toEqual(ERC20_TRANSFER_ABI);
    expect(plan.args).toEqual([
      '0x3333333333333333333333333333333333333333',
      ethers.parseUnits('2.5', 6),
    ]);
  });

  it('throws a clear error when a non-USDC asset has no usable token contract address', () => {
    expect(() =>
      buildSendTransactionPlan(
        { key: 'not-an-address', symbol: 'tUSD8', balance: '2', decimals: 6 },
        '0x3333333333333333333333333333333333333333',
        '2.5',
      ),
    ).toThrow('Unable to determine the tUSD8 contract address.');
  });

  it('sends tQDAY natively on Aevum Testnet (kind=native, 18 decimals)', () => {
    const plan = buildSendTransactionPlan(
      { key: 'native-tqday', symbol: 'tQDAY', balance: '1', decimals: 18 },
      '0xE5074CBbd046AFb491EB8692abD6cF7ECCC6dEE5',
      '1.5',
      'aevum-testnet',
    );

    expect(plan.kind).toBe('native');
    if (plan.kind !== 'native') {
      throw new Error('Expected native plan.');
    }
    expect(plan.tx).toEqual({
      to: '0xE5074CBbd046AFb491EB8692abD6cF7ECCC6dEE5',
      value: ethers.parseUnits('1.5', 18),
    });
  });

  it('sends tUSD8 as ERC-20 token on Aevum Testnet using the configured contract address', () => {
    const envTUSD8 = getTokenAddress('aevum-testnet', 'tUSD8') ?? '';
    const plan = buildSendTransactionPlan(
      { key: 'tUSD8', symbol: 'tUSD8', balance: '2', decimals: 6 },
      '0xE5074CBbd046AFb491EB8692abD6cF7ECCC6dEE5',
      '2.5',
      'aevum-testnet',
    );

    expect(plan.kind).toBe('token');
    if (plan.kind !== 'token') {
      throw new Error('Expected token plan.');
    }
    expect(plan.tokenAddress).toBe(envTUSD8);
    expect(plan.abi).toEqual(ERC20_TRANSFER_ABI);
    expect(plan.args).toEqual([
      '0xE5074CBbd046AFb491EB8692abD6cF7ECCC6dEE5',
      ethers.parseUnits('2.5', 6),
    ]);
  });

  it('resolves tUSD8 via getTokenAddress fallback on Aevum when the asset key is not a hex address', () => {
    const envTUSD8 = getTokenAddress('aevum-testnet', 'tUSD8') ?? '';
    const plan = buildSendTransactionPlan(
      { key: 'tUSD8', symbol: 'tUSD8', balance: '2', decimals: 6 },
      '0xE5074CBbd046AFb491EB8692abD6cF7ECCC6dEE5',
      '2.5',
      'aevum-testnet',
    );

    expect(plan.kind).toBe('token');
    if (plan.kind !== 'token') {
      throw new Error('Expected token plan.');
    }
    expect(plan.tokenAddress).toBe(envTUSD8);
  });

  it('throws a clear error when the token address cannot be determined at all', () => {
    expect(() =>
      buildSendTransactionPlan(
        { key: 'not-an-address', symbol: 'EURC', balance: '2', decimals: 6 },
        '0xE5074CBbd046AFb491EB8692abD6cF7ECCC6dEE5',
        '2.5',
        'aevum-testnet',
      ),
    ).toThrow('Unable to determine the EURC contract address.');
  });
});
