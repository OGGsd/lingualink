import { Navigate, Route, Routes, useLocation } from "react-router";
import ChatPage from "./pages/ChatPage";
import LoginPage from "./pages/LoginPage";
import SignUpPage from "./pages/SignUpPage";
import SettingsPage from "./pages/SettingsPage";
import LandingPage from "./pages/LandingPage";
import PrivacyPage from "./pages/PrivacyPage";
import TermsPage from "./pages/TermsPage";
import FeaturesPage from "./pages/FeaturesPage";
import { useAuthStore } from "./store/useAuthStore";
import { useTranslationStore } from "./store/useTranslationStore";
import { useEffect, useMemo } from "react";
import PageLoader from "./components/PageLoader";
import keepAliveService from "./services/keepAliveService";

import { Toaster } from "react-hot-toast";

function App() {
  const { checkAuth, isCheckingAuth, authUser } = useAuthStore();
  const { fetchSupportedLanguages, loadUserSettings, settingsLoaded } = useTranslationStore();
  const location = useLocation();
  const isLanding = useMemo(() => !authUser && location.pathname === "/", [authUser, location.pathname]);

  useEffect(() => {
    checkAuth();

    // Start keep-alive service for Render free tier
    keepAliveService.start();

    // Cleanup on unmount
    return () => {
      keepAliveService.stop();
    };
  }, [checkAuth]);

  // Fetch supported languages only after successful authentication
  useEffect(() => {
    if (authUser && !isCheckingAuth) {
      fetchSupportedLanguages();
    }
  }, [authUser, isCheckingAuth, fetchSupportedLanguages]);

  // Load user settings when authenticated
  useEffect(() => {
    if (authUser && !settingsLoaded) {

      loadUserSettings();
    }
  }, [authUser, settingsLoaded, loadUserSettings]);

  if (isCheckingAuth) return <PageLoader />;

  return (
    <div className={`min-h-screen bg-slate-900 relative p-4 overflow-hidden ${isLanding ? "" : "flex items-center justify-center"}`}>
      {/* DECORATORS - GRID BG & GLOW SHAPES */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px]" />
      <div className="absolute top-0 -left-4 size-96 bg-pink-500 opacity-20 blur-[100px]" />
      <div className="absolute bottom-0 -right-4 size-96 bg-cyan-500 opacity-20 blur-[100px]" />

      <Routes>
        <Route path="/" element={authUser ? <ChatPage /> : <LandingPage />} />
        <Route path="/settings" element={authUser ? <SettingsPage /> : <Navigate to={"/login"} />} />
        <Route path="/login" element={!authUser ? <LoginPage /> : <Navigate to={"/"} />} />
        <Route path="/signup" element={!authUser ? <SignUpPage /> : <Navigate to={"/"} />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/features" element={<FeaturesPage />} />
      </Routes>

      <Toaster />
    </div>
  );
}
export default App;
