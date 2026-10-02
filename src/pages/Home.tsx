import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
 
export default function Home() {
const [todayReminders, setTodayReminders] = useState<any[]>([]);
const [overdueReminders, setOverdueReminders] = useState<any[]>([]);
const [upcomingReminders, setUpcomingReminders] = useState<any[]>([]);
 
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
setTodayReminders(data || []);
}
 
const { data: allReminders } = await supabase
.from('reminders')
.select('*')
.eq('is_completed', false);
 
if (allReminders) {
const now = new Date();
 
const overdue = allReminders.filter((r) => {
if (!r.due_date) return false;
 
const deadline = new Date(
`${r.due_date}T${r.reminder_time || '23:59'}`
);
 
return deadline < now;
});
 
const upcoming = allReminders
.filter((r) => {
if (!r.due_date) return false;
 
const deadline = new Date(
`${r.due_date}T${r.reminder_time || '23:59'}`
);
 
return deadline >= now &&
r.due_date !== today;
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
 
<h2>Сегодня</h2>
 
<ul>
{todayReminders.map((reminder) => (
<li key={reminder.id}>
{reminder.title}
{reminder.reminder_time &&
` (${reminder.reminder_time.slice(0, 5)})`}
</li>
))}
</ul>
 
<h2>Просрочено</h2>
 
<ul>
{overdueReminders.map((reminder) => (
<li key={reminder.id}>
{reminder.title}
</li>
))}
</ul>
 
<h2>Ближайшие</h2>
 
<ul>
{upcomingReminders.map((reminder) => (
<li key={reminder.id}>
{reminder.title}
 
{reminder.due_date &&
` (${new Date(reminder.due_date).toLocaleDateString('de-DE')})`}
 
{reminder.reminder_time &&
` ${reminder.reminder_time.slice(0, 5)}`}
</li>
))}
</ul>
</div>
);
}