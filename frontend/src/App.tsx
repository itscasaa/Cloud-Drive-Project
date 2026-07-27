import type { ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { ForceLightTheme } from '@/components/theme/ForceLightTheme'
import { DriveLayout } from '@/layouts/DriveLayout'
import { DashboardPage } from '@/pages/DashboardPage'
import { AllFilesPage } from '@/pages/AllFilesPage'
import { ArchivedPage } from '@/pages/ArchivedPage'
import { LoginPage } from '@/pages/LoginPage'
import { GoogleAuthPage } from '@/pages/GoogleAuthPage'
import { GoogleConnectedPage } from '@/pages/GoogleConnectedPage'
import { QuotaTrackerPage } from '@/pages/QuotaTrackerPage'
import { RecentPage } from '@/pages/RecentPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { SharedPage } from '@/pages/SharedPage'
import { StarredPage } from '@/pages/StarredPage'
import { PublicFilePage } from '@/pages/PublicFilePage'
import { ApiManagementPage } from '@/pages/ApiManagementPage'
import { PrivacyPage } from '@/pages/PrivacyPage'
import { TermsPage } from '@/pages/TermsPage'
import { DataDeletionPage } from '@/pages/DataDeletionPage'
import { SecurityPrivacyPage } from '@/pages/SecurityPrivacyPage'
import { RecoveryPage } from '@/pages/RecoveryPage'
import { LandingPage } from '@/pages/LandingPage'
import { FeaturesPage } from '@/pages/FeaturesPage'
import { SecurityInfoPage } from '@/pages/SecurityInfoPage'
import { RecoveryInfoPage } from '@/pages/RecoveryInfoPage'
import { PricingPage } from '@/pages/PricingPage'

function light(page: ReactNode) {
  return <ForceLightTheme>{page}</ForceLightTheme>
}

function App() {
  return (
    <Routes>
      <Route path="/" element={light(<LandingPage />)} />
      <Route path="features" element={light(<FeaturesPage />)} />
      <Route path="about-security" element={light(<SecurityInfoPage />)} />
      <Route path="about-recovery" element={light(<RecoveryInfoPage />)} />
      <Route path="pricing" element={light(<PricingPage />)} />
      <Route path="login" element={light(<LoginPage />)} />
      <Route path="register" element={light(<RegisterPage />)} />
      <Route path="google-auth" element={<GoogleAuthPage />} />
      <Route path="google-connected" element={<GoogleConnectedPage />} />
      {/* Viewer UI lives under /share/* so host nginx can keep /public/* for backend API */}
      <Route path="share/:token" element={<PublicFilePage />} />
      <Route path="share/:token/embed" element={<PublicFilePage embed />} />
      {/* Legacy aliases (only work if reverse-proxy does not swallow /public for API) */}
      <Route path="public/files/:token" element={<PublicFilePage />} />
      <Route path="public/files/:token/embed" element={<PublicFilePage embed />} />
      <Route path="privacy" element={light(<PrivacyPage />)} />
      <Route path="terms" element={light(<TermsPage />)} />
      <Route path="data-deletion" element={light(<DataDeletionPage />)} />
      <Route element={<ProtectedRoute />}>
        <Route element={<DriveLayout />}>
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="all-files" element={<AllFilesPage />} />
          <Route path="quota" element={<QuotaTrackerPage />} />
          <Route path="shared" element={<SharedPage />} />
          <Route path="recent" element={<RecentPage />} />
          <Route path="starred" element={<StarredPage />} />
          <Route path="archived" element={<ArchivedPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="api" element={<ApiManagementPage />} />
          <Route path="api-keys" element={<ApiManagementPage />} />
          <Route path="security" element={<SecurityPrivacyPage />} />
          <Route path="recovery" element={<RecoveryPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/all-files" replace />} />
    </Routes>
  )
}

export default App
