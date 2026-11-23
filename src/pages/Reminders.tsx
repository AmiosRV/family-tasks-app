
import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import {
  formatDateBerlin,
  getBerlinDateTimeInstant,
  getNextOccurrence,
  type RepeatType,
} from '../utils/date';

export default function Reminders() {
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [reminderTime, setReminderTime] = useState('');
  const [repeatType, setRepeatType] = useState<RepeatType>('none');
  const [reminders, setReminders] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [showArchive, setShowArchive] = useState(false);

  useEffect(() => {
    loadReminders();
  }, []);

  async function loadReminders() {
    const { data, error } = await supabase
      .from('reminders')
      .select('*')
      .order('due_date', { ascending: true });

    if (error) {
      console.error('Ошибка загрузки напоминаний:', error);
      return;
    }

    setReminders(data || []);
  }

  async function addReminder() {
    if (!title.trim()) return;

    const { error } = await supabase
      .from('reminders')
      .insert([
        {
          title: title.trim(),
          due_date: dueDate || null,
          reminder_time: reminderTime || null,
          repeat_type: repeatType,
          is_completed: false,
          notified: false,
        },
      ]);

    if (error) {
      console.error('Ошибка добавления напоминания:', error);
      return;
    }

    setTitle('');
    setDueDate('');
    setReminderTime('');
    setRepeatType('none');

    await loadReminders();
  }

  async function toggleCompleted(reminder: any) {
    // Обычное напоминание без повторения
    if (!reminder.repeat_type || reminder.repeat_type === 'none') {
      const { error } = await supabase
        .from('reminders')
        .update({
          is_completed: !reminder.is_completed,
        })
        .eq('id', reminder.id);

      if (error) {
        console.error('Ошибка изменения статуса:', error);
        return;
      }

      await loadReminders();
      return;
    }

    // Если повторяющееся напоминание уже выполнено,
    // разрешаем снять отметку
    if (reminder.is_completed) {
      const { error } = await supabase
        .from('reminders')
        .update({ is_completed: false })
        .eq('id', reminder.id);

      if (error) {
        console.error('Ошибка изменения статуса:', error);
        return;
      }

      await loadReminders();
      return;
    }

    // Для повторения обязательно нужна дата
    if (!reminder.due_date) {
      alert('Для повторяющегося напоминания необходимо указать дату.');
      return;
    }

    // Рассчитываем следующую дату
    const currentDate = String(reminder.due_date).split('T')[0];

    const nextDate = getNextOccurrence(
      currentDate,
      reminder.repeat_type as RepeatType,
    );

    // Текущую задачу помечаем выполненной
    const { error: updateError } = await supabase
      .from('reminders')
      .update({ is_completed: true })
      .eq('id', reminder.id);

    if (updateError) {
      console.error('Ошибка завершения напоминания:', updateError);
      return;
    }

    // Создаём следующее напоминание
    const { error: insertError } = await supabase
      .from('reminders')
      .insert([
        {
          title: reminder.title,
          due_date: nextDate,
          reminder_time: reminder.reminder_time,
          repeat_type: reminder.repeat_type,
          is_completed: false,
          notified: false,
        },
      ]);

    if (insertError) {
      console.error('Ошибка создания следующего напоминания:', insertError);
      await loadReminders();
      return;
    }

    await loadReminders();
  }

  async function deleteReminder(id: string) {
    const { error } = await supabase
      .from('reminders')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Ошибка удаления напоминания:', error);
      return;
    }

    await loadReminders();
  }

  async function restoreReminder(id: string) {
    const { error } = await supabase
      .from('reminders')
      .update({
        is_completed: false,
        notified: false,
      })
      .eq('id', id);

    if (error) {
      console.error('Ошибка восстановления напоминания:', error);
      return;
    }

    await loadReminders();
  }

  async function editReminder(
    id: string,
    currentTitle: string,
    currentDate: string | null,
    currentTime: string | null,
  ) {
    const newTitle = prompt(
      'Изменить напоминание:',
      currentTitle,
    );

    if (!newTitle || !newTitle.trim()) return;

    const newDate = prompt(
      'Дата (YYYY-MM-DD):',
      currentDate || '',
    );

    if (newDate === null) return;

    const newTime = prompt(
      'Время (HH:MM):',
      currentTime || '',
    );

    if (newTime === null) return;

    const { error } = await supabase
      .from('reminders')
      .update({
        title: newTitle.trim(),
        due_date: newDate || null,
        reminder_time: newTime || null,
      })
      .eq('id', id);

    if (error) {
      console.error('Ошибка редактирования напоминания:', error);
      return;
    }

    await loadReminders();
  }

  function isOverdue(reminder: any): boolean {
    if (reminder.is_completed || !reminder.due_date) {
      return false;
    }

    try {
      const deadline = getBerlinDateTimeInstant(
        String(reminder.due_date).split('T')[0],
        reminder.reminder_time?.slice(0, 5) || '23:59',
      );

      return deadline.getTime() < Date.now();
    } catch (error) {
      console.error('Ошибка расчёта срока напоминания:', error);
      return false;
    }
  }

  const filteredReminders = reminders
    .filter((reminder) =>
      showArchive
        ? reminder.is_completed
        : !reminder.is_completed,
    )
    .filter((reminder) =>
      reminder.title
        .toLowerCase()
        .includes(search.toLowerCase()),
    );

  return (
    <div>
      <h1>
        {showArchive ? 'Архив напоминаний' : 'Напоминания'}
      </h1>

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="🔍 Поиск..."
      />

      <button onClick={() => setShowArchive(!showArchive)}>
        {showArchive ? 'Активные' : 'Архив'}
      </button>

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Текст напоминания"
      />

      <input
        type="date"
        value={dueDate}
        onChange={(e) => setDueDate(e.target.value)}
      />

      <input
        type="time"
        value={reminderTime}
        onChange={(e) => setReminderTime(e.target.value)}
      />

      <select
        value={repeatType}
        onChange={(e) => setRepeatType(e.target.value as RepeatType)}
      >
        <option value="none">Не повторять</option>
        <option value="daily">Каждый день</option>
        <option value="weekly">Каждую неделю</option>
        <option value="monthly">Каждый месяц</option>
        <option value="yearly">Каждый год</option>
      </select>

      <button onClick={addReminder}>
        Добавить
      </button>

      <ul>
        {filteredReminders.map((reminder) => (
          <li key={reminder.id}>
            <input
              type="checkbox"
              checked={!!reminder.is_completed}
              onChange={() => toggleCompleted(reminder)}
            />

            <span
              style={{
                textDecoration: reminder.is_completed
                  ? 'line-through'
                  : 'none',
                color: isOverdue(reminder) ? 'red' : 'inherit',
                marginLeft: '8px',
              }}
            >
              {reminder.title}
            </span>

            {reminder.due_date && (
              <>
                {' '}
                (
                {formatDateBerlin(
                  String(reminder.due_date).split('T')[0],
                )}
                {reminder.reminder_time &&
                  ` ${reminder.reminder_time.slice(0, 5)}`}
                )
              </>
            )}

            {reminder.repeat_type &&
              reminder.repeat_type !== 'none' && (
                <span
                  style={{
                    marginLeft: '8px',
                    color: '#4caf50',
                    fontSize: '0.9em',
                  }}
                >
                  🔁 {reminder.repeat_type}
                </span>
              )}

            {isOverdue(reminder) && (
              <span
                style={{
                  color: 'red',
                  fontWeight: 'bold',
                  marginLeft: '8px',
                }}
              >
                Просрочено
              </span>
            )}

            <button
              onClick={() =>
                editReminder(
                  reminder.id,
                  reminder.title,
                  reminder.due_date,
                  reminder.reminder_time,
                )
              }
            >
              ✏️
            </button>

            <button
              onClick={() => restoreReminder(reminder.id)}
              style={{ marginLeft: '5px' }}
            >
              ♻
            </button>

            <button
              onClick={() => deleteReminder(reminder.id)}
              style={{ marginLeft: '5px' }}
            >
              🗑
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
