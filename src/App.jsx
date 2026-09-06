import React, { useState, useEffect, useRef } from "react";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider, useAuth } from "./context/AuthContext";

import Navbar from "./components/Navbar";
import HeroSection from "./components/HeroSection";
import AboutSection from "./components/AboutSection";
import HowItWorksSection from "./components/HowItWorksSection";
import CinematicVideoSection from "./components/CinematicVideoSection";
import LifeSavingRulesSection from "./components/LifeSavingRulesSection";
import Footer from "./components/Footer";
import LoginModal from "./components/LoginModal";
import InteractiveAiDemoModal from "./components/InteractiveAiDemoModal";

// Your actual filename is SafteyIntelligencePage.jsx
import SafetyIntelligencePage from "./pages/SafteyIntelligencePage";

function AppContent() {
  const { isAuthenticated } = useAuth();

  // Landing page states
  const [showLogin, setShowLogin] = useState(false);
  const [showAiDemo, setShowAiDemo] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const appRef = useRef(null);

  useEffect(() => {
    // Keep this for your existing app initialization
  }, []);

  // ==================================================
  // LOGGED-IN USER
  // ==================================================
  // After successful login, show the complete
  // Safety Intelligence application.
  // ==================================================

  if (isAuthenticated) {
    return <SafetyIntelligencePage />;
  }

  // ==================================================
  // PUBLIC LANDING PAGE
  // ==================================================

  return (
    <div ref={appRef} className="app">

      {/* ==============================================
          NAVBAR
          ============================================== */}
      <Navbar
        onLogin={() => setShowLogin(true)}
        onAiDemo={() => setShowAiDemo(true)}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
      />

      {/* ==============================================
          MAIN LANDING PAGE
          ============================================== */}
      <main>

        {/* Hero */}
        <HeroSection
          onLogin={() => setShowLogin(true)}
          onAiDemo={() => setShowAiDemo(true)}
        />

        {/* About */}
        <AboutSection />

        {/* How It Works */}
        <HowItWorksSection />

        {/* Cinematic Video */}
        <CinematicVideoSection />

        {/* Life Saving Rules */}
        <LifeSavingRulesSection />

      </main>

      {/* ==============================================
          FOOTER
          ============================================== */}
      <Footer />

      {/* ==============================================
          LOGIN MODAL
          ============================================== */}
      {showLogin && (
        <LoginModal
          onClose={() => setShowLogin(false)}
        />
      )}

      {/* ==============================================
          AI DEMO MODAL
          ============================================== */}
      {showAiDemo && (
        <InteractiveAiDemoModal
          onClose={() => setShowAiDemo(false)}
        />
      )}

    </div>
  );
}

// ====================================================
// ROOT APP
// ====================================================

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}