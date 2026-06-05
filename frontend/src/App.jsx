import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { NotificationProvider } from './context/NotificationContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

// Pages
import Login from './pages/Login.jsx';
import LandingPage from './pages/LandingPage.jsx';
import DonorDashboard from './pages/donor/DonorDashboard.jsx';
import CreateDonation from './pages/donor/CreateDonation.jsx';
import DonationHistory from './pages/donor/DonationHistory.jsx';
import DonationDetails from './pages/DonationDetails.jsx';
import DonorProfile from './pages/donor/DonorProfile.jsx';
import NGODashboard from './pages/ngo/NGODashboard.jsx';
import NGOProfile from './pages/ngo/NGOProfile.jsx';
import BrowseDonations from './pages/ngo/BrowseDonations.jsx';
import MyClaims from './pages/ngo/MyClaims.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import UserManagement from './pages/admin/UserManagement.jsx';
import AdminDonations from './pages/admin/AdminDonations.jsx';
import VolunteerDashboard from './pages/volunteer/VolunteerDashboard.jsx';
import VolunteerDeliveries from './pages/volunteer/VolunteerDeliveries.jsx';
import VolunteerHistory from './pages/volunteer/VolunteerHistory.jsx';
import VolunteerProfile from './pages/volunteer/VolunteerProfile.jsx';
import RegisterVolunteer from './pages/volunteer/RegisterVolunteer.jsx';
import Register from './pages/Register.jsx';
import AdminLogin from './pages/admin/AdminLogin.jsx';
import AdminRegister from './pages/admin/AdminRegister.jsx';
import SocialSuccess from './pages/SocialSuccess.jsx';
import PublicProfile from './pages/PublicProfile.jsx';

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/register" element={<AdminRegister />} />
            <Route path="/register-volunteer" element={<RegisterVolunteer />} />
            <Route path="/social-success" element={<SocialSuccess />} />
            <Route path="/profile/:id" element={<ProtectedRoute><PublicProfile /></ProtectedRoute>} />
            <Route path="/donation/:id" element={<ProtectedRoute><DonationDetails /></ProtectedRoute>} />
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

            {/* Redirect common singular mistakes */}
            <Route path="/admin/user" element={<Navigate to="/admin/users" replace />} />
            <Route path="/admin/donation" element={<Navigate to="/admin/donations" replace />} />

            {/* Catch all - redirect to login */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
