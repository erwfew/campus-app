const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  getStudentHomeworkList,
  getStudentHomeworkDetail,
  submitHomework
} = require('../services/homeworkService');

/**
 * GET /api/homework
 * 获取当前学生的作业列表（需登录）
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const { courseId, status } = req.query;
    const homeworks = await getStudentHomeworkList(req.user.id, courseId, status);

    res.json({ success: true, data: { homeworks } });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

/**
 * GET /api/homework/:id
 * 作业详情
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const detail = await getStudentHomeworkDetail(Number(req.params.id), req.user.id);

    if (!detail) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: '作业不存在' } });
    }

    res.json({ success: true, data: detail });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

/**
 * POST /api/homework/:id/submit
 * 提交作业
 */
router.post('/:id/submit', authenticate, async (req, res) => {
  try {
    const { content, fileUrl } = req.body;
    if (!content && !fileUrl) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_PARAMS', message: '请填写作业内容或上传文件' } });
    }

    const result = await submitHomework(Number(req.params.id), req.user.id, content, fileUrl);

    if (!result) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: '作业不存在' } });
    }

    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

module.exports = router;
