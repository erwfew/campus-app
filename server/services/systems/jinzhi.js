const cheerio = require('cheerio');
const { createClient } = require('../../utils/http');
const { sectionToTime, sectionToEndTime, parseWeeks, generateColor } = require('../../utils/sectionParser');
const { AuthError, AppError } = require('../../middleware/errorHandler');

/**
 * 金智/今日校园教务系统 - 登录
 *
 * 金智系统通常有 SSO 单点登录，可能需要获取 token
 */
async function login(eduUrl, username, password) {
  const client = createClient(eduUrl);

  const loginUrls = [
    '/api/login',
    '/login/login',
    '/jwglxt/login',
    '/eams/login',
    '/Login',
    '/login'
  ];

  let loginSuccess = false;

  for (const urlPath of loginUrls) {
    try {
      // 先 GET 登录页面获取 token
      const pageResp = await client.get(urlPath, {
        maxRedirects: 5,
        validateStatus: status => status < 400
      });

      const html = pageResp.data;
      let token = '';

      if (typeof html === 'string') {
        const $ = cheerio.load(html);
        // 提取 token
        token = $('input[name="token"]').val() ||
                $('input[name="_token"]').val() ||
                $('input[name="csrf_token"]').val() ||
                $('meta[name="csrf-token"]').attr('content') ||
                '';

        // 检查是否有验证码
        const captchaImg = $('img[src*="captcha"], img[src*="code"], img[src*="yzm"]');
        if (captchaImg.length > 0) {
          throw new AppError('UNSUPPORTED_SYSTEM', '该校教务系统需要验证码，暂不支持自动导入');
        }
      }

      const loginUrl = pageResp.config.url || urlPath;

      // 尝试 JSON 登录
      try {
        const jsonResp = await client.post(loginUrl, {
          username,
          password,
          token,
          loginType: '1'
        }, {
          headers: { 'Content-Type': 'application/json' },
          maxRedirects: 5,
          validateStatus: status => status < 400
        });

        const data = jsonResp.data;
        if (typeof data === 'object') {
          if (data.code === 0 || data.code === 200 || data.success === true ||
              data.status === 'ok' || data.result === true) {
            loginSuccess = true;
            break;
          }
          if (data.code === -1 || data.code === 401 || data.code === 4001 ||
              data.success === false) {
            throw new AuthError(data.msg || data.message || '用户名或密码错误');
          }
        }
      } catch (e) {
        if (e instanceof AuthError) throw e;
      }

      // 尝试表单登录
      try {
        const formData = { username, password, token, loginType: '1' };
        const formResp = await client.post(loginUrl, new URLSearchParams(formData), {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          maxRedirects: 5,
          validateStatus: status => status < 400 || status === 302
        });

        const respHtml = formResp.data;
        if (typeof respHtml === 'string') {
          const hasError = respHtml.includes('密码错误') ||
            respHtml.includes('用户名错误') ||
            respHtml.includes('账号或密码') ||
            respHtml.includes('登录失败');

          if (!hasError) {
            loginSuccess = true;
            break;
          }
        } else {
          // 非 HTML 响应，可能是成功
          loginSuccess = true;
          break;
        }
      } catch (e) {
        continue;
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
 * 金智/今日校园教务系统 - 解析课程表
 *
 * 金智系统可能返回 HTML 或 JSON
 */
async function parseCourses(client, school, semester) {
  const courseUrls = [
    `/eams/courseTableForStd.action?semester=${semester}`,
    `/api/courseTable?semester=${semester}`,
    `/jwglxt/kbcx/xskbcx_cxXsKb.html?xnxq=${semester}`,
    `/api/student/course/table?semester=${semester}`,
    `/course/table/list?semester=${semester}`
  ];

  let courses = [];

  for (const urlPath of courseUrls) {
    try {
      const resp = await client.get(urlPath, {
        maxRedirects: 5,
        validateStatus: status => status < 400
      });

      const data = resp.data;

      // JSON 响应
      if (typeof data === 'object') {
        const courseData = data.data || data.result || data.list || data;
        if (Array.isArray(courseData) && courseData.length > 0) {
          courses = parseJsonCourses(courseData);
          if (courses.length > 0) break;
        }
      }

      // HTML 响应
      if (typeof data === 'string' && data.length > 100) {
        courses = parseHtmlCourses(data);
        if (courses.length > 0) break;
      }
    } catch (e) {
      continue;
    }
  }

  if (courses.length === 0) {
    throw new AppError('PARSE_ERROR', '未查询到课程数据，请确认学期信息正确');
  }

  return courses;
}

/**
 * 解析 JSON 格式的课程数据
 */
function parseJsonCourses(data) {
  return data.map(item => {
    const name = item.courseName || item.kcmc || item.name || item.course_name || '';
    const teacher = item.teacherName || item.jsxm || item.teacher || '';
    const location = item.classroom || item.jsmc || item.room || '';
    const weekDay = parseInt(item.weekday || item.xq || item.xqj || '1') - 1;
    const startSection = parseInt(item.startSection || item.ksjc || '1');
    const endSection = parseInt(item.endSection || item.jsjc || '2');

    const weekInfo = parseWeeks(item.weeks || item.zc || item.skzc || '');

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
      remark: ''
    };
  });
}

/**
 * 解析 HTML 格式的课程表
 */
function parseHtmlCourses(html) {
  const $ = cheerio.load(html);
  const courses = [];

  // 尝试表格布局
  $('table tr').each((rowIdx, row) => {
    if (rowIdx === 0) return;

    $(row).find('td').each((colIdx, cell) => {
      const $cell = $(cell);
      if ($cell.hasClass('empty')) return;

      const text = $cell.text().trim();
      if (!text || text === '\u00a0') return;

      // 尝试结构化 div 解析
      const courseName = $cell.find('.course-name, .kcmc, [class*="name"]').text().trim();
      if (courseName) {
        courses.push({
          name: courseName,
          teacher: $cell.find('.teacher, .jsxm, [class*="teacher"]').text().trim(),
          location: $cell.find('.location, .jsmc, [class*="room"]').text().trim(),
          weekDay: colIdx,
          startSection: rowIdx * 2 - 1,
          endSection: rowIdx * 2,
          startTime: sectionToTime(rowIdx * 2 - 1),
          endTime: sectionToEndTime(rowIdx * 2),
          startWeek: 1,
          endWeek: 16,
          color: generateColor(courseName),
          remark: ''
        });
        return;
      }

      // 纯文本解析
      const lines = text.split(/\n/).map(l => l.trim()).filter(Boolean);
      if (lines.length >= 1 && lines[0].length > 1) {
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

  // 如果表格解析失败，尝试 div 布局
  if (courses.length === 0) {
    $('.kb-item, .course-item, [class*="course-block"]').each((i, el) => {
      const $el = $(el);
      const name = $el.find('.course-name, .kcmc').text().trim();
      if (!name) return;

      courses.push({
        name,
        teacher: $el.find('.teacher, .jsxm').text().trim(),
        location: $el.find('.location, .jsmc').text().trim(),
        weekDay: parseInt($el.attr('data-week') || '0'),
        startSection: parseInt($el.attr('data-start') || '1'),
        endSection: parseInt($el.attr('data-end') || '2'),
        startTime: sectionToTime(parseInt($el.attr('data-start') || '1')),
        endTime: sectionToEndTime(parseInt($el.attr('data-end') || '2')),
        startWeek: 1,
        endWeek: 16,
        color: generateColor(name),
        remark: ''
      });
    });
  }

  return courses;
}

module.exports = { login, parseCourses };
