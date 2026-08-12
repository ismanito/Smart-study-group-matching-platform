const express = require('express');

/**
 * Interests router (PostgreSQL).
 *
 * Wire in server.js when DATABASE_URL is set:
 *   const { Pool } = require('pg');
 *   const pool = new Pool({ connectionString: process.env.DATABASE_URL });
 *   const createInterestsRouter = require('./routes/interests');
 *   app.use('/api/interests', createInterestsRouter(pool, verifyToken));
 *
 * @param {import('pg').Pool} pool
 * @param {Function} authenticate - JWT middleware that sets req.user.id
 */
function createInterestsRouter(pool, authenticate) {
  const router = express.Router();

  router.get('/all', async (_req, res) => {
    try {
      const { rows } = await pool.query(
        `SELECT id, name, icon FROM interests ORDER BY name ASC`
      );
      return res.json(rows);
    } catch (error) {
      console.error('GET /interests/all', error);
      return res.status(500).json({ message: 'Unable to load interests.' });
    }
  });

  router.get('/my-interests', authenticate, async (req, res) => {
    try {
      const { rows } = await pool.query(
        `SELECT i.id, i.name, i.icon, ui.created_at AS "selectedAt"
         FROM user_interests ui
         JOIN interests i ON i.id = ui.interest_id
         WHERE ui.user_id = $1
         ORDER BY i.name ASC`,
        [req.user.id]
      );
      return res.json(rows);
    } catch (error) {
      console.error('GET /interests/my-interests', error);
      return res.status(500).json({ message: 'Unable to load your interests.' });
    }
  });

  router.post('/add', authenticate, async (req, res) => {
    try {
      const rawId = req.body.interestId ?? req.body.interest_id;
      const interestId = Number(rawId);
      if (!rawId || Number.isNaN(interestId)) {
        return res.status(400).json({ message: 'interestId is required.' });
      }

      const interest = await pool.query(
        `SELECT id, name, icon FROM interests WHERE id = $1`,
        [interestId]
      );
      if (interest.rowCount === 0) {
        return res.status(404).json({ message: 'Interest not found.' });
      }

      try {
        await pool.query(
          `INSERT INTO user_interests (user_id, interest_id) VALUES ($1, $2)`,
          [req.user.id, interestId]
        );
      } catch (insertError) {
        if (insertError.code === '23505') {
          return res.status(409).json({ message: 'Interest already selected.' });
        }
        throw insertError;
      }

      return res.status(201).json({
        message: 'Interest added.',
        interest: interest.rows[0],
      });
    } catch (error) {
      console.error('POST /interests/add', error);
      return res.status(500).json({ message: 'Unable to add interest.' });
    }
  });

  router.delete('/remove/:interestId', authenticate, async (req, res) => {
    try {
      const interestId = Number(req.params.interestId);
      if (Number.isNaN(interestId)) {
        return res.status(400).json({ message: 'Invalid interestId.' });
      }

      const result = await pool.query(
        `DELETE FROM user_interests
         WHERE user_id = $1 AND interest_id = $2
         RETURNING id`,
        [req.user.id, interestId]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({ message: 'Interest was not in your list.' });
      }

      return res.json({ message: 'Interest removed.' });
    } catch (error) {
      console.error('DELETE /interests/remove', error);
      return res.status(500).json({ message: 'Unable to remove interest.' });
    }
  });

  router.get('/find-matches', authenticate, async (req, res) => {
    try {
      const mine = await pool.query(
        `SELECT interest_id FROM user_interests WHERE user_id = $1`,
        [req.user.id]
      );

      if (mine.rowCount === 0) {
        return res.json([]);
      }

      // Supports both is_active (schema.sql) and status columns if present
      const { rows } = await pool.query(
        `SELECT
           u.id,
           u.name,
           u.email,
           COUNT(ui.interest_id)::int AS "sharedCount",
           COALESCE(
             json_agg(
               json_build_object('id', i.id, 'name', i.name, 'icon', i.icon)
               ORDER BY i.name
             ) FILTER (WHERE i.id IS NOT NULL),
             '[]'
           ) AS "sharedInterests"
         FROM user_interests ui
         JOIN users u ON u.id = ui.user_id
         JOIN interests i ON i.id = ui.interest_id
         WHERE ui.interest_id IN (
           SELECT interest_id FROM user_interests WHERE user_id = $1
         )
           AND ui.user_id <> $1
           AND COALESCE(u.role, 'student') = 'student'
           AND COALESCE(u.is_active, TRUE) = TRUE
           AND COALESCE(u.status, 'active') <> 'suspended'
         GROUP BY u.id, u.name, u.email
         ORDER BY "sharedCount" DESC, u.name ASC`,
        [req.user.id]
      );

      return res.json(
        rows.map((row) => ({
          id: row.id,
          name: row.name,
          email: row.email,
          bio: '',
          profilePicture: null,
          sharedCount: row.sharedCount,
          sharedInterests: row.sharedInterests || [],
        }))
      );
    } catch (error) {
      console.error('GET /interests/find-matches', error);
      return res.status(500).json({ message: 'Unable to find matches.' });
    }
  });

  return router;
}

module.exports = createInterestsRouter;
