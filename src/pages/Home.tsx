import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
 
export default function Home() {
const [todayReminders, setTodayReminders] = useState<any[]>([]);
const [overdueReminders, setOverdueReminders] = useState<any[]>([]);
const [upcomingReminders, setUpcomingReminders] = useState<any[]>([]);
async function enableNotifications() {
if (!('Notification' in window)) {
alert('Браузер не поддерживает уведомления');
return;
}
 
const permission = await Notification.requestPermission();
 
if (permission === 'granted') {
new Notification('Уведомления включены', {
body: 'Теперь напоминания смогут показываться',
});
}
} 
useEffect(() => {
loadTodayReminders();
}, []);
 
async function loadTodayReminders() {
const today = new Date().toISOString().split('T')[0];
const { data, error } = await supabase
.from('reminders')
.select('*')
.eq('due_date', today)
.eq('is_completed', false)
.order('reminder_time', { ascending: true });
if (!error) {
const now = new Date();
 
const filteredToday = (data || []).filter((r) => {
const deadline = new Date(
`${r.due_date}T${r.reminder_time || '23:59'}`
);
 
return deadline >= now;
});
 
setTodayReminders(filteredToday);
}
 
const { data: allReminders } = await supabase
.from('reminders')
.select('*')
.eq('is_completed', false);
if (allReminders) {
const now = new Date();
 
const overdue = allReminders.filter((r) => {
if (!r.due_date) return false;
 
const dateOnly = r.due_date.split('T')[0];
 
const deadline = new Date(
`${dateOnly}T${r.reminder_time || '23:59'}`
);
 
return deadline < now;
});
 
const upcoming = allReminders
.filter((r) => {
if (!r.due_date) {
return false;
}
 
const dateOnly =
String(r.due_date).split('T')[0];
 
const deadline = new Date(
`${dateOnly}T${r.reminder_time || '23:59'}`
);
 
return deadline >= now &&
dateOnly !== today;
})
.sort(
(a, b) =>
new Date(
`${a.due_date}T${a.reminder_time || '23:59'}`
).getTime() -
new Date(
`${b.due_date}T${b.reminder_time || '23:59'}`
).getTime()
)
.slice(0, 5);
 
setOverdueReminders(overdue);
setUpcomingReminders(upcoming);
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
`(${new Date(reminder.due_date).toLocaleDateString('de-DE')})`}
 
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
` (${new Date(reminder.due_date).toLocaleDateString('de-DE')})`}
 
{reminder.reminder_time &&
` ${reminder.reminder_time.slice(0, 5)}`}
</div>
))}
</div>
</div>
);
}