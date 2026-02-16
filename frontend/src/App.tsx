
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import LandingPage from './pages/LandingPage';
import DonorDashboard from './pages/donor/DonorDashboard';
import CreateDonation from './pages/donor/CreateDonation';
import DonationHistory from './pages/donor/DonationHistory';
import DonationDetails from './pages/DonationDetails';
import DonorProfile from './pages/donor/DonorProfile';
import NGODashboard from './pages/ngo/NGODashboard';
import NGOProfile from './pages/ngo/NGOProfile';
import BrowseDonations from './pages/ngo/BrowseDonations';
import MyClaims from './pages/ngo/MyClaims';
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import AdminDonations from './pages/admin/AdminDonations';
import VolunteerDashboard from './pages/volunteer/VolunteerDashboard';
import VolunteerDeliveries from './pages/volunteer/VolunteerDeliveries';
import VolunteerHistory from './pages/volunteer/VolunteerHistory';
import VolunteerProfile from './pages/volunteer/VolunteerProfile';
import RegisterVolunteer from './pages/volunteer/RegisterVolunteer';
import Register from './pages/Register';
import SocialSuccess from './pages/SocialSuccess';

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/register-volunteer" element={<RegisterVolunteer />} />
            <Route path="/social-success" element={<SocialSuccess />} />
            <Route path="/" element={<LandingPage />} />

            {/* Donor Routes */}
            <Route
              path="/donor/dashboard"
              element={
                <ProtectedRoute allowedRoles={['donor']}>
                  <DonorDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/donor/create-donation"
              element={
                <ProtectedRoute allowedRoles={['donor']}>
                  <CreateDonation />
                </ProtectedRoute>
              }
            />
            <Route
              path="/donor/history"
              element={
                <ProtectedRoute allowedRoles={['donor']}>
                  <DonationHistory />
                </ProtectedRoute>
              }
            />
            <Route
              path="/donor/donation/:id"
              element={
                <ProtectedRoute allowedRoles={['donor']}>
                  <DonationDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="/donor/profile"
              element={
                <ProtectedRoute allowedRoles={['donor']}>
                  <DonorProfile />
                </ProtectedRoute>
              }
            />

            {/* NGO Routes */}
            <Route
              path="/ngo/dashboard"
              element={
                <ProtectedRoute allowedRoles={['ngo']}>
                  <NGODashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ngo/profile"
              element={
                <ProtectedRoute allowedRoles={['ngo']}>
                  <NGOProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ngo/browse"
              element={
                <ProtectedRoute allowedRoles={['ngo']}>
                  <BrowseDonations />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ngo/claimed"
              element={
                <ProtectedRoute allowedRoles={['ngo']}>
                  <MyClaims />
                </ProtectedRoute>
              }
            />

            {/* Volunteer Routes */}
            <Route
              path="/volunteer/dashboard"
              element={
                <ProtectedRoute allowedRoles={['volunteer']}>
                  <VolunteerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/volunteer/deliveries"
              element={
                <ProtectedRoute allowedRoles={['volunteer']}>
                  <VolunteerDeliveries />
                </ProtectedRoute>
              }
            />
            <Route
              path="/volunteer/history"
              element={
                <ProtectedRoute allowedRoles={['volunteer']}>
                  <VolunteerHistory />
                </ProtectedRoute>
              }
            />
            <Route
              path="/volunteer/donation/:id"
              element={
                <ProtectedRoute allowedRoles={['volunteer']}>
                  <DonationDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="/volunteer/profile"
              element={
                <ProtectedRoute allowedRoles={['volunteer']}>
                  <VolunteerProfile />
                </ProtectedRoute>
              }
            />

            {/* Admin Routes */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <UserManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/donations"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDonations />
                </ProtectedRoute>
              }
            />

            {/* Catch all - redirect to login */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
