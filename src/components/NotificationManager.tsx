
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
          console.error('Ошибка загрузки уведомлений:', error);
          return;
        }

        if (!data) return;

        const now = Date.now();

        for (const reminder of data) {
          if (!active) break;

          try {
            if (!reminder.due_date || !reminder.reminder_time) {
              continue;
            }

            const dateOnly = String(reminder.due_date).split('T')[0];
            const time = reminder.reminder_time.slice(0, 5);

            const deadline = getBerlinDateTimeInstant(
              dateOnly,
              time,
            );

            if (deadline.getTime() > now) continue;

            // Атомарно пытаемся получить право отправить уведомление.
            const { data: claimed, error: claimError } = await supabase
              .from('reminders')
              .update({ notified: true })
              .eq('id', reminder.id)
              .eq('notified', false)
              .eq('is_completed', false)
              .select('id');

            if (claimError) {
              console.error('Ошибка обновления уведомления:', claimError);
              continue;
            }

            // Если запись уже обработана другой вкладкой — пропускаем.
            if (!claimed || claimed.length === 0) continue;

            try {
              new Notification('🔔 Напоминание', {
                body: reminder.title,
              });
            } catch (notificationError) {
              console.error(
                'Ошибка показа уведомления:',
                notificationError,
              );
            }
          } catch (reminderError) {
            console.error(
              'Ошибка обработки напоминания:',
              reminder.id,
              reminderError,
            );
          }
        }
      } catch (error) {
        console.error('Ошибка проверки уведомлений:', error);
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
