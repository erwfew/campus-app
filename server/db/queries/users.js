const { all, get, run } = require('../index');

const UserQueries = {
  findByUsername(username) {
    return get('SELECT * FROM users WHERE username = ?', [username]);
  },

  findById(id) {
    return get(
      'SELECT id, username, real_name, role, avatar, college, phone, email, student_id FROM users WHERE id = ?',
      [id]
    );
  },

  findByIdFull(id) {
    return get('SELECT * FROM users WHERE id = ?', [id]);
  },

  create({ username, hash, salt, realName, role = 'student', studentId = '', college = '' }) {
    return run(
      'INSERT INTO users (username, password_hash, salt, real_name, role, student_id, college) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [username, hash, salt, realName, role, studentId, college]
    );
  },

  updateProfile(id, { phone, email, avatar }) {
    run(
      'UPDATE users SET phone = COALESCE(?, phone), email = COALESCE(?, email), avatar = COALESCE(?, avatar), updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [phone || null, email || null, avatar || null, id]
    );
  },

  updatePassword(id, hash, salt) {
    run(
      'UPDATE users SET password_hash = ?, salt = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [hash, salt, id]
    );
  },

  setVerified(id, { verified, schoolName, studentId, dateStr }) {
    if (verified) {
      run(
        'UPDATE users SET verified = 1, school_name = ?, student_id = COALESCE(NULLIF(?, \'\'), student_id), verify_date = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [schoolName, studentId || '', dateStr, id]
      );
    } else {
      run(
        'UPDATE users SET verified = 0, school_name = \'\', verify_date = \'\', updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [id]
      );
    }
  },

  getVerifyStatus(id) {
    return get('SELECT verified, school_name, verify_date FROM users WHERE id = ?', [id]);
  }
};

module.exports = UserQueries;
