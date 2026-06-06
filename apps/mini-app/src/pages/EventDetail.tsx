import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { eventApi } from '../services/api';
import { useCrossChainSwap } from '../hooks/useCrossChainSwap';
import { useTonConnect } from '../hooks/useTonConnect';

const CHAINS = [
  { id: 'ton', name: 'TON', icon: '💎', tokens: ['TON', 'jUSDT', 'stTON'] },
  { id: 'ethereum', name: 'Ethereum', icon: '⟠', tokens: ['ETH', 'USDC', 'USDT'] },
  { id: 'polygon', name: 'Polygon', icon: '🟣', tokens: ['MATIC', 'USDC'] },
  { id: 'bnb', name: 'BNB Chain', icon: '🔶', tokens: ['BNB', 'USDT'] },
];

const TIERS = [
  { level: 0, name: 'General', multiplier: 1, color: '#2481cc' },
  { level: 1, name: 'VIP', multiplier: 2, color: '#ff9500' },
  { level: 2, name: 'Premium', multiplier: 5, color: '#7c3aed' },
];

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: event, isLoading } = useQuery({
    queryKey: ['event', id],
    queryFn: () => eventApi.get(id!),
    enabled: !!id,
  });
  const { connected, connect } = useTonConnect();
  const { getQuote, quoteData, quoteLoading, initiateSwap, swapData, swapLoading } = useCrossChainSwap();

  const [selectedChain, setSelectedChain] = useState('ton');
  const [selectedToken, setSelectedToken] = useState('TON');
  const [selectedTier, setSelectedTier] = useState(0);
  const [status, setStatus] = useState<'idle' | 'quoting' | 'confirming' | 'swapping' | 'minting' | 'done'>('idle');

  useEffect(() => {
    const chain = CHAINS.find((c) => c.id === selectedChain);
    if (chain) setSelectedToken(chain.tokens[0]);
  }, [selectedChain]);

  const handleGetQuote = async () => {
    if (!event) return;
    setStatus('quoting');
    try {
      await getQuote({
        eventId: event.id,
        tier: selectedTier,
        fromChain: selectedChain,
        fromToken: selectedToken,
      });
      setStatus('idle');
    } catch {
      setStatus('idle');
    }
  };

  const handlePurchase = async () => {
    if (!connected) {
      connect();
      return;
    }
    setStatus('swapping');
    try {
      await initiateSwap({
        eventId: event!.id,
        tier: selectedTier,
        fromChain: selectedChain,
        fromToken: selectedToken,
      });
      setStatus('done');
    } catch {
      setStatus('idle');
    }
  };

  if (isLoading) return <div style={{ padding: 16 }}>Loading...</div>;
  if (!event) return <div style={{ padding: 16 }}>Event not found</div>;

  const price = (event.basePrice / 1e9) * TIERS[selectedTier].multiplier;

  return (
    <div style={{ padding: 16, maxWidth: 480, margin: '0 auto' }}>
      <h2 style={{ marginBottom: 4 }}>{event.name}</h2>
      <p style={{ color: 'var(--tg-theme-hint-color)', marginBottom: 16 }}>
        {new Date(event.date).toLocaleDateString()} · {event.location}
      </p>

      {/* Tier selector */}
      <h3 style={{ marginBottom: 8 }}>Select Tier</h3>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {TIERS.map((tier) => (
          <button
            key={tier.level}
            onClick={() => setSelectedTier(tier.level)}
            style={{
              flex: 1,
              padding: 12,
              borderRadius: 8,
              border: selectedTier === tier.level ? `2px solid ${tier.color}` : '2px solid transparent',
              background: 'var(--tg-theme-secondary-bg-color)',
              cursor: 'pointer',
            }}
          >
            <div style={{ fontWeight: 600 }}>{tier.name}</div>
            <div style={{ fontSize: 14 }}>{price.toFixed(2)} TON</div>
          </button>
        ))}
      </div>

      {/* Chain selector */}
      <h3 style={{ marginBottom: 8 }}>Pay With</h3>
      <div className="chain-grid">
        {CHAINS.map((chain) => (
          <button
            key={chain.id}
            className={`chain-btn ${selectedChain === chain.id ? 'active' : ''}`}
            onClick={() => setSelectedChain(chain.id)}
          >
            <span className="chain-icon">{chain.icon}</span>
            <span className="chain-name">{chain.name}</span>
            {chain.id !== 'ton' && <span className="cross-chain-badge">⚡ Cross-chain</span>}
          </button>
        ))}
      </div>

      {/* Token selector */}
      <select
        value={selectedToken}
        onChange={(e) => setSelectedToken(e.target.value)}
        style={{ width: '100%', padding: 12, borderRadius: 8, marginTop: 12, marginBottom: 16 }}
      >
        {CHAINS.find((c) => c.id === selectedChain)?.tokens.map((token) => (
          <option key={token} value={token}>{token}</option>
        ))}
      </select>

      {/* Quote */}
      {quoteData && (
        <div className="quote-card">
          <div className="quote-row">
            <span>You pay:</span>
            <span>{quoteData.fromAmount} {selectedToken}</span>
          </div>
          <div className="quote-row">
            <span>Ticket price:</span>
            <span>{price.toFixed(2)} TON</span>
          </div>
          <div className="quote-row">
            <span>Network fee:</span>
            <span>~0.05 TON</span>
          </div>
          <div className="quote-row">
            <span>Est. time:</span>
            <span>{selectedChain === 'ton' ? '~5 sec' : '~30-120 sec'}</span>
          </div>
          {selectedChain !== 'ton' && (
            <div style={{ fontSize: 12, color: 'var(--tg-theme-hint-color)', marginTop: 8 }}>
              ⚡ Powered by STON.fi Omniston — atomic cross-chain swap
            </div>
          )}
        </div>
      )}

      {/* Purchase button */}
      <button
        className="purchase-btn"
        onClick={handlePurchase}
        disabled={status !== 'idle'}
      >
        {status === 'quoting' && 'Getting best price...'}
        {status === 'swapping' && 'Processing swap...'}
        {status === 'done' && '✅ Ticket minted!'}
        {status === 'idle' && (!connected ? 'Connect Wallet' : `Pay ${price.toFixed(2)} TON`)}
      </button>
    </div>
  );
}
