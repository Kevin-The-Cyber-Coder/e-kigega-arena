import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Layout from './components/Layout.jsx';
import { ProtectedRoute, RoleGuard } from './components/RouteGuards.jsx';
import { PageLoader } from './components/Skeleton.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Products from './pages/Products.jsx';
import Stock from './pages/Stock.jsx';
import Users from './pages/Users.jsx';
import NotFound from './pages/NotFound.jsx';

function LoginRoute() {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader label="Opening secure sign in…" />;
  if (user) return <Navigate to="/" replace />;
  return <Login />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginRoute />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="products" element={<Products />} />
          <Route path="stock" element={<Stock />} />
          <Route
            path="users"
            element={
              <RoleGuard roles={['super_admin', 'admin']}>
                <Users />
              </RoleGuard>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Route>
    </Routes>
  );
}
