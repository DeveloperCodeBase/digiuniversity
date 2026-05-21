// =====================================================
// App entry — providers + router.
//
// Phase-14 R3 moved the route table + Nav/ErrorBoundary chrome into
// router.tsx (see useGo / useCurrentRoute / Layout there). This file
// is now just the provider stack wrapping <AppRouter />.
//
// Phase-14.5 C3: dropped @ts-nocheck.
// =====================================================

import React from "react";
import { RoleProvider } from "./role";
import { AuthProvider } from "./auth/AuthContext";
import { ThemeProvider } from "./ui";
import { AppRouter } from "./router";

const App: React.FC = () => (
  <ThemeProvider>
    <AuthProvider>
      <RoleProvider>
        <AppRouter />
      </RoleProvider>
    </AuthProvider>
  </ThemeProvider>
);

export default App;
