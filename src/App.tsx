import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/AppLayout";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Estimator from "./pages/Estimator";
import Documentation from "./pages/Documentation";
import UserManual from "./pages/UserManual";
import Chatbot from "./pages/Chatbot";
import AdminHospitals from "./pages/admin/Hospitals";
import AdminDoctors from "./pages/admin/Doctors";
import AdminProcedures from "./pages/admin/Procedures";
import AdminReferenceData from "./pages/admin/ReferenceData";
import AdminIngestion from "./pages/admin/Ingestion";
import AdminAverages from "./pages/admin/Averages";
import AdminUsers from "./pages/admin/Users";
import AdminPromotions from "./pages/admin/Promotions";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* Protected routes with sidebar layout */}
            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/estimator" element={<Estimator />} />
              <Route path="/documentation" element={<Documentation />} />
              <Route path="/user-manual" element={<UserManual />} />
              <Route path="/chatbot" element={<Chatbot />} />

              {/* Admin routes — group only */}
              <Route path="/admin/hospitals" element={<ProtectedRoute requiredRole="group"><AdminHospitals /></ProtectedRoute>} />
              <Route path="/admin/doctors" element={<ProtectedRoute requiredRole="group"><AdminDoctors /></ProtectedRoute>} />
              <Route path="/admin/procedures" element={<ProtectedRoute requiredRole="group"><AdminProcedures /></ProtectedRoute>} />
              <Route path="/admin/reference-data" element={<ProtectedRoute requiredRole="group"><AdminReferenceData /></ProtectedRoute>} />
              <Route path="/admin/ingestion" element={<ProtectedRoute requiredRole="group"><AdminIngestion /></ProtectedRoute>} />
              <Route path="/admin/averages" element={<ProtectedRoute requiredRole="group"><AdminAverages /></ProtectedRoute>} />
              <Route path="/admin/users" element={<ProtectedRoute requiredRole="group"><AdminUsers /></ProtectedRoute>} />
              <Route path="/admin/promotions" element={<ProtectedRoute requiredRole="group"><AdminPromotions /></ProtectedRoute>} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
