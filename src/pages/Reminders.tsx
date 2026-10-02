import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
 
export default function Reminders() {
const [title, setTitle] = useState('');
const [dueDate, setDueDate] = useState('');
const [reminderTime, setReminderTime] = useState('');

const [reminders, setReminders] = useState<any[]>([]);
 
useEffect(() => {
loadReminders();
}, []);
 
async function loadReminders() {
const { data, error } = await supabase
.from('reminders')
.select('*')
.order('due_date', { ascending: true });
 
if (!error) {
setReminders(data || []);
}
}
 
async function addReminder() {
if (!title.trim()) return;
 
const { data, error } = await supabase
.from('reminders')
.insert([
{
title,
due_date: dueDate || null,
reminder_time: reminderTime || null,
},
])
.select();
 
console.log('DATA:', data);
console.log('ERROR:', error);
 
if (!error) {
setTitle('');
setDueDate('');
loadReminders();
}
}
async function toggleCompleted(
id: string,
currentValue: boolean
) {
const { error } = await supabase
.from('reminders')
.update({ is_completed: !currentValue })
.eq('id', id);
 
if (!error) {
loadReminders();
}
}
 
async function deleteReminder(id: string) {
const { error } = await supabase
.from('reminders')
.delete()
.eq('id', id);
 
if (!error) {
loadReminders();
}
}
async function editReminder(
id: string,
currentTitle: string,
currentDate: string | null,
currentTime: string | null
) {
const newTitle = prompt(
'Изменить напоминание:',
currentTitle
);
 
if (!newTitle || !newTitle.trim()) return;
 
const newDate = prompt(
'Дата (YYYY-MM-DD):',
currentDate || ''
);
 
const newTime = prompt(
'Время (HH:MM):',
currentTime || ''
);
 
const { error } = await supabase
.from('reminders')
.update({
title: newTitle,
due_date: newDate || null,
reminder_time: newTime || null,
})
.eq('id', id);
 
if (!error) {
loadReminders();
}
}
return (
<div>
<h1>Напоминания</h1>
 
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

<button onClick={addReminder}>
Добавить
</button>
 
<ul>
{reminders.map((reminder) => (
<li key={reminder.id}>
<input
type="checkbox"
checked={reminder.is_completed}
onChange={() =>
toggleCompleted(
reminder.id,
reminder.is_completed
)
}
/>
 
<span
style={{
textDecoration: reminder.is_completed
? 'line-through'
: 'none',
 
color:
!reminder.is_completed &&
reminder.due_date &&
(() => {
const deadline = new Date(
`${reminder.due_date.split('T')[0]}T${reminder.reminder_time || '23:59'}`
);
 
return deadline < new Date();
})()
? 'red'
: 'inherit',
 
marginLeft: '8px',
}}
>
{reminder.title}
</span>
 
{reminder.due_date && (
<>
{' '}
(
{new Date(reminder.due_date).toLocaleDateString('de-DE')}
{reminder.reminder_time &&
` ${reminder.reminder_time.slice(0, 5)}`}
)
</>
)}
 {!reminder.is_completed &&
(() => {
const deadline = new Date(
`${reminder.due_date.split('T')[0]}T${reminder.reminder_time || '23:59'}`
);
 
return deadline < new Date();
})() && (
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
reminder.reminder_time
)
}
style={{ marginLeft: '10px' }}
>
✏️
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