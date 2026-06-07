const { all, run } = require('../db');

/**
 * 获取教师发布的课程公告列表
 * @param {number} authorId
 */
async function getNotices(authorId) {
  const notices = await all(`
    SELECT n.*, c.name as course_name
    FROM notices n
    LEFT JOIN courses c ON n.course_id = c.id
    WHERE n.author_id = ? AND n.scope = ?
    ORDER BY n.created_at DESC
    LIMIT 50
  `, [authorId, 'course']);

  return notices.map(n => ({
    id: n.id, title: n.title, content: n.content,
    course: n.course_name || '全部课程',
    date: n.created_at ? n.created_at.slice(0, 10) : '',
    important: !!n.important
  }));
}

/**
 * 发布课程公告
 * @param {string} title
 * @param {string} content
 * @param {number|null} courseId
 * @param {number} authorId
 * @param {boolean} important
 */
async function createNotice(title, content, courseId, authorId, important) {
  const result = await run(
    'INSERT INTO notices (title, content, course_id, author_id, scope, important) VALUES (?, ?, ?, ?, ?, ?)',
    [title, content || '', courseId || null, authorId, 'course', important ? 1 : 0]
  );
  return { id: result.lastInsertRowid, message: '公告已发布' };
}

module.exports = { getNotices, createNotice };
