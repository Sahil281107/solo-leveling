import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import pool from '../config/database';

export const verifyAndGetStudent = async (req: AuthRequest, res: Response) => {
  const connection = await pool.getConnection();
  
  try {
    const coachId = req.user?.user_id;
    const { student_email, student_name, field_of_interest } = req.body;
    
    // Verify student
    const [students]: any = await connection.execute(
      `SELECT u.user_id
      FROM users u
      JOIN adventurer_profiles ap ON u.user_id = ap.user_id
      WHERE u.email = ? AND ap.full_name = ? AND ap.field_of_interest = ?`,
      [student_email, student_name, field_of_interest]
    );
    
    if (students.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    const studentId = students[0].user_id;
    
    // Create relationship
    await connection.execute(
      `INSERT INTO coach_student_relationships (coach_user_id, student_user_id, status)
      VALUES (?, ?, 'active')
      ON DUPLICATE KEY UPDATE status = 'active'`,
      [coachId, studentId]
    );
    
    // Get student data
    const [profile]: any = await connection.execute(
      'SELECT * FROM adventurer_profiles WHERE user_id = ?',
      [studentId]
    );
    
    const [stats]: any = await connection.execute(
      'SELECT * FROM user_stats WHERE user_id = ?',
      [studentId]
    );
    
    res.json({
      student_profile: profile[0],
      student_stats: stats
    });
    
  } catch (error: any) {
    console.error('Verify student error:', error);
    res.status(500).json({ error: 'Failed to verify student' });
  } finally {
    connection.release();
  }
};

export const getMyStudents = async (req: AuthRequest, res: Response) => {
  try {
    const coachId = req.user?.user_id;
    
    const [students]: any = await pool.execute(
      `SELECT 
        u.user_id,
        u.username,
        u.email,
        ap.full_name,
        ap.field_of_interest,
        ap.current_level,
        ap.total_exp,
        ap.streak_days
      FROM coach_student_relationships csr
      JOIN users u ON u.user_id = csr.student_user_id
      JOIN adventurer_profiles ap ON ap.user_id = csr.student_user_id
      WHERE csr.coach_user_id = ? AND csr.status = 'active'`,
      [coachId]
    );
    
    res.json({ students });
  } catch (error: any) {
    console.error('Get students error:', error);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
};

export const provideFeedback = async (req: AuthRequest, res: Response) => {
  try {
    const coachId = req.user?.user_id;
    const { student_id, feedback_type, feedback_text, rating } = req.body;
    
    // Insert feedback
    await pool.execute(
      'INSERT INTO coach_feedback (coach_user_id, student_user_id, feedback_type, feedback_text, rating) VALUES (?, ?, ?, ?, ?)',
      [coachId, student_id, feedback_type, feedback_text, rating || null]
    );
    
    res.json({ message: 'Feedback provided successfully' });
    
  } catch (error: any) {
    console.error('Provide feedback error:', error);
    res.status(500).json({ error: 'Failed to provide feedback' });
  }
};

// Add this to your existing coachController.ts
export const removeStudent = async (req: AuthRequest, res: Response) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const coachId = req.user?.user_id;
    const studentId = req.params.student_id;
    
    // Validate student_id parameter
    if (!studentId) {
      await connection.rollback();
      return res.status(400).json({ error: 'Student ID is required' });
    }
    
    // Verify the relationship exists and the coach owns it
    const [existingRelationship]: any = await connection.execute(
      `SELECT csr.*, u.username, ap.full_name 
       FROM coach_student_relationships csr
       JOIN users u ON u.user_id = csr.student_user_id
       JOIN adventurer_profiles ap ON ap.user_id = csr.student_user_id
       WHERE csr.coach_user_id = ? AND csr.student_user_id = ? AND csr.status = 'active'`,
      [coachId, studentId]
    );
    
    if (existingRelationship.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Student not found in your roster or already removed' });
    }
    
    const student = existingRelationship[0];
    
    // Remove the relationship (hard delete)
    const [deleteResult]: any = await connection.execute(
      'DELETE FROM coach_student_relationships WHERE coach_user_id = ? AND student_user_id = ?',
      [coachId, studentId]
    );
    
    if (deleteResult.affectedRows === 0) {
      await connection.rollback();
      return res.status(500).json({ error: 'Failed to remove student from roster' });
    }
    
    // Log the removal activity for audit purposes
    try {
      await connection.execute(
        `INSERT INTO activity_logs (user_id, activity_type, activity_details, ip_address, user_agent) 
         VALUES (?, ?, ?, ?, ?)`,
        [
          coachId, 
          'student_removed', 
          JSON.stringify({ 
            removed_student_id: studentId,
            removed_student_name: student.full_name,
            action: 'coach_removed_student',
            timestamp: new Date().toISOString()
          }),
          req.ip || 'unknown',
          req.headers['user-agent'] || 'unknown'
        ]
      );
    } catch (logError) {
      console.warn('Failed to log student removal activity:', logError);
      // Continue with the operation even if logging fails
    }
    
    // Also log from student's perspective (optional)
    try {
      await connection.execute(
        `INSERT INTO activity_logs (user_id, activity_type, activity_details, ip_address, user_agent) 
         VALUES (?, ?, ?, ?, ?)`,
        [
          studentId, 
          'coach_relationship_ended', 
          JSON.stringify({ 
            coach_id: coachId,
            action: 'removed_by_coach',
            timestamp: new Date().toISOString()
          }),
          req.ip || 'unknown',
          req.headers['user-agent'] || 'unknown'
        ]
      );
    } catch (logError) {
      console.warn('Failed to log coach relationship ended activity:', logError);
    }
    
    await connection.commit();
    
    res.json({ 
      message: 'Student removed from roster successfully',
      removed_student: {
        user_id: studentId,
        name: student.full_name,
        username: student.username
      }
    });
    
  } catch (error: any) {
    await connection.rollback();
    console.error('Remove student error:', error);
    res.status(500).json({ error: 'Failed to remove student from roster' });
  } finally {
    connection.release();
  }
};
export const getStudentStats = async (req: AuthRequest, res: Response) => {
  try {
    const coachId = req.user?.user_id;
    const { student_id } = req.params;

    // Verify the coach has access to this student
    const [relationship]: any = await pool.execute(
      `SELECT csr.* FROM coach_student_relationships csr 
       WHERE csr.coach_user_id = ? AND csr.student_user_id = ? AND csr.status = 'active'`,
      [coachId, student_id]
    );

    if (relationship.length === 0) {
      return res.status(403).json({ error: 'No access to this student' });
    }

    // Get student profile
    const [profile]: any = await pool.execute(
      'SELECT * FROM adventurer_profiles WHERE user_id = ?',
      [student_id]
    );

    // Get student stats
    const [stats]: any = await pool.execute(
      'SELECT * FROM user_stats WHERE user_id = ? ORDER BY stat_name',
      [student_id]
    );

    // Get student's quest completion data
    const [quests]: any = await pool.execute(
      `SELECT 
        COUNT(*) as total_quests_completed,
        COUNT(CASE WHEN DATE(completed_at) = CURDATE() THEN 1 END) as quests_today,
        COUNT(CASE WHEN completed_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as quests_this_week
       FROM quest_completion_history 
       WHERE user_id = ?`,
      [student_id]
    );

    // Get student's achievements
    const [achievements]: any = await pool.execute(
      `SELECT ua.*, a.achievement_name, a.achievement_description, a.achievement_icon
       FROM user_achievements ua
       JOIN achievements a ON ua.achievement_id = a.achievement_id
       WHERE ua.user_id = ?
       ORDER BY ua.earned_at DESC`,
      [student_id]
    );

    res.json({
      student_profile: profile[0] || null,
      student_stats: stats || [],
      quest_progress: quests[0] || { total_quests_completed: 0, quests_today: 0, quests_this_week: 0 },
      achievements: achievements || []
    });

  } catch (error: any) {
    console.error('Get student stats error:', error);
    res.status(500).json({ error: 'Failed to fetch student stats' });
  }
};