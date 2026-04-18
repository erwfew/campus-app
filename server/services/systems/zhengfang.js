const cheerio = require('cheerio');
const { createClient } = require('../../utils/http');
const { sectionToTime, sectionToEndTime, parseWeeks, generateColor } = require('../../utils/sectionParser');
const { AuthError, AppError } = require('../../middleware/errorHandler');

/**
 * 正方教务系统 - 登录
 *
 * 正方系统通常有多个版本（v6/v7），登录流程：
 * 1. GET 登录页面获取 session cookie 和隐藏字段
 * 2. POST 表单提交用户名密码
 * 3. 检查响应判断是否登录成功
 */
async function login(eduUrl, username, password) {
  const client = createClient(eduUrl);

  // 正方系统常见登录 URL 模式
  const loginUrls = [
    '/jwc/glht/LoginCheck',
    '/jwglxt/xtgl/login_slogin.html',
    '/jwglxt/login_slogin.html',
    '/default.aspx',
    '/Login.aspx'
  ];

  let loginUrl = null;
  let loginSuccess = false;

  // 尝试多个可能的登录 URL
  for (const urlPath of loginUrls) {
    try {
      // 先 GET 登录页面获取 cookie 和隐藏字段
      const pageResp = await client.get(urlPath, {
        maxRedirects: 5,
        validateStatus: status => status < 400
      });

      const html = pageResp.data;
      const $ = cheerio.load(html);

      // 检查是否是登录页面（包含密码输入框）
      const pwdInput = $('input[type="password"]');
      if (pwdInput.length === 0) continue;

      loginUrl = pageResp.config.url || urlPath;

      // 提取隐藏字段
      const formData = {};
      $('input[type="hidden"]').each((i, el) => {
        const name = $(el).attr('name');
        const value = $(el).attr('value') || '';
        if (name) formData[name] = value;
      });

      // 尝试不同的字段名组合
      const usernameFields = ['用户名', 'username', 'userAccount', 'account', 'yhm', 'txtUsername', 'UserCode'];
      const passwordFields = ['密码', 'password', 'userPwd', 'pwd', 'mm', 'txtPassword', 'PassWord'];

      let usernameSet = false;
      let passwordSet = false;

      for (const field of usernameFields) {
        if ($(`input[name="${field}"]`).length > 0 || $(`input[id="${field}"]`).length > 0) {
          formData[field] = username;
          usernameSet = true;
          break;
        }
      }

      for (const field of passwordFields) {
        if ($(`input[name="${field}"]`).length > 0 || $(`input[id="${field}"]`).length > 0) {
          formData[field] = password;
          passwordSet = true;
          break;
        }
      }

      // 如果没找到明确的字段名，使用第一个文本输入和第一个密码输入
      if (!usernameSet) {
        const firstText = $('input[type="text"]').first();
        if (firstText.length > 0) {
          const name = firstText.attr('name') || firstText.attr('id') || 'username';
          formData[name] = username;
        }
      }
      if (!passwordSet) {
        const firstPwd = pwdInput.first();
        if (firstPwd.length > 0) {
          const name = firstPwd.attr('name') || firstPwd.attr('id') || 'password';
          formData[name] = password;
        }
      }

      // POST 登录
      const loginResp = await client.post(loginUrl, new URLSearchParams(formData), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        maxRedirects: 5,
        validateStatus: status => status < 400 || status === 302
      });

      // 判断登录是否成功
      const respHtml = loginResp.data;
      if (typeof respHtml === 'string') {
        const hasError = respHtml.includes('密码错误') ||
          respHtml.includes('用户名错误') ||
          respHtml.includes('账号或密码') ||
          respHtml.includes('登录失败') ||
          respHtml.includes('验证码错误');

        if (!hasError) {
          loginSuccess = true;
          break;
        }
      }
    } catch (e) {
      // 继续尝试下一个 URL
      continue;
    }
  }

  if (!loginSuccess) {
    throw new AuthError('用户名或密码错误，或该校教务系统暂不支持');
  }

  return client;
}

/**
 * 正方教务系统 - 解析课程表
 *
 * 正方课表通常是 HTML 表格：
 * - 行：节次（1-12节，通常每行2节）
 * - 列：周一到周日
 * - 单元格：课程信息，多个课程用 <br> 分隔
 */
