
import { useEffect, useRef } from 'react';
import { supabase } from '../services/supabase';
import { getBerlinDateTimeInstant } from '../utils/date';

export default function NotificationManager() {
  const checking = useRef(false);

  useEffect(() => {
    let active = true;

    async function checkNotifications() {
      if (!active) return;

      if (!('Notification' in window)) return;

      if (Notification.permission !== 'granted') return;

      if (checking.current) return;

      checking.current = true;

      try {
        const { data, error } = await supabase
          .from('reminders')
          .select('*')
          .eq('is_completed', false)
          .eq('notified', false);

        if (error) {
          console.error('[NotificationManager] Ошибка Supabase:', error);
          return;
        }

        if (!data || !active) return;

        const now = Date.now();

        for (const reminder of data) {
          if (!active) break;

          try {
            if (!reminder.due_date || !reminder.reminder_time) {
              continue;
            }

            const dateOnly = String(reminder.due_date).split('T')[0];
            const time = reminder.reminder_time.slice(0, 5);

            const deadline = getBerlinDateTimeInstant(dateOnly, time);

            if (deadline.getTime() > now) continue;

            const { data: claimed, error: claimError } = await supabase
              .from('reminders')
              .update({ notified: true })
              .eq('id', reminder.id)
              .eq('notified', false)
              .eq('is_completed', false)
              .select('id');

            if (claimError) {
              console.error(
                '[NotificationManager] Ошибка claim:',
                claimError,
              );
              continue;
            }

            if (!claimed || claimed.length === 0) continue;

            try {
              new Notification('🔔 Напоминание', {
                body: reminder.title,
              });
            } catch (notificationError) {
              console.error(
                '[NotificationManager] Ошибка создания Notification:',
                notificationError,
              );

              const { error: rollbackError } = await supabase
                .from('reminders')
                .update({ notified: false })
                .eq('id', reminder.id)
                .eq('notified', true);

              if (rollbackError) {
                console.error(
                  '[NotificationManager] Ошибка rollback:',
                  rollbackError,
                );
              }
            }
          } catch (reminderError) {
            console.error(
              '[NotificationManager] Ошибка обработки:',
              reminder.id,
              reminderError,
            );
          }
        }
      } catch (error) {
        console.error(
          '[NotificationManager] Ошибка проверки:',
          error,
        );
      } finally {
        checking.current = false;
      }
    }

    checkNotifications();

    const interval = window.setInterval(() => {
      checkNotifications();
    }, 60000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkNotifications();
      }
    };

    window.addEventListener('focus', checkNotifications);

    document.addEventListener(
      'visibilitychange',
      handleVisibilityChange,
    );

    return () => {
      active = false;
      window.clearInterval(interval);

      window.removeEventListener('focus', checkNotifications);

      document.removeEventListener(
        'visibilitychange',
        handleVisibilityChange,
      );
    };
  }, []);

  return null;
}
