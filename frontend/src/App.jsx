// src/App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/AppLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Bookings from './pages/Bookings';
import Agenda from './pages/Agenda';
import Drivers from './pages/Drivers';
import Expenses from './pages/Expenses';
import Sales from './pages/Sales';
import Admin from './pages/Admin';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="reservas" element={<Bookings />} />
            <Route path="agenda" element={<Agenda />} />
            <Route path="conductores" element={<Drivers />} />
            <Route path="gastos" element={<Expenses />} />
            <Route path="ventas" element={<Sales />} />
            <Route
              path="admin"
              element={
                <ProtectedRoute requireRole="admin">
                  <Admin />
                </ProtectedRoute>
              }
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
