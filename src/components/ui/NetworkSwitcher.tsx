import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Wallet } from 'lucide-react';
import arcLogo from '../../assets/arc.png';
import qdayLogo from '../../assets/qday.png';
import { getChainConfig, getAllChains } from '../../config/chains';

/**
 * Chain logo mapping — the chain's own mark, not a generic Wallet glyph.
 * arc.png: the blue gradient "A" arch for Arc Testnet.
 * qday.png: the white "Q" glyph for Aevum Testnet (QDay).
 */
const CHAIN_LOGO: Record<string, string> = {
  'arc-testnet': arcLogo,
  'aevum-testnet': qdayLogo,
};

type ChainKey = 'arc-testnet' | 'aevum-testnet';

interface NetworkSwitcherProps {
  activeChainKey: ChainKey;
  onSwitch: (chainId: ChainKey) => void;
}

/**
 * NetworkSwitcher — the pill-shaped chain selector beside the total balance.
 *
 * The active chain's own logo sits at the front of the pill; the dropdown
 * lists every registered chain with its logo, name, and chain ID. Selecting
 * a chain calls `onSwitch`, which the parent wires to refresh balances and
 * re-point the provider at the new RPC.
 */
export const NetworkSwitcher = ({ activeChainKey, onSwitch }: NetworkSwitcherProps) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const activeChain = getChainConfig(activeChainKey);
  const activeLogo = CHAIN_LOGO[activeChainKey];

  // Close on outside click or Escape — the dropdown is a menu, so it should
  // dismiss the way every other menu does.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Switch network"
        aria-haspopup="menu"
        aria-expanded={open}
        className="group inline-flex items-center gap-2 rounded-full border border-white/[0.06] bg-[#0F1115] py-1 pl-1.5 pr-3 transition-fast hover:border-[#C2885B]/40 hover:bg-[#C2885B]/[0.08] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C2885B]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#08090D]"
      >
        <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center">
          {activeLogo ? (
            <img
              src={activeLogo}
              alt=""
              className="h-[22px] w-[22px] rounded-full object-cover ring-1 ring-white/10"
            />
          ) : (
            <Wallet className="h-4 w-4 text-[#71717A]" />
          )}
        </span>
        <span className="text-xs font-medium text-[#A1A1AA] transition-fast group-hover:text-[#F5F3FF]">
          {activeChain?.shortName ?? 'Arc'}
        </span>
        <ChevronDown
          className={`h-3 w-3 text-[#71717A] transition-fast ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div
          className="arc-reveal absolute right-0 z-50 mt-1.5 w-[188px] rounded-xl border border-white/[0.08] bg-[#0F1115] overflow-hidden surface-with-border"
          role="menu"
          aria-label="Network selector"
        >
          <div className="px-3 pt-2.5 pb-1.5">
            <p className="subhead text-[#71717A]">Network</p>
          </div>
          <div className="pb-1">
            {getAllChains().map((chain) => {
              const logo = CHAIN_LOGO[chain.id];
              const isActive = chain.id === activeChainKey;
              return (
                <button
                  key={chain.id}
                  type="button"
                  role="menuitemradio"
                  aria-checked={isActive}
                  onClick={() => {
                    onSwitch(chain.id as ChainKey);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center gap-3 px-3 py-2 text-left transition-fast focus:outline-none focus-visible:bg-white/[0.06] ${
                    isActive ? 'bg-[#C2885B]/[0.06]' : 'hover:bg-white/[0.04]'
                  }`}
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center">
                    {logo ? (
                      <img
                        src={logo}
                        alt=""
                        className={`h-7 w-7 rounded-full object-cover ${
                          isActive ? 'ring-1 ring-[#C2885B]/60' : 'ring-1 ring-white/10'
                        }`}
                      />
                    ) : (
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.04]">
                        <Wallet className="h-3.5 w-3.5 text-[#71717A]" />
                      </span>
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className={`block truncate text-xs font-medium ${
                        isActive ? 'text-[#F5F3FF]' : 'text-[#D4D0D2]'
                      }`}
                    >
                      {chain.name}
                    </span>
                    <span className="block text-[10px] text-[#71717A] tabular-nums">
                      Chain ID: {chain.chainId}
                    </span>
                  </span>
                  {isActive && (
                    <span className="text-[10px] font-medium text-[#C2885B]">Active</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default NetworkSwitcher;