import { pool } from "../lib/db.js";

class User {
  // Create a new user
  static async create({ email, fullName, password, profilePic = '' }) {
    const query = `
      INSERT INTO users (email, full_name, password, profile_pic)
      VALUES ($1, $2, $3, $4)
      RETURNING id, email, full_name, profile_pic, created_at, updated_at
    `;
    const values = [email, fullName, password, profilePic];

    try {
      const result = await pool.query(query, values);
      return this.formatUser(result.rows[0]);
    } catch (error) {
      throw error;
    }
  }

  // Find user by email
  static async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';

    try {
      const result = await pool.query(query, [email]);
      return result.rows.length > 0 ? this.formatUser(result.rows[0]) : null;
    } catch (error) {
      throw error;
    }
  }

  // Find user by ID
  static async findById(id) {
    const query = 'SELECT * FROM users WHERE id = $1';

    try {
      const result = await pool.query(query, [id]);
      return result.rows.length > 0 ? this.formatUser(result.rows[0]) : null;
    } catch (error) {
      throw error;
    }
  }

  // Find user by ID without password
  static async findByIdWithoutPassword(id) {
    const query = 'SELECT id, email, full_name, profile_pic, is_admin, created_at, updated_at FROM users WHERE id = $1';

    try {
      const result = await pool.query(query, [id]);
      return result.rows.length > 0 ? this.formatUser(result.rows[0]) : null;
    } catch (error) {
      throw error;
    }
  }

  // Find all users except the given user ID
  static async findAllExcept(userId) {
    const query = 'SELECT id, email, full_name, profile_pic, created_at, updated_at FROM users WHERE id != $1';

    try {
      const result = await pool.query(query, [userId]);
      return result.rows.map(user => this.formatUser(user));
    } catch (error) {
      throw error;
    }
  }

  // Update user profile picture
  static async updateProfilePic(id, profilePic) {
    const query = `
      UPDATE users
      SET profile_pic = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, email, full_name, profile_pic, created_at, updated_at
    `;

    try {
      const result = await pool.query(query, [profilePic, id]);
      return result.rows.length > 0 ? this.formatUser(result.rows[0]) : null;
    } catch (error) {
      throw error;
    }
  }

  // Update user password
  static async updatePassword(id, hashedPassword) {
    const query = `
      UPDATE users
      SET password = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, email, full_name, profile_pic, email_verified, created_at, updated_at
    `;

    try {
      const result = await pool.query(query, [hashedPassword, id]);
      return result.rows.length > 0 ? this.formatUser(result.rows[0]) : null;
    } catch (error) {
      throw error;
    }
  }

  // Set email verification token
  static async setEmailVerificationToken(id, token, expires) {
    const query = `
      UPDATE users
      SET email_verification_token = $1, email_verification_expires = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING id, email, full_name, profile_pic, email_verified, created_at, updated_at
    `;

    try {
      const result = await pool.query(query, [token, expires, id]);
      return result.rows.length > 0 ? this.formatUser(result.rows[0]) : null;
    } catch (error) {
      throw error;
    }
  }

  // Verify email with token
  static async verifyEmailWithToken(token) {
    const query = `
      UPDATE users
      SET email_verified = true, email_verification_token = NULL, email_verification_expires = NULL, updated_at = CURRENT_TIMESTAMP
      WHERE email_verification_token = $1 AND email_verification_expires > NOW()
      RETURNING id, email, full_name, profile_pic, email_verified, created_at, updated_at
    `;

    try {
      const result = await pool.query(query, [token]);
      return result.rows.length > 0 ? this.formatUser(result.rows[0]) : null;
    } catch (error) {
      throw error;
    }
  }

  // Set password reset token
  static async setPasswordResetToken(email, token, expires) {
    const query = `
      UPDATE users
      SET password_reset_token = $1, password_reset_expires = $2, updated_at = CURRENT_TIMESTAMP
      WHERE email = $3
      RETURNING id, email, full_name, profile_pic, email_verified, created_at, updated_at
    `;

    try {
      const result = await pool.query(query, [token, expires, email]);
      return result.rows.length > 0 ? this.formatUser(result.rows[0]) : null;
    } catch (error) {
      throw error;
    }
  }

  // Reset password with token
  static async resetPasswordWithToken(token, hashedPassword) {
    const query = `
      UPDATE users
      SET password = $1, password_reset_token = NULL, password_reset_expires = NULL, updated_at = CURRENT_TIMESTAMP
      WHERE password_reset_token = $2 AND password_reset_expires > NOW()
      RETURNING id, email, full_name, profile_pic, email_verified, created_at, updated_at
    `;

    try {
      const result = await pool.query(query, [hashedPassword, token]);
      return result.rows.length > 0 ? this.formatUser(result.rows[0]) : null;
    } catch (error) {
      throw error;
    }
  }

  // Find user by password reset token
  static async findByPasswordResetToken(token) {
    const query = `
      SELECT * FROM users
      WHERE password_reset_token = $1 AND password_reset_expires > NOW()
    `;

    try {
      const result = await pool.query(query, [token]);
      return result.rows.length > 0 ? this.formatUser(result.rows[0]) : null;
    } catch (error) {
      throw error;
    }
  }

  // Update user profile
  static async updateProfile(id, updates) {
    const allowedFields = ['full_name', 'profile_pic'];
    const setClause = [];
    const values = [];
    let paramIndex = 1;

    // Build dynamic SET clause
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key) && value !== undefined) {
        setClause.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }

    if (setClause.length === 0) {
      throw new Error('No valid fields to update');
    }

    const query = `
      UPDATE users
      SET ${setClause.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramIndex}
      RETURNING id, email, full_name, profile_pic, created_at, updated_at
    `;
    values.push(id);

    try {
      const result = await pool.query(query, values);
      return result.rows.length > 0 ? this.formatUser(result.rows[0]) : null;
    } catch (error) {
      throw error;
    }
  }

  // Check if user exists
  static async exists(id) {
    const query = 'SELECT 1 FROM users WHERE id = $1';

    try {
      const result = await pool.query(query, [id]);
      return result.rows.length > 0;
    } catch (error) {
      throw error;
    }
  }

  // Format user object to match frontend expectations
  static formatUser(user) {
    if (!user) return null;

    return {
      _id: user.id,
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      password: user.password,
      profilePic: user.profile_pic,
      emailVerified: user.email_verified || false,
      isAdmin: user.is_admin || false,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    };
  }
}

export default User;