async function parseCourses(client, school, semester) {
  // 正方课表常见 URL 模式
  const courseUrls = [
    `/jwc/glht/KbRpt.aspx?xnxq=${semester}`,
    `/jwglxt/kbcx/xskbcx_cxXsKb.html?gnmkdm=N2515&xnxq=${semester}`,
    `/jwglxt/xskbcx/xskbcx_cxXsKb.html?gnmkdm=N2515&xnxq=${semester}`,
    `/xsxk/StuSyllabus/StuSyllabus.aspx?xnxq=${semester}`,
    `/jwc/glht/KbRpt.aspx`
  ];

  let html = null;

  for (const urlPath of courseUrls) {
    try {
      const resp = await client.get(urlPath, {
        maxRedirects: 5,
        validateStatus: status => status < 400
      });
      if (resp.data && typeof resp.data === 'string' && resp.data.length > 100) {
        html = resp.data;
        break;
      }
    } catch (e) {
      continue;
    }
  }

  if (!html) {
    throw new AppError('PARSE_ERROR', '无法获取课表页面，请确认教务系统已开放选课');
  }

  const $ = cheerio.load(html);
  const courses = [];

  // 正方课表表格解析
  // 找到课表表格（通常有特定的 ID 或 class）
  const tables = $('table');

  tables.each((tableIdx, table) => {
    const $table = $(table);
    const rows = $table.find('tr');

    if (rows.length < 2) return; // 至少要有表头+数据行

    rows.each((rowIdx, row) => {
      if (rowIdx === 0) return; // 跳过表头行

      const cells = $(row).find('td');
      cells.each((colIdx, cell) => {
        const $cell = $(cell);
        const cellHtml = $cell.html();

        if (!cellHtml || cellHtml.trim() === '&nbsp;' || cellHtml.trim() === '') return;

        // 正方课表单元格中的课程块通常用 <br> 分隔
        const blocks = cellHtml.split(/<br\s*\/?>/);

        for (const block of blocks) {
          const cleanBlock = block.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
          if (!cleanBlock || cleanBlock.length < 2) continue;

          // 解析课程信息行
          const lines = cleanBlock.split('\n').map(l => l.trim()).filter(l => l.length > 0);

          if (lines.length >= 1) {
            const course = {
              name: lines[0],
              teacher: '',
              location: '',
              weekDay: colIdx, // 0=周一 ... 6=周日
              startSection: 1,
              endSection: 2,
              startTime: sectionToTime(1),
              endTime: sectionToEndTime(2),
              startWeek: 1,
              endWeek: 16,
              color: '',
              remark: ''
            };

            // 根据行数解析更多信息
            if (lines.length >= 2) course.teacher = lines[1];
            if (lines.length >= 3) course.location = lines[2];

            // 最后一行通常包含周数信息
            const lastLine = lines[lines.length - 1];
            const weekInfo = parseWeeks(lastLine);
            course.startWeek = weekInfo.startWeek;
            course.endWeek = weekInfo.endWeek;

            // 尝试解析节次信息（通常在某一行包含 "1-2节" 格式）
            for (const line of lines) {
              const sectionMatch = line.match(/(\d+)[-–](\d+)\s*节/);
              if (sectionMatch) {
                course.startSection = parseInt(sectionMatch[1]);
                course.endSection = parseInt(sectionMatch[2]);
                course.startTime = sectionToTime(course.startSection);
                course.endTime = sectionToEndTime(course.endSection);
                break;
              }
            }

            course.color = generateColor(course.name);
            courses.push(course);
          }
        }
      });
    });
  });

  // 如果表格解析失败，尝试 div 布局解析（某些正方版本使用 div）
  if (courses.length === 0) {
    $('.kb-grid .kb-item, .course-item, .kb-cell, [class*="course"]').each((i, el) => {
      const $el = $(el);
      const name = $el.find('.course-name, .kcmc, [class*="name"]').text().trim();
      if (!name) return;

      courses.push({
        name,
        teacher: $el.find('.teacher, .jsxm, [class*="teacher"]').text().trim(),
        location: $el.find('.location, .jsmc, [class*="room"]').text().trim(),
        weekDay: parseInt($el.attr('data-week') || $el.find('[class*="week"]').text()) || 0,
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
