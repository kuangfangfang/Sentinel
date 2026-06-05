import { Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LandingPage } from './pages/LandingPage';
import { ResourcesPage } from './pages/ResourcesPage';
import { AboutPage } from './pages/AboutPage';
import { WhatWeHandlePage } from './pages/WhatWeHandlePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { TrackPage } from './pages/TrackPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { WizardPage } from './pages/wizard/WizardPage';
import { ConfirmationPage } from './pages/wizard/ConfirmationPage';
import { DashboardPage } from './pages/complainant/DashboardPage';
import { ComplaintDetailPage } from './pages/complainant/ComplaintDetailPage';
import { CaseworkerDashboardPage } from './pages/caseworker/CaseworkerDashboardPage';
import { QueuePage } from './pages/caseworker/QueuePage';
import { CaseworkerComplaintDetailPage } from './pages/caseworker/CaseworkerComplaintDetailPage';
import { AccountPage } from './pages/AccountPage';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/resources" element={<ResourcesPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/what-we-handle" element={<WhatWeHandlePage />} />
        <Route path="/track" element={<TrackPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Reporting wizard — public (supports anonymous reporting, FR-23) */}
        <Route path="/report" element={<WizardPage />} />
        <Route path="/confirmation" element={<ConfirmationPage />} />

        {/* Complainant area */}
        <Route
          path="/report/:draftId"
          element={
            <ProtectedRoute role="Complainant">
              <WizardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute role="Complainant">
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/complaints/:id"
          element={
            <ProtectedRoute role="Complainant">
              <ComplaintDetailPage />
            </ProtectedRoute>
          }
        />

        {/* Caseworker area */}
        <Route
          path="/caseworker"
          element={
            <ProtectedRoute role="Caseworker">
              <CaseworkerDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/caseworker/queue"
          element={
            <ProtectedRoute role="Caseworker">
              <QueuePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/caseworker/complaints/:id"
          element={
            <ProtectedRoute role="Caseworker">
              <CaseworkerComplaintDetailPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/account"
          element={
            <ProtectedRoute>
              <AccountPage />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
