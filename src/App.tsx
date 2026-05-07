import { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from '@/lib/AuthContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CookieConsent } from '@/components/CookieConsent';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AdLanding } from '@/pages/AdLanding';

import { Landing } from '@/pages/Landing';
import { Pricing } from '@/pages/Pricing';
import { Login } from '@/pages/Login';
import { Signup } from '@/pages/Signup';
import { Dashboard } from '@/pages/Dashboard';
import { Lesson } from '@/pages/Lesson';
import { TrackOverview } from '@/pages/TrackOverview';
import { Module } from '@/pages/Module';
import { Assessment } from '@/pages/Assessment';
import { Exam } from '@/pages/Exam';
import { Certificate } from '@/pages/Certificate';
import { Imprint } from '@/pages/Imprint';
import { PrivacyPolicy } from '@/pages/PrivacyPolicy';
import { TermsOfService } from '@/pages/TermsOfService';
import { CookiePolicy } from '@/pages/CookiePolicy';
import { DataProcessing } from '@/pages/DataProcessing';
import { Leaderboard } from '@/pages/Leaderboard';
import { Profile } from '@/pages/Profile';
import { ForgotPassword } from '@/pages/ForgotPassword';
import { ResetPassword } from '@/pages/ResetPassword';
import { NotFound } from '@/pages/NotFound';
import { ForTeams } from '@/pages/ForTeams';
import { ShareStory } from '@/pages/ShareStory';
import { Welcome } from '@/pages/Welcome';
import { SignupSuccess } from '@/pages/SignupSuccess';
import { WelcomeMember } from '@/pages/WelcomeMember';
import { WelcomeSpecialist } from '@/pages/WelcomeSpecialist';
import { WelcomeArchitect } from '@/pages/WelcomeArchitect';
import { Blog } from '@/pages/Blog';
import { Advisors } from '@/pages/Advisors';
import { WhatIsAiLiteracy } from '@/pages/blog/WhatIsAiLiteracy';
import { BuildYourFirstAiApp } from '@/pages/blog/BuildYourFirstAiApp';
import { CodingWithChronicIllness } from '@/pages/blog/CodingWithChronicIllness';
import { PromptEngineeringGuide } from '@/pages/blog/PromptEngineeringGuide';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
    const main = document.getElementById('main-content');
    if (main) main.focus({ preventScroll: true });
  }, [pathname]);
  return null;
}

function AppInner() {
  const { pathname } = useLocation();
  const isAdPage = pathname.startsWith('/go/');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <ScrollToTop />
      {!isAdPage && <Header />}
      <main id="main-content" style={{ flex: 1 }} tabIndex={-1}>
        <ErrorBoundary>
        <Routes>
          {/* Ad landing pages — no nav/footer */}
          <Route path="/go/coding" element={<AdLanding />} />
          <Route path="/go/ai" element={<AdLanding />} />
          <Route path="/go/agents" element={<AdLanding />} />

          {/* Public routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/imprint" element={<Imprint />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/cookies" element={<CookiePolicy />} />
          <Route path="/dpa" element={<DataProcessing />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Protected routes — require authentication */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/lesson/:id" element={<ProtectedRoute><Lesson /></ProtectedRoute>} />
          <Route path="/track/:trackId" element={<ProtectedRoute><TrackOverview /></ProtectedRoute>} />
          <Route path="/module/:moduleId" element={<ProtectedRoute><Module /></ProtectedRoute>} />
          <Route path="/assessment/:moduleId" element={<ProtectedRoute><Assessment /></ProtectedRoute>} />
          <Route path="/exam/:trackId" element={<ProtectedRoute><Exam /></ProtectedRoute>} />
          <Route path="/certificate/:id" element={<ProtectedRoute><Certificate /></ProtectedRoute>} />
          <Route path="/leaderboard/:trackId" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

          {/* Blog */}
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/what-is-ai-literacy" element={<WhatIsAiLiteracy />} />
          <Route path="/blog/build-your-first-ai-app" element={<BuildYourFirstAiApp />} />
          <Route path="/blog/coding-with-chronic-illness" element={<CodingWithChronicIllness />} />
          <Route path="/blog/prompt-engineering-guide" element={<PromptEngineeringGuide />} />

          <Route path="/advisors" element={<Advisors />} />
          <Route path="/for-teams" element={<ForTeams />} />
          <Route path="/share-story" element={<ShareStory />} />
          <Route path="/welcome" element={<Welcome />} />
          <Route path="/welcome-member" element={<WelcomeMember />} />
          <Route path="/welcome-specialist" element={<WelcomeSpecialist />} />
          <Route path="/welcome-architect" element={<WelcomeArchitect />} />
          <Route path="/signup-success" element={<ProtectedRoute><SignupSuccess /></ProtectedRoute>} />

          <Route path="*" element={<NotFound />} />
        </Routes>
        </ErrorBoundary>
      </main>
      {!isAdPage && <Footer />}
      {!isAdPage && <CookieConsent />}
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
