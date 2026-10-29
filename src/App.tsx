import { useEffect, useState, type ReactNode } from "react";
import {
  Link,
  Navigate,
  Routes,
  Route,
} from "react-router-dom";
import type { Session } from "@supabase/supabase-js";

import { supabase } from "./services/supabase";
import Home from "./pages/Home";
import Lists from "./pages/Lists";
import Reminders from "./pages/Reminders";
import Settings from "./pages/Settings";
import ListDetails from "./pages/ListDetails";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";

type ProtectedRouteProps = {
  session: Session | null;
  loading: boolean;
  children: ReactNode;
};

function ProtectedRoute({
  session,
  loading,
  children,
}: ProtectedRouteProps) {
  if (loading) {
    return <p>Проверка авторизации...</p>;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setLoadingSession(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <div>
      {!loadingSession && session && (
        <>
          <nav>
            <Link to="/">Главная</Link> |{" "}
            <Link to="/lists">Списки</Link> |{" "}
            <Link to="/reminders">Напоминания</Link> |{" "}
            <Link to="/settings">Настройки</Link>
          </nav>
          <hr />
        </>
      )}

      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute session={session} loading={loadingSession}>
              <Home />
            </ProtectedRoute>
          }
        />

        <Route
          path="/lists"
          element={
            <ProtectedRoute session={session} loading={loadingSession}>
              <Lists />
            </ProtectedRoute>
          }
        />

        <Route
          path="/lists/:id"
          element={
            <ProtectedRoute session={session} loading={loadingSession}>
              <ListDetails />
            </ProtectedRoute>
          }
        />

        <Route
          path="/reminders"
          element={
            <ProtectedRoute session={session} loading={loadingSession}>
              <Reminders />
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedRoute session={session} loading={loadingSession}>
              <Settings />
            </ProtectedRoute>
          }
        />

        <Route path="/login" element={<Login />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Routes>
    </div>
  );
}

export default App;