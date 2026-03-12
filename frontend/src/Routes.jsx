import React from "react";
import { BrowserRouter, Routes as RouterRoutes, Route } from "react-router-dom";
import ScrollToTop from "components/ScrollToTop";
import ErrorBoundary from "components/ErrorBoundary";
import RequireAuth from "components/RequireAuth";
import NotFound from "pages/NotFound";
import RealTimeThreatMonitor from './pages/real-time-threat-monitoring';
import SecurityAnalyticsHub from './pages/security-analytics-hub';
import ExecutiveSecurityView from './pages/executive-security-view';
import EmailAnalysis from './pages/email-analysis';
import HeuristicRuleManagement from './pages/heuristic-rule-management';
import Login from "./pages/login";
import Home from "./pages/home";
import PrivacyPolicy from "./pages/privacy-policy";
import TermsOfService from "./pages/terms-of-service";
import LegalFooter from "./components/ui/LegalFooter";

const Routes = () => {
  const withFooter = (element) => (
    <>
      {element}
      <LegalFooter />
    </>
  );

  return (
    <BrowserRouter>
      <ErrorBoundary>
      <ScrollToTop />
      <RouterRoutes>
        {/* Define your route here */}
        <Route path="/login" element={withFooter(<Login />)} />
        <Route path="/" element={withFooter(<RequireAuth><Home /></RequireAuth>)} />
        <Route path="/real-time-threat-monitor" element={withFooter(<RequireAuth allowedRoles={['SUPER_ADMIN', 'ADMIN']}><RealTimeThreatMonitor /></RequireAuth>)} />
        <Route path="/security-analytics-hub" element={withFooter(<RequireAuth allowedRoles={['SUPER_ADMIN', 'ADMIN']}><SecurityAnalyticsHub /></RequireAuth>)} />
        <Route path="/executive-security-view" element={withFooter(<RequireAuth allowedRoles={['SUPER_ADMIN']}><ExecutiveSecurityView /></RequireAuth>)} />
        <Route path="/email-analysis" element={withFooter(<RequireAuth allowedRoles={['SUPER_ADMIN', 'ADMIN', 'USER']}><EmailAnalysis /></RequireAuth>)} />
        <Route path="/heuristic-rule-management" element={withFooter(<RequireAuth allowedRoles={['SUPER_ADMIN']}><HeuristicRuleManagement /></RequireAuth>)} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-of-service" element={<TermsOfService />} />
        <Route path="*" element={withFooter(<NotFound />)} />
      </RouterRoutes>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default Routes;
