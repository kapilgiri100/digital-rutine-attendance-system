import { days, slots } from '../../utils/scheduleUtils.js'
import './FullTimetable.css'

export default function FullTimetable({ schedule, teachers }) {
  return (
    <div className="full-timetable">
      <h3>Full Timetable</h3>
      <div className="table-wrapper">
        <table className="schedule-table">
          <thead><tr><th>Day / Time</th>{slots.map(t => <th key={t}>{t}</th>)}</tr></thead>
          <tbody>
            {days.map(day => (
              <tr key={day}>
                <td className="day-cell">{day}</td>
                {slots.map(t => {
                  const cell = schedule[day][t]
                  const teacher = teachers.find(x => String(x.id) === String(cell.teacherId))
                  return (
                    <td key={t}>
                      <div className={`subject-badge ${cell.subject ? 'class' : 'break'}`}>
                        {cell.subject || ''}<br /><small>{teacher ? teacher.name : ''}</small>
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}