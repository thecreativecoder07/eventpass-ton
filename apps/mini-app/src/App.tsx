import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Discover from './pages/Discover';
import EventDetail from './pages/EventDetail';
import MyTickets from './pages/MyTickets';
import { useTelegramTheme } from './hooks/useTelegramTheme';

export default function App() {
  useTelegramTheme();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Discover />} />
        <Route path="/event/:id" element={<EventDetail />} />
        <Route path="/tickets" element={<MyTickets />} />
      </Routes>
    </BrowserRouter>
  );
}
