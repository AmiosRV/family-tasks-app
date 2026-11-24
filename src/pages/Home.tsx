
import { useEffect, useRef, useState } from 'react';
import { supabase } from '../services/supabase';
import {
  formatDateBerlin,
  getBerlinDateTimeInstant,
  getTodayBerlin,
} from '../utils/date';

export default function Home() {
  const [todayReminders, setTodayReminders] = useState<any[]>([]);
  const [overdueReminders, setOverdueReminders] = useState<any[]>([]);
  const [upcomingReminders, setUpcomingReminders] = useState<any[]>([]);

  const checkingNotifications = useRef(false);

  function getReminderDeadline(reminder: any): Date {
    const dateOnly = String(reminder.due_date).split('T')[0];
    const time = reminder.reminder_time?.slice(0, 5) || '23:59';

    return getBerlinDateTimeInstant(dateOnly, time);
  }

  async function enableNotifications() {
    if (!('Notification' in window)) {
      alert('Браузер не поддерживает уведомления');
      return;
    }

    try {
      const permission = await Notification.requestPermission();

      if (permission === 'granted') {
        new Notification('Уведомления включены', {
          body: 'Теперь напоминания смогут показываться',
        });

        await checkNotifications();
      }
    } catch (error) {
      console.error('Ошибка включения уведомлений:', error);
    }
  }

  useEffect(() => {
    loadTodayReminders();
    checkNotifications();

    const interval = window.setInterval(() => {
      checkNotifications();
      loadTodayReminders();
    }, 60000);

    return () => window.clearInterval(interval);
  }, []);

  async function loadTodayReminders() {
    const today = getTodayBerlin();
    const now = Date.now();

    const { data, error } = await supabase
      .from('reminders')
      .select('*')
      .eq('is_completed', false);

    if (error) {
      console.error('Ошибка загрузки напоминаний:', error);
      return;
    }

    const allReminders = data || [];

    const overdue = allReminders.filter((reminder) => {
      if (!reminder.due_date) return false;

      return getReminderDeadline(reminder).getTime() < now;
    });

    const todayList = allReminders
      .filter((reminder) => {
        if (!reminder.due_date) return false;

        const dateOnly = String(reminder.due_date).split('T')[0];

        return (
          dateOnly === today &&
          getReminderDeadline(reminder).getTime() >= now
        );
      })
      .sort(
        (a, b) =>
          getReminderDeadline(a).getTime() -
          getReminderDeadline(b).getTime(),
      );

    const upcoming = allReminders
      .filter((reminder) => {
        if (!reminder.due_date) return false;

        const dateOnly = String(reminder.due_date).split('T')[0];

        return (
          dateOnly !== today &&
          getReminderDeadline(reminder).getTime() >= now
        );
      })
      .sort(
        (a, b) =>
          getReminderDeadline(a).getTime() -
          getReminderDeadline(b).getTime(),
      )
      .slice(0, 5);

    setTodayReminders(todayList);
    setOverdueReminders(overdue);
    setUpcomingReminders(upcoming);
  }

  async function checkNotifications() {
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;
    if (checkingNotifications.current) return;

    checkingNotifications.current = true;

    try {
      const { data, error } = await supabase
        .from('reminders')
        .select('*')
        .eq('is_completed', false)
        .eq('notified', false);

      if (error) {
        console.error('Ошибка проверки уведомлений:', error);
        return;
      }

      if (!data) return;

      const now = Date.now();

      for (const reminder of data) {
        if (!reminder.due_date || !reminder.reminder_time) {
          continue;
        }

        const reminderDate = getReminderDeadline(reminder);

        if (reminderDate.getTime() <= now) {
          const { error: updateError } = await supabase
            .from('reminders')
            .update({ notified: true })
            .eq('id', reminder.id)
            .eq('notified', false);

          if (updateError) {
            console.error(
              'Ошибка обновления статуса уведомления:',
              updateError,
            );
            continue;
          }

          try {
            new Notification('🔔 Напоминание', {
              body: reminder.title,
            });
          } catch (notificationError) {
            console.error(
              'Ошибка отправки уведомления:',
              notificationError,
            );
          }
        }
      }
    } catch (error) {
      console.error('Ошибка проверки напоминаний:', error);
    } finally {
      checkingNotifications.current = false;
    }
  }

  return (
    <div>
      <h1>Главная</h1>

      <button onClick={enableNotifications}>
        🔔 Включить уведомления
      </button>

      <h2>Сегодня</h2>

      <div>
        {todayReminders.map((reminder) => (
          <div key={reminder.id}>
            🟢 {reminder.title}
            {reminder.reminder_time &&
              ` (${reminder.reminder_time.slice(0, 5)})`}
          </div>
        ))}
      </div>

      <h2>Просрочено</h2>

      <div>
        {overdueReminders.map((reminder) => (
          <div key={reminder.id}>
            🔴 {reminder.title}

            <span
              style={{
                color: 'red',
                fontWeight: 'bold',
                marginLeft: '6px',
              }}
            >
              {reminder.due_date &&
                `(${formatDateBerlin(
                  String(reminder.due_date).split('T')[0],
                )})`}

              {reminder.reminder_time &&
                ` ${reminder.reminder_time.slice(0, 5)}`}
            </span>
          </div>
        ))}
      </div>

      <h2>Ближайшие</h2>

      <div>
        {upcomingReminders.map((reminder) => (
          <div key={reminder.id}>
            📅 {reminder.title}

            {reminder.due_date &&
              ` (${formatDateBerlin(
                String(reminder.due_date).split('T')[0],
              )})`}

            {reminder.reminder_time &&
              ` ${reminder.reminder_time.slice(0, 5)}`}
          </div>
        ))}
      </div>
    </div>
  );
}
