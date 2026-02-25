import { Route, Routes } from 'react-router-dom';
import { LandingPage } from '../pages/LandingPage';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { DashboardPage } from '../pages/DashboardPage';
import { CreateDraftPage } from '../pages/CreateDraftPage';
import { RoomPage } from '../pages/RoomPage';
import { JoinPage } from '../pages/JoinPage';

export function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      
      {/* Semi-public route - shows preview, requires auth to join */}
      <Route path="/join/:inviteCode" element={<JoinPage />} />
      
      {/* Protected routes */}
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/create" element={<CreateDraftPage />} />
      <Route path="/room/:roomId" element={<RoomPage />} />
    </Routes>
  );
}

export default App;
