import React from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import MobileSafetyApp from './components/mobile/MobileSafetyApp';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MobileSafetyApp />
      </AuthProvider>
    </ThemeProvider>
  );
}