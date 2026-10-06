import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
export default function Reminders() {
const [title, setTitle] = useState('');
const [dueDate, setDueDate] = useState('');
const [reminderTime, setReminderTime] = useState('');
const [repeatType, setRepeatType] = useState('none');
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
repeat_type: repeatType,
notified: false,
}
])
.select();
console.log('DATA:', data);
console.log('ERROR:', error);
if (!error) {
setTitle('');
setDueDate('');
setReminderTime('');
setRepeatType('none');
loadReminders();
}
}
async function toggleCompleted(reminder: any) {
alert('TOGGLE');   
console.log('TOGGLE CLICK');
console.log(reminder);
// обычная задача
if (
!reminder.repeat_type ||
reminder.repeat_type === 'none'
) {
const { error } = await supabase
.from('reminders')
.update({
is_completed: !reminder.is_completed,
})
.eq('id', reminder.id);
if (!error) {
console.log('DONE');   
loadReminders();
}
return;
}
// уже была выполнена — разрешаем снять галочку
if (reminder.is_completed) {
const { error } = await supabase
.from('reminders')
.update({ is_completed: false })
.eq('id', reminder.id);
if (!error) {
loadReminders();
}
return;
}
let nextDate = new Date(reminder.due_date);
switch (reminder.repeat_type) {
case 'daily':
nextDate.setDate(nextDate.getDate() + 1);
break;
case 'weekly':
nextDate.setDate(nextDate.getDate() + 7);
break;
case 'monthly':
nextDate.setMonth(nextDate.getMonth() + 1);
break;
case 'yearly':
nextDate.setFullYear(nextDate.getFullYear() + 1);
break;
}
// текущую задачу помечаем выполненной
const { error: updateError } = await supabase
.from('reminders')
.update({ is_completed: true })
.eq('id', reminder.id);
if (updateError) {
console.error(updateError);
return;
}
// создаём следующую задачу
const { error: insertError } = await supabase
.from('reminders')
.insert([
{
title: reminder.title,
due_date: nextDate.toISOString().split('T')[0],
reminder_time: reminder.reminder_time,
repeat_type: reminder.repeat_type,
is_completed: false,
notified: false,
},
]);
if (insertError) {
console.error(insertError);
return;
}
loadReminders();
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
<select
value={repeatType}
onChange={(e) => setRepeatType(e.target.value)}
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
{reminders.map((reminder) => (
<li key={reminder.id}>
<input
type="checkbox"
checked={reminder.is_completed}
onChange={() => {
alert('CLICK');
toggleCompleted(reminder);
}}
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
`${String(reminder.due_date).split('T')[0]}T${reminder.reminder_time || '23:59'}`
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
)} {!reminder.is_completed &&
(() => {
if (!reminder.due_date) return false;
const deadline = new Date(
`${String(reminder.due_date).split('T')[0]}T${reminder.reminder_time || '23:59'}`
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