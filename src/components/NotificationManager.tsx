
import { useEffect, useRef } from 'react';
import { supabase } from '../services/supabase';
import { getBerlinDateTimeInstant } from '../utils/date';

export default function NotificationManager() {
  const checking = useRef(false);

  useEffect(() => {
    let active = true;

    console.log('[NotificationManager] Компонент запущен');

    async function checkNotifications() {
      console.log('[NotificationManager] Начало проверки');

      if (!active) return;

      if (!('Notification' in window)) {
        console.log('[NotificationManager] Браузер не поддерживает уведомления');
        return;
      }

      console.log(
        '[NotificationManager] Permission:',
        Notification.permission,
      );

      if (Notification.permission !== 'granted') {
        console.log('[NotificationManager] Нет разрешения');
        return;
      }

      if (checking.current) {
        console.log('[NotificationManager] Проверка уже выполняется');
        return;
      }

      checking.current = true;

      try {
        console.log('[NotificationManager] Запрос Supabase');

        const { data, error } = await supabase
          .from('reminders')
          .select('*')
          .eq('is_completed', false)
          .eq('notified', false);

        if (error) {
          console.error('[NotificationManager] Ошибка Supabase:', error);
          return;
        }

        console.log(
          '[NotificationManager] Получено записей:',
          data?.length,
        );

        console.log('[NotificationManager] Данные Supabase:', data);

        if (!data) return;

        const now = Date.now();

        console.log(
          '[NotificationManager] Текущее время:',
          new Date(now).toISOString(),
        );

        for (const reminder of data) {
          console.log('[NotificationManager] Вход в цикл');

          if (!active) break;

          try {
            console.log(
              '[NotificationManager] Обработка:',
              reminder.id,
              reminder.title,
            );

            if (!reminder.due_date || !reminder.reminder_time) {
              console.log('[NotificationManager] Нет даты или времени');
              continue;
            }

            const dateOnly = String(reminder.due_date).split('T')[0];
            const time = reminder.reminder_time.slice(0, 5);

            const deadline = getBerlinDateTimeInstant(dateOnly, time);

            console.log('[NotificationManager] Дата:', dateOnly);
            console.log('[NotificationManager] Время:', time);
            console.log(
              '[NotificationManager] Deadline:',
              deadline.toISOString(),
            );

            if (deadline.getTime() > now) {
              console.log('[NotificationManager] Время ещё не наступило');
              continue;
            }

            console.log('[NotificationManager] Срок наступил. Claim...');

            const { data: claimed, error: claimError } = await supabase
              .from('reminders')
              .update({ notified: true })
              .eq('id', reminder.id)
              .eq('notified', false)
              .eq('is_completed', false)
              .select('id');

            if (claimError) {
              console.error('[NotificationManager] Ошибка claim:', claimError);
              continue;
            }

            console.log('[NotificationManager] Claim result:', claimed);

            if (!claimed || claimed.length === 0) {
              console.log('[NotificationManager] Запись уже обработана');
              continue;
            }

            try {
              console.log('[NotificationManager] Создаём Notification');

              const notification = new Notification('🔔 Напоминание', {
                body: reminder.title,
              });

              console.log(
                '[NotificationManager] Notification создан:',
                notification,
              );

              console.log(
                '[NotificationManager] Видимость вкладки:',
                document.visibilityState,
              );

              notification.onshow = () => {
                console.log(
                  '[NotificationManager] СОБЫТИЕ SHOW: уведомление показано',
                );
              };

              notification.onerror = (event) => {
                console.error(
                  '[NotificationManager] СОБЫТИЕ ERROR:',
                  event,
                );
              };

              notification.onclose = () => {
                console.log(
                  '[NotificationManager] СОБЫТИЕ CLOSE: уведомление закрыто',
                );
              };

              notification.onclick = () => {
                console.log(
                  '[NotificationManager] СОБЫТИЕ CLICK: уведомление нажато',
                );
              };
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
              } else {
                console.log('[NotificationManager] Rollback успешен');
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
        console.error('[NotificationManager] Ошибка проверки:', error);
      } finally {
        checking.current = false;
        console.log('[NotificationManager] Проверка завершена');
      }
    }

    checkNotifications();

    const interval = window.setInterval(() => {
      console.log('[NotificationManager] Проверка по интервалу');
      checkNotifications();
    }, 60000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('[NotificationManager] Вкладка стала видимой');
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

      console.log('[NotificationManager] Компонент остановлен');
    };
  }, []);

  return null;
}
