import { useQuery } from '@tanstack/react-query';
import { ticketApi } from '../services/api';

const TIER_NAMES = ['General', 'VIP', 'Premium'];
const TIER_CLASSES = ['tier-general', 'tier-vip', 'tier-premium'];

export default function MyTickets() {
  const { data: tickets, isLoading } = useQuery({
    queryKey: ['my-tickets'],
    queryFn: ticketApi.myTickets,
  });

  return (
    <div style={{ padding: 16, maxWidth: 480, margin: '0 auto' }}>
      <h2 style={{ marginBottom: 16 }}>🎫 My Tickets</h2>

      {isLoading && <p>Loading...</p>}

      {!isLoading && (!tickets || tickets.length === 0) && (
        <p style={{ color: 'var(--tg-theme-hint-color)' }}>
          No tickets yet. Browse events to get one!
        </p>
      )}

      {tickets?.map((ticket) => (
        <div key={ticket.id} className="ticket-card">
          <span className={`tier-badge ${TIER_CLASSES[ticket.tier]}`}>
            {TIER_NAMES[ticket.tier]}
          </span>
          <div style={{ marginTop: 8, fontSize: 12, color: 'var(--tg-theme-hint-color)' }}>
            Paid via {ticket.paymentChain.toUpperCase()} · {(ticket.pricePaid / 1e9).toFixed(2)} TON
          </div>
          <div style={{ marginTop: 4, fontSize: 12, color: 'var(--tg-theme-hint-color)' }}>
            Minted {new Date(ticket.mintedAt).toLocaleDateString()}
          </div>
          {ticket.checkedIn && (
            <div style={{ marginTop: 8, color: '#34c759', fontWeight: 600 }}>
              ✅ Checked in
            </div>
          )}
          {ticket.seatInfo && (
            <div style={{ marginTop: 4, fontSize: 14 }}>{ticket.seatInfo}</div>
          )}
        </div>
      ))}
    </div>
  );
}
