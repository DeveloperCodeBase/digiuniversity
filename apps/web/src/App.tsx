// @ts-nocheck — Phase-14 R2 bulk JSX→TSX rename. Remove when this file's props/state are typed.
// =====================================================
// App entry — providers + router.
//
// Phase-14 R3 moved the route table + Nav/ErrorBoundary chrome into
// router.tsx (see useGo / useCurrentRoute / Layout there). This file
// is now just the provider stack wrapping <AppRouter />.
// =====================================================

import React from "react";
import { RoleProvider } from "./role";
import { AuthProvider } from "./auth/AuthContext";
import { ThemeProvider } from "./ui";
import { AppRouter } from "./router";

const App = () => (
  <ThemeProvider>
    <AuthProvider>
      <RoleProvider>
        <AppRouter />
      </RoleProvider>
    </AuthProvider>
  </ThemeProvider>
);

export default App;
