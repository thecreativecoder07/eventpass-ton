import { useQuery } from '@tanstack/react-query';
import { eventApi } from '../services/api';

export default function Discover() {
  const { data: events, isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: eventApi.list,
  });

  return (
    <div style={{ padding: '16px', maxWidth: 480, margin: '0 auto' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>🎟️ EventPass</h1>
      <p style={{ color: 'var(--tg-theme-hint-color)', marginBottom: 24 }}>
        Cross-chain event tickets on TON
      </p>

      {isLoading && <p>Loading events...</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {events?.map((event) => (
          <a
            key={event.id}
            href={`/event/${event.id}`}
            style={{
              display: 'block',
              background: 'var(--tg-theme-secondary-bg-color)',
              borderRadius: 12,
              padding: 16,
              textDecoration: 'none',
              color: 'inherit',
            }}
          >
            <h3 style={{ margin: '0 0 4px' }}>{event.name}</h3>
            <p style={{ margin: 0, fontSize: 14, color: 'var(--tg-theme-hint-color)' }}>
              {new Date(event.date).toLocaleDateString()} · {event.location}
            </p>
            <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 600 }}>
                {(event.basePrice / 1e9).toFixed(2)} TON
              </span>
              <span style={{ fontSize: 12, color: 'var(--tg-theme-hint-color)' }}>
                {event.ticketsSold}/{event.maxTickets} sold
              </span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
