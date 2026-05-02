const express = require('express');
const { pool } = require('../db');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, roll, name, dob FROM users WHERE type = $1 ORDER BY CAST(roll AS INTEGER) NULLS LAST',
      ['student']
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get students error:', err);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

router.post('/', async (req, res) => {
  const { roll, name, dob } = req.body;
  if (!roll || !name) return res.status(400).json({ error: 'roll and name are required' });
  try {
    const result = await pool.query(
      'INSERT INTO users (type, roll, name, dob) VALUES ($1, $2, $3, $4) RETURNING id, roll, name, dob',
      ['student', String(roll), name.trim(), dob || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Roll number already exists' });
    console.error('Add student error:', err);
    res.status(500).json({ error: 'Failed to add student' });
  }
});

router.put('/:roll', async (req, res) => {
  const { roll } = req.params;
  const { name, dob } = req.body;
  if (!name && !dob) return res.status(400).json({ error: 'Name or DOB is required' });
  try {
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (name) {
      updates.push(`name = $${paramIndex++}`);
      values.push(name.trim());
    }
    if (dob) {
      updates.push(`dob = $${paramIndex++}`);
      values.push(dob);
    }

    values.push(String(roll), 'student');

    const result = await pool.query(
      `UPDATE users SET ${updates.join(', ')}, updated_at = NOW() WHERE roll = $${paramIndex++} AND type = $${paramIndex} RETURNING id, roll, name, dob`,
      values
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Student not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update student error:', err);
    res.status(500).json({ error: 'Failed to update student' });
  }
});

router.delete('/:roll', async (req, res) => {
  const { roll } = req.params;
  try {
    const result = await pool.query(
      'DELETE FROM users WHERE roll = $1 AND type = $2',
      [String(roll), 'student']
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Student not found' });
    res.json({ success: true });
  } catch (err) {
    console.error('Delete student error:', err);
    res.status(500).json({ error: 'Failed to delete student' });
  }
});

module.exports = router;
