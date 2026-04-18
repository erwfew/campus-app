const cheerio = require('cheerio');
const { createClient } = require('../../utils/http');
const { sectionToTime, sectionToEndTime, parseWeeks, generateColor } = require('../../utils/sectionParser');
const { AuthError, AppError } = require('../../middleware/errorHandler');

/**
 * 青果教务系统 - 登录
 *
 * 青果系统通常使用 JSON API 进行登录
 */
async function login(eduUrl, username, password) {
  const client = createClient(eduUrl);

  const loginUrls = [
    '/api/login',
    '/Login/CheckLogin',
    '/api/user/login',
    '/jwglxt/api/login',
    '/Login.aspx'
  ];

  let loginSuccess = false;

  for (const urlPath of loginUrls) {
    try {
      // 尝试 JSON 格式登录
      const resp = await client.post(urlPath, {
        username: username,
        password: password,
        userAccount: username,
        userPwd: password
      }, {
        headers: { 'Content-Type': 'application/json' },
        maxRedirects: 5,
        validateStatus: status => status < 400
      });

      const data = resp.data;

      // 检查 JSON 响应
      if (typeof data === 'object') {
        if (data.code === 0 || data.code === 200 || data.success === true ||
            data.status === 'success' || data.result === true) {
          loginSuccess = true;
          break;
        }
        if (data.code === -1 || data.code === 401 || data.success === false) {
          // 密码错误，不再尝试其他 URL
          throw new AuthError(data.msg || data.message || '用户名或密码错误');
        }
      }

      // 如果响应是 HTML，尝试表单登录
      if (typeof data === 'string' && data.includes('<')) {
        const $ = cheerio.load(data);
        if ($('input[type="password"]').length > 0) {
          // 这是登录页面，尝试表单提交
          const formData = {};
          $('input[type="hidden"]').each((i, el) => {
            const name = $(el).attr('name');
            if (name) formData[name] = $(el).attr('value') || '';
          });
          formData['username'] = username;
          formData['password'] = password;

          const formResp = await client.post(urlPath, new URLSearchParams(formData), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            maxRedirects: 5,
            validateStatus: status => status < 400
          });

          if (typeof formResp.data === 'string' && !formResp.data.includes('密码错误')) {
            loginSuccess = true;
            break;
          }
        }
      }
    } catch (e) {
      if (e instanceof AuthError) throw e;
      continue;
    }
  }

  if (!loginSuccess) {
    throw new AuthError('用户名或密码错误，或该校教务系统暂不支持');
  }

  return client;
}

/**
 * 青果教务系统 - 解析课程表
 *
 * 青果系统通常返回 JSON 格式的课程数据
 */
async function parseCourses(client, school, semester) {
  const courseUrls = [
    `/api/course/student?semester=${semester}`,
    `/api/kbcx/xskbcx?xnxq=${semester}`,
    `/jwglxt/api/kbcx/xskbcx?xnxq=${semester}`,
    `/api/student/course?semester=${semester}`,
    `/api/courses?semester=${semester}`
  ];

  let courseData = null;

  for (const urlPath of courseUrls) {
    try {
      const resp = await client.get(urlPath, {
        maxRedirects: 5,
        validateStatus: status => status < 400
      });

      const data = resp.data;

      // JSON 响应
      if (typeof data === 'object') {
        courseData = data.data || data.result || data.list || data;
        if (Array.isArray(courseData) && courseData.length > 0) break;
      }

      // HTML 响应，尝试解析
      if (typeof data === 'string' && data.length > 100) {
        const parsed = parseHtmlCourses(data, semester);
        if (parsed.length > 0) return parsed;
      }
    } catch (e) {
      continue;
    }
  }

  if (!courseData || !Array.isArray(courseData) || courseData.length === 0) {
    throw new AppError('PARSE_ERROR', '未查询到课程数据，请确认学期信息正确');
  }

  // 青果系统字段映射（不同版本字段名可能不同）
  return courseData.map(item => {
    const name = item.kcmc || item.courseName || item.kc_name || item.course_name || item.name || '';
    const teacher = item.jsxm || item.teacherName || item.teacher || item.js_name || '';
    const location = item.jsmc || item.classroom || item.js_name || item.room || '';
    const weekDay = parseInt(item.xq || item.weekday || item.xqj || '1') - 1; // 1-7 → 0-6
    const startSection = parseInt(item.ksjc || item.startSection || item.ksjc || '1');
    const endSection = parseInt(item.jsjc || item.endSection || item.jsjc || '2');

    const weekInfo = parseWeeks(item.zc || item.weeks || item.skzc || '');

    return {
      name,
      teacher,
      location,
      weekDay: Math.max(0, Math.min(6, weekDay)),
      startSection: startSection || 1,
      endSection: endSection || startSection + 1,
      startTime: sectionToTime(startSection || 1),
      endTime: sectionToEndTime(endSection || startSection + 1),
      startWeek: weekInfo.startWeek,
      endWeek: weekInfo.endWeek,
      color: generateColor(name),
      remark: item.skfs || item.teachingMethod || ''
    };
  });
}

/**
 * 解析 HTML 格式的课程表（某些青果部署使用 HTML）
 */
function parseHtmlCourses(html, semester) {
  const $ = cheerio.load(html);
  const courses = [];

  $('table tr').each((rowIdx, row) => {
    if (rowIdx === 0) return;

    $(row).find('td').each((colIdx, cell) => {
      const $cell = $(cell);
      const text = $cell.text().trim();
      if (!text || text === '&nbsp;') return;

      const lines = text.split(/\n/).map(l => l.trim()).filter(Boolean);
      if (lines.length >= 1) {
        const course = {
          name: lines[0],
          teacher: lines.length >= 2 ? lines[1] : '',
          location: lines.length >= 3 ? lines[2] : '',
          weekDay: colIdx,
          startSection: rowIdx * 2 - 1,
          endSection: rowIdx * 2,
          startTime: sectionToTime(rowIdx * 2 - 1),
          endTime: sectionToEndTime(rowIdx * 2),
          startWeek: 1,
          endWeek: 16,
          color: generateColor(lines[0]),
          remark: ''
        };

        const weekInfo = parseWeeks(lines[lines.length - 1]);
        course.startWeek = weekInfo.startWeek;
        course.endWeek = weekInfo.endWeek;

        courses.push(course);
      }
    });
  });

  return courses;
}

module.exports = { login, parseCourses };
