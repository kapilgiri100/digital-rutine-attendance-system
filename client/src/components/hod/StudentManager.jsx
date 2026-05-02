import { useState } from 'react'
import { showAlert } from '../common/Alert.jsx'
import './StudentManager.css'

export default function StudentManager({ students, addStudent, removeStudent, updateStudent }) {
  const [roll, setRoll] = useState('')
  const [name, setName] = useState('')
  const [dob, setDob] = useState('')
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')
  const [editDob, setEditDob] = useState('')

  const handleAdd = async () => {
    if (!roll || !name || !dob) {
      showAlert('Please fill all fields', 'error')
      return
    }
    setLoading(true)
    try {
      await addStudent(roll, name, dob)
      setRoll('')
      setName('')
      setDob('')
      showAlert('Student added successfully!', 'success')
    } catch (err) {
      console.error(err)
      showAlert(err.message || 'Failed to add student', 'error')
    } finally {
      setLoading(false)
    }
  }

  const startEditing = (student) => {
    setEditingId(student.roll)
    setEditName(student.name)
    setEditDob(student.dob || '')
  }

  const handleSaveEdit = async (originalRoll) => {
    if (!editName.trim()) {
      showAlert('Name cannot be empty', 'error')
      return
    }
    setLoading(true)
    try {
      await updateStudent(originalRoll, editName.trim(), editDob)
      setEditingId(null)
      showAlert('Student updated successfully!', 'success')
    } catch (err) {
      console.error(err)
      showAlert(err.message || 'Failed to update student', 'error')
    } finally {
      setLoading(false)
    }
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditName('')
    setEditDob('')
  }

  const handleRemove = async (rollNum) => {
    if (!confirm('Are you sure you want to remove this student?')) return
    setLoading(true)
    try {
      await removeStudent(rollNum)
      showAlert('Student removed successfully!', 'success')
    } catch (err) {
      console.error(err)
      showAlert('Failed to remove student', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="student-manager">
      <h3>Students</h3>
      <div className="form-row">
        <input 
          type="number" 
          placeholder="Roll" 
          value={roll} 
          onChange={e => setRoll(e.target.value)} 
          disabled={loading}
        />
        <input 
          placeholder="Name" 
          value={name} 
          onChange={e => setName(e.target.value)} 
          disabled={loading}
        />
        <input 
          type="date" 
          value={dob} 
          onChange={e => setDob(e.target.value)} 
          disabled={loading}
        />
        <button onClick={handleAdd} disabled={loading}>
          {loading ? '...' : 'Add'}
        </button>
      </div>
      <ul className="item-list">
        {students.length === 0 ? (
          <li className="empty-message">No students added yet</li>
        ) : (
          students.map(s => (
            <li key={s.roll}>
              {editingId === s.roll ? (
                <div className="edit-form">
                  <span>Roll {s.roll}</span>
                  <input 
                    type="text" 
                    value={editName} 
                    onChange={e => setEditName(e.target.value)} 
                    placeholder="Name"
                  />
                  <input 
                    type="date" 
                    value={editDob} 
                    onChange={e => setEditDob(e.target.value)} 
                  />
                  <button onClick={() => handleSaveEdit(s.roll)} disabled={loading}>Save</button>
                  <button onClick={cancelEdit} disabled={loading}>Cancel</button>
                </div>
              ) : (
                <>
                  <span>Roll {s.roll} – {s.name} – DOB {s.dob}</span>
                  <button onClick={() => startEditing(s)} disabled={loading}>Edit</button>
                  <button onClick={() => handleRemove(s.roll)} disabled={loading}>Remove</button>
                </>
              )}
            </li>
          ))
        )}
      </ul>
    </div>
  )
}

