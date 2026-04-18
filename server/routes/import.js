const express = require('express');
const router = express.Router();
const { login } = require('../services/loginService');
const { parseCourses } = require('../services/courseParser');
const { convertSemester } = require('../services/semesterHelper');
const { scrapeCourses } = require('../scrapers');
const rateLimit = require('../middleware/rateLimit');
const { AppError } = require('../middleware/errorHandler');
const config = require('../config');

function validateSemester(semester) {
  const match = semester.match(/^(\d{4})-(1|2)$/);
  if (!match) return false;
  const year = parseInt(match[1]);
  return year >= config.minSemesterYear && year <= config.maxSemesterYear;
}

/**
 * POST /api/import/preview
 * 登录教务系统并返回解析后的课程列表（不保存）
 * 优先用轻量方案（axios+cheerio），失败后自动切换 Puppeteer
 */
router.post('/preview', rateLimit(), async (req, res, next) => {
  try {
    const { systemType, school, eduUrl, username, password, semester } = req.body;

    if (!eduUrl || !username || !password) {
      throw new AppError('INVALID_PARAMS', '请填写完整的登录信息', 400);
    }

    const targetSystem = systemType || 'zhengfang';
    const targetSemester = semester || getCurrentSemester();

    if (config.supportedSystems && !config.supportedSystems.includes(targetSystem)) {
      throw new AppError('INVALID_SYSTEM', `不支持的教务系统类型: ${targetSystem}`, 400);
    }

    if (semester && !validateSemester(targetSemester)) {
      throw new AppError('INVALID_SEMESTER', `学期格式错误，应为 YYYY-1 或 YYYY-2`, 400);
    }

    // 自动补全 URL
    let url = eduUrl.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'http://' + url;
    }

    console.log(`[Import] 开始导入: 学校=${school || url}, 系统=${targetSystem}, 学期=${targetSemester}`);

    let courses = [];
    let method = '';

    // 方案1: 轻量方案（axios + cheerio）
    try {
      console.log('[Import] 尝试轻量方案...');
      const client = await login(targetSystem, url, username, password);
      const convertedSemester = convertSemester(targetSystem, targetSemester);
      courses = await parseCourses(targetSystem, client, school, convertedSemester);
      method = 'lightweight';
      console.log(`[Import] 轻量方案成功: ${courses.length} 门课程`);
    } catch (lightErr) {
      console.log(`[Import] 轻量方案失败: ${lightErr.message}`);

      // 方案2: Puppeteer 方案
      try {
        console.log('[Import] 切换 Puppeteer 方案...');
        courses = await scrapeCourses({
          systemType: targetSystem,
          eduUrl: url,
          username,
          password
        });
        method = 'puppeteer';
        console.log(`[Import] Puppeteer 方案成功: ${courses.length} 门课程`);
      } catch (puppeteerErr) {
        console.error(`[Import] Puppeteer 方案也失败: ${puppeteerErr.message}`);
        throw new AppError('IMPORT_FAILED', `导入失败: ${lightErr.message}`, 500);
      }
    }

    if (!courses || courses.length === 0) {
      throw new AppError('NO_COURSES', '未查询到课程数据，请检查账号信息', 404);
    }

    res.json({
      success: true,
      data: {
        courses: courses.map(c => ({ ...c, selected: true })),
        method,
        semester: targetSemester,
        school: school || '未知学校'
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/import/confirm
 * 确认导入（记录日志）
 */
router.post('/confirm', rateLimit(), async (req, res, next) => {
  try {
    const { systemType, school, eduUrl, semester, courseCount } = req.body;
    console.log(`[Import] 确认导入: 学校=${school || eduUrl}, 系统=${systemType}, 学期=${semester}, 课程数=${courseCount}`);
    res.json({ success: true, data: { message: '导入确认成功' } });
  } catch (err) {
    next(err);
  }
});

function getCurrentSemester() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  if (month >= 9 || month <= 1) return `${year}-1`;
  return `${year}-2`;
}

module.exports = router;
