import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase";

export default function Settings() {
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    let active = true;

    async function loadUser() {
      const { data, error } = await supabase.auth.getUser();

      if (!active) return;

      if (error) {
        console.error("Ошибка загрузки пользователя:", error);
      }

      setEmail(data.user?.email ?? null);
      setLoading(false);
    }

    void loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user?.email ?? null);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  async function handleLogout() {
    const confirmed = window.confirm("Выйти из аккаунта Ordi?");

    if (!confirmed) return;

    setLoggingOut(true);

    const { error } = await supabase.auth.signOut();

    setLoggingOut(false);

    if (error) {
      console.error(error);
      alert("Не удалось выйти: " + error.message);
      return;
    }

    navigate("/login", { replace: true });
  }

  return (
    <div>
      <h1>Настройки</h1>

      <h2>Аккаунт</h2>

      {loading ? (
        <p>Загрузка...</p>
      ) : email ? (
        <p>Вы вошли как: <strong>{email}</strong></p>
      ) : (
        <p>Пользователь не авторизован</p>
      )}

      <button
        onClick={handleLogout}
        disabled={loading || !email || loggingOut}
      >
        {loggingOut ? "Выход..." : "Выйти из аккаунта"}
      </button>
    </div>
  );
}