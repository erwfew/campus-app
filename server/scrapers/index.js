/**
 * 教务系统爬虫模块
 * 支持：正方教务、青果教务、金智教务
 * 
 * 使用 Puppeteer 模拟浏览器登录，避免各种加密/验证码问题
 */

const puppeteer = require('puppeteer')

// ============ 通用登录流程 ============

/**
 * 爬取教务系统课程
 * @param {Object} options
 * @param {string} options.systemType - 系统类型: zhengfang | qingguo | jinzhi
 * @param {string} options.eduUrl - 教务系统地址
 * @param {string} options.username - 学号
 * @param {string} options.password - 密码
 * @returns {Promise<Array>} 课程列表
 */
async function scrapeCourses({ systemType, eduUrl, username, password }) {
  let browser
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      timeout: 30000
    })

    const page = await browser.newPage()
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36')

    let courses
    // 自动检测万向教务系统
    if (eduUrl.includes('jwgl.wxpoly.cn') || systemType === 'wanxiang') {
      courses = await scrapeWanxiang(page, eduUrl, username, password)
    } else {
      switch (systemType) {
        case 'zhengfang':
          courses = await scrapeZhengfang(page, eduUrl, username, password)
          break
        case 'qingguo':
          courses = await scrapeQingguo(page, eduUrl, username, password)
          break
        case 'jinzhi':
          courses = await scrapeJinzhi(page, eduUrl, username, password)
          break
        default:
          throw new Error(`不支持的教务系统类型: ${systemType}`)
      }
    }

    return courses
  } finally {
    if (browser) await browser.close().catch(() => {})
  }
}

// ============ 万向教务系统（杭州万向职业技术学院）============
// URL 特征: jwgl.wxpoly.cn / xtgl/login_slogin.html

async function scrapeWanxiang(page, eduUrl, username, password) {
  // 1. 访问登录页
  await page.goto('https://jwgl.wxpoly.cn/xtgl/login_slogin.html', { waitUntil: 'networkidle2', timeout: 20000 })

  // 2. 等待登录表单加载
  await page.waitForSelector('#yhm, #mm', { timeout: 10000 })

  // 3. 填写用户名
  await page.click('#yhm')
  await page.type('#yhm', username, { delay: 50 })

  // 4. 填写密码（先 focus 触发 type 变 password，再输入）
  await page.click('#mm')
  await new Promise(r => setTimeout(r, 200))
  await page.type('#mm', password, { delay: 50 })
  await new Promise(r => setTimeout(r, 500))

  // 5. 关键：万向教务系统用 RSA 加密密码
  //    必须先获取公钥，然后加密密码，填入 #mm 和 #hidMm
  const encrypted = await page.evaluate(async (pwd) => {
    // 等待公钥加载（login.js 会异步获取）
    await new Promise(r => setTimeout(r, 1000))

    // 检查是否需要加密（#mmsfjm 字段）
    const mmsfjm = document.querySelector('#mmsfjm')
    if (mmsfjm && mmsfjm.value !== '1') {
      // 不需要加密，直接返回明文
      return { encrypted: false, password: pwd }
    }

    // 需要 RSA 加密
    if (typeof RSAKey === 'undefined') {
      return { encrypted: false, password: pwd, warning: 'RSAKey not loaded' }
    }

    // 获取公钥（login.js 已经获取并存在局部变量中，需要重新获取）
    try {
      const resp = await fetch('/xtgl/login_getPublicKey.html?time=' + Date.now())
      const data = await resp.json()
      const modulus = data['modulus']
      const exponent = data['exponent']

      const rsaKey = new RSAKey()
      rsaKey.setPublic(b64tohex(modulus), b64tohex(exponent))
      const enPassword = hex2b64(rsaKey.encrypt(pwd))

      // 填入加密后的密码
      document.querySelector('#mm').value = enPassword
      document.querySelector('#hidMm').value = enPassword

      return { encrypted: true, password: enPassword }
    } catch (e) {
      return { encrypted: false, password: pwd, error: e.message }
    }
  }, password)

  console.log('[万向登录] 密码加密:', JSON.stringify(encrypted))
  await new Promise(r => setTimeout(r, 500))

  // 6. 手动完成登录流程（完全绕过 jQuery 事件系统）
  //    在页面里：获取公钥 → RSA加密 → 填充表单 → 提交
  console.log('[万向登录] 手动执行登录流程...')
  const loginResult = await page.evaluate(async (pwd) => {
    try {
      // 获取 RSA 公钥（注意：modulus 和 exponent 是 base64，需要转 hex）
      const resp = await fetch('/xtgl/login_getPublicKey.html?time=' + Date.now())
      const data = await resp.json()
      
      // RSA 加密 — 关键：必须用 b64tohex() 转换公钥！
      const rsaKey = new RSAKey()
      rsaKey.setPublic(b64tohex(data.modulus), b64tohex(data.exponent))
      const encrypted = hex2b64(rsaKey.encrypt(pwd))
      
      // 填充表单
      document.querySelector('#mm').value = encrypted
      document.querySelector('#hidMm').value = encrypted
      
      // 提交表单
      document.querySelector('form').submit()
      
      return { success: true, encrypted }
    } catch (e) {
      return { success: false, error: e.message }
    }
  }, password)
  
  console.log('[万向登录] 登录提交结果:', JSON.stringify(loginResult))
  if (!loginResult.success) {
    throw new Error('LOGIN_SUBMIT_FAILED: ' + loginResult.error)
  }
  
  // 轮询等待 URL 变化
  console.log('[万向登录] 等待登录跳转...')
  let loggedIn = false
  for (let i = 0; i < 40; i++) {
    await new Promise(r => setTimeout(r, 500))
    try {
      const url = page.url()
      if (!url.includes('login_slogin') && !url.includes('login_getPublicKey')) {
        loggedIn = true
        console.log('[万向登录] 跳转成功:', url)
        break
      }
    } catch (e) { /* 导航中 */ }
  }
  if (!loggedIn) {
    throw new Error('LOGIN_TIMEOUT: 登录跳转超时')
  }
  
  await new Promise(r => setTimeout(r, 2000))
  
  // 7. 检查登录是否成功
  const currentUrl = page.url()
  const pageContent = await page.content()
  console.log('[万向登录] 登录后 URL:', currentUrl)
  console.log('[万向登录] 页面内容长度:', pageContent.length)
  
  if (pageContent.includes('用户名或密码不正确') || pageContent.includes('密码错误')) {
    throw new Error('INVALID_CREDENTIALS')
  }
  if (pageContent.includes('验证码')) {
    throw new Error('需要验证码，无法自动登录')
  }
  if (currentUrl.includes('login_slogin') || currentUrl.includes('login')) {
    console.log('[万向登录] 仍在登录页，可能登录失败')
    throw new Error('LOGIN_FAILED: 仍在登录页')
  }

  // 8. 万向课表 — 最终方案：直接 GET 请求课表 JSON 数据
  //    关键发现：xskbcx_cxXsgrkb.html 返回 JSON（不是 HTML），参数是 GET query
  console.log('[万向登录] 直接 GET 课表 JSON 数据...')
  
  // 先回到首页确保 session 有效
  await page.goto('https://jwgl.wxpoly.cn/xtgl/index_initMenu.html?jsdm=xs&_t=' + Date.now(), { 
    waitUntil: 'networkidle2', timeout: 15000 
  })
  await new Promise(r => setTimeout(r, 2000))
  
  // 直接用 GET 请求课表 JSON 数据
  const courseJson = await page.evaluate(async () => {
    const params = new URLSearchParams({
      gnmkdm: 'N2151',
      xnm: '2025',
      xqm: '12',
      kzlx: 'ck',
      xsdm: '',
      kclbdm: ''
    })
    const resp = await fetch('/kbcx/xskbcx_cxXsgrkb.html?' + params.toString() + '&_t=' + Date.now(), {
      credentials: 'include',
      headers: { 'X-Requested-With': 'XMLHttpRequest' }
    })
    return await resp.json()
  })
  console.log('[万向登录] 获取到课表 JSON! 课程数:', courseJson.kbList?.length || 0)
  
  // 将 JSON 数据存到 page 变量中供后续解析
  await page.evaluate((data) => { window.__courseData = data }, courseJson)

  // 9. 解析课表数据 — 从 JSON 数据解析（kbList）
  console.log('[万向登录] 开始解析课表数据...')
  const courses = await parseWanxiangCourses(page)
  return courses
}

async function parseWanxiangCourses(page) {
  // 从 page 变量中获取 JSON 数据（由上一步存入）
  return await page.evaluate(() => {
    const data = window.__courseData
    if (!data || !data.kbList || data.kbList.length === 0) return []
    
    const courses = []
    const colors = ['#4361ee', '#764ba2', '#43e97b', '#f5576c', '#fa709a', '#fee140', '#38f9d7', '#667eea', '#ff9800', '#e91e63']
    
    // 解析周数字符串，如 "2-17周"、"3-14周"、"8周"、"3-8周,10-17周"
    function parseWeeks(zcd) {
      if (!zcd) return { startWeek: 1, endWeek: 16 }
      // 移除所有空格
      zcd = zcd.replace(/\s/g, '')
      // 匹配数字
      const matches = zcd.match(/(\d+)/g)
      if (!matches || matches.length === 0) return { startWeek: 1, endWeek: 16 }
      const weeks = matches.map(Number)
      return { startWeek: Math.min(...weeks), endWeek: Math.max(...weeks) }
    }
    
    // 解析节次字符串，如 "1-2"、"5-8"、"9-10"
    function parseSections(jcs) {
      if (!jcs) return { startSection: 1, endSection: 2 }
      const parts = jcs.split('-').map(Number)
      if (parts.length === 1) return { startSection: parts[0], endSection: parts[0] }
      return { startSection: parts[0], endSection: parts[1] }
    }
    
    for (const item of data.kbList) {
      const { startWeek, endWeek } = parseWeeks(item.zcd)
      const { startSection, endSection } = parseSections(item.jcs)
      
      courses.push({
        name: item.kcmc || '',
        teacher: item.xm || '',
        location: item.cdmc || '',
        weekDay: parseInt(item.xqj) - 1,  // 1-5 → 0-4
        startSection,
        endSection,
        startTime: '',
        endTime: '',
        startWeek,
        endWeek,
        color: colors[courses.length % colors.length],
        remark: `${item.zcd || ''} ${item.kclb || ''} ${item.xf || ''}学分`.trim()
      })
    }
    
    return courses
  })
}

// ============ 通用正方教务系统 ============

async function scrapeZhengfang(page, eduUrl, username, password) {
  // 1. 访问登录页
  const loginUrl = eduUrl.includes('/Login') ? eduUrl : eduUrl.replace(/\/?$/, '/Login/Index')
  await page.goto(loginUrl, { waitUntil: 'networkidle2', timeout: 20000 })

  // 2. 填写登录表单（正方教务通常的表单结构）
  await page.waitForSelector('input[name="username"], input[name="UserName"], #username, #txtUserName', { timeout: 10000 })
  
  // 尝试不同的字段名
  const userSelector = await findSelector(page, ['input[name="username"]', 'input[name="UserName"]', '#username', '#txtUserName', 'input[type="text"]'])
  const passSelector = await findSelector(page, ['input[name="password"]', 'input[name="Password"]', '#password', '#txtPassword', 'input[type="password"]'])
  
  await page.type(userSelector, username, { delay: 50 })
  await page.type(passSelector, password, { delay: 50 })

  // 3. 点击登录
  const loginBtnSelector = await findSelector(page, [
    'input[type="submit"]', 'button[type="submit"]',
    '#btnLogin', '.login-btn', 'input[value="登录"]', 'input[value="Login"]'
  ])
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 20000 }).catch(() => {}),
    page.click(loginBtnSelector)
  ])

  // 4. 检查登录是否成功
  const pageContent = await page.content()
  if (pageContent.includes('用户名或密码错误') || pageContent.includes('密码错误')) {
    throw new Error('INVALID_CREDENTIALS')
  }

  // 5. 导航到课表页面
  const courseUrls = [
    '/Student/CourseSchedule',     // 新版正方
    '/jsxk/yskjixk.aspx',          // 旧版正方
    '/znpk/PkList.aspx',           // 部分版本
    '/Student/teachingResources/courseSchedule',  // 另一种版本
  ]

  let coursePageUrl = null
  for (const path of courseUrls) {
    const url = new URL(path, eduUrl.startsWith('http') ? eduUrl : `http://${eduUrl}`).href
    try {
      const response = await page.goto(url, { waitUntil: 'networkidle2', timeout: 10000 })
      if (response && response.ok()) {
        const content = await page.content()
        if (content.includes('课程') || content.includes('节次') || content.includes('星期')) {
          coursePageUrl = url
          break
        }
      }
    } catch (e) { continue }
  }

  if (!coursePageUrl) {
    // 尝试从首页链接找课表入口
    await page.goto(new URL('/', eduUrl.startsWith('http') ? eduUrl : `http://${eduUrl}`).href, {
      waitUntil: 'networkidle2', timeout: 15000
    })
    const links = await page.$$eval('a', els => els.map(el => ({ text: el.textContent, href: el.href })))
    const courseLink = links.find(l => l.text.includes('课表') || l.text.includes('课程') || l.text.includes('选课'))
    if (courseLink) {
      await page.goto(courseLink.href, { waitUntil: 'networkidle2', timeout: 15000 })
    }
  }

  // 6. 解析课表数据
  const courses = await parseZhengfangCourses(page)
  return courses
}

async function parseZhengfangCourses(page) {
  return await page.evaluate(() => {
    const courses = []
    const colors = ['#4361ee', '#764ba2', '#43e97b', '#f5576c', '#fa709a', '#fee140', '#38f9d7', '#667eea', '#ff9800', '#e91e63']
    
    // 正方教务课表通常是 table 结构
    const tables = document.querySelectorAll('table')
    for (const table of tables) {
      const rows = table.querySelectorAll('tr')
      if (rows.length < 2) continue

      for (let i = 1; i < rows.length; i++) {
        const cells = rows[i].querySelectorAll('td')
        for (let j = 1; j < cells.length; j++) {
          const cellText = cells[j].innerText.trim()
          if (!cellText || cellText === '—' || cellText === '-') continue

          // 解析单元格中的课程信息
          // 正方格式通常是：课程名\n教师\n教室\n周次
          const lines = cellText.split('\n').map(l => l.trim()).filter(Boolean)
          if (lines.length >= 1) {
            const course = {
              name: lines[0] || '',
              teacher: lines.find(l => l.includes('教授') || l.includes('老师') || l.includes('讲师')) || lines[1] || '',
              location: lines.find(l => l.includes('楼') || l.includes('室') || l.includes('馆') || l.includes('厅')) || lines[2] || '',
              weekDay: j - 1,  // 列号对应星期
              startSection: i * 2 - 1,  // 行号对应节次（简化）
              endSection: i * 2,
              startTime: '',
              endTime: '',
              startWeek: 1,
              endWeek: 16,
              color: colors[courses.length % colors.length],
              remark: ''
            }

            // 解析周次信息
            const weekMatch = cellText.match(/(\d+)-(\d+)周/)
            if (weekMatch) {
              course.startWeek = parseInt(weekMatch[1])
              course.endWeek = parseInt(weekMatch[2])
            }

            // 解析时间
            const timeMatch = cellText.match(/(\d{1,2}:\d{2})-(\d{1,2}:\d{2})/)
            if (timeMatch) {
              course.startTime = timeMatch[1]
              course.endTime = timeMatch[2]
            }

            if (course.name) courses.push(course)
          }
        }
      }
    }

    return courses
  })
}

// ============ 青果教务系统 ============

async function scrapeQingguo(page, eduUrl, username, password) {
  // 青果教务通常有独立的登录页面
  await page.goto(eduUrl, { waitUntil: 'networkidle2', timeout: 20000 })

  // 等待登录表单
  await page.waitForSelector('input[type="text"], input[name="username"], #username', { timeout: 10000 })

  // 填写登录信息
  const userSelector = await findSelector(page, ['#username', 'input[name="username"]', 'input[name="UserCode"]', 'input[type="text"]'])
  const passSelector = await findSelector(page, ['#password', 'input[name="password"]', 'input[name="UserPwd"]', 'input[type="password"]'])

  await page.type(userSelector, username, { delay: 50 })
  await page.type(passSelector, password, { delay: 50 })

  // 登录
  const btnSelector = await findSelector(page, ['#btnLogin', '.login-btn', 'input[type="submit"]', 'button[type="submit"]'])
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 20000 }).catch(() => {}),
    page.click(btnSelector)
  ])

  // 检查登录状态
  const content = await page.content()
  if (content.includes('密码错误') || content.includes('用户名不存在')) {
    throw new Error('INVALID_CREDENTIALS')
  }

  // 导航到课表（青果的路径因学校而异）
  const coursePaths = ['/Njlgxykbcx.aspx', '/xsjk.aspx', '/jxzl.aspx', '/kbcx.aspx']
  for (const path of coursePaths) {
    try {
      const url = new URL(path, eduUrl).href
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 10000 })
      const c = await page.content()
      if (c.includes('课程') || c.includes('节次')) break
    } catch (e) { continue }
  }

  // 解析课表（青果结构与正方类似但有差异）
  const courses = await parseQingguoCourses(page)
  return courses
}

async function parseQingguoCourses(page) {
  return await page.evaluate(() => {
    const courses = []
    const colors = ['#4361ee', '#764ba2', '#43e97b', '#f5576c', '#fa709a', '#fee140', '#38f9d7', '#667eea', '#ff9800', '#e91e63']

    // 青果课表解析（与正方类似）
    const tables = document.querySelectorAll('table')
    for (const table of tables) {
      const rows = table.querySelectorAll('tr')
      for (let i = 1; i < rows.length; i++) {
        const cells = rows[i].querySelectorAll('td')
        for (let j = 1; j < cells.length; j++) {
          const text = cells[j].innerText.trim()
          if (!text || text === '—') continue

          const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
          if (lines.length >= 1) {
            courses.push({
              name: lines[0],
              teacher: lines[1] || '',
              location: lines[2] || '',
              weekDay: j - 1,
              startSection: i * 2 - 1,
              endSection: i * 2,
              startTime: '',
              endTime: '',
              startWeek: 1,
              endWeek: 16,
              color: colors[courses.length % colors.length],
              remark: ''
            })
          }
        }
      }
    }
    return courses
  })
}

// ============ 金智教务系统 ============

async function scrapeJinzhi(page, eduUrl, username, password) {
  await page.goto(eduUrl, { waitUntil: 'networkidle2', timeout: 20000 })

  // 金智教务登录
  await page.waitForSelector('input', { timeout: 10000 })

  const userSelector = await findSelector(page, ['#username', 'input[name="username"]', 'input[name="UserCode"]', 'input[type="text"]'])
  const passSelector = await findSelector(page, ['#password', 'input[name="password"]', 'input[name="UserPwd"]', 'input[type="password"]'])

  await page.type(userSelector, username, { delay: 50 })
  await page.type(passSelector, password, { delay: 50 })

  const btnSelector = await findSelector(page, ['#btnLogin', '.login-btn', 'input[type="submit"]', 'button[type="submit"]', '.submit'])
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 20000 }).catch(() => {}),
    page.click(btnSelector)
  ])

  // 导航到课表
  const coursePaths = ['/Student/Course', '/kbcx.aspx', '/xsbk.aspx']
  for (const path of coursePaths) {
    try {
      await page.goto(new URL(path, eduUrl).href, { waitUntil: 'networkidle2', timeout: 10000 })
      break
    } catch (e) { continue }
  }

  const courses = await parseJinzhiCourses(page)
  return courses
}

async function parseJinzhiCourses(page) {
  // 金智教务的课表结构可能不同，使用通用解析
  return await page.evaluate(() => {
    const courses = []
    const colors = ['#4361ee', '#764ba2', '#43e97b', '#f5576c', '#fa709a', '#fee140', '#38f9d7', '#667eea', '#ff9800', '#e91e63']

    const tables = document.querySelectorAll('table')
    for (const table of tables) {
      const rows = table.querySelectorAll('tr')
      for (let i = 1; i < rows.length; i++) {
        const cells = rows[i].querySelectorAll('td')
        for (let j = 1; j < cells.length; j++) {
          const text = cells[j].innerText.trim()
          if (!text || text === '—') continue

          const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
          if (lines.length >= 1) {
            courses.push({
              name: lines[0],
              teacher: lines[1] || '',
              location: lines[2] || '',
              weekDay: j - 1,
              startSection: i * 2 - 1,
              endSection: i * 2,
              startTime: '',
              endTime: '',
              startWeek: 1,
              endWeek: 16,
              color: colors[courses.length % colors.length],
              remark: ''
            })
          }
        }
      }
    }
    return courses
  })
}

// ============ 工具函数 ============

/**
 * 从多个选择器中找到第一个存在的
 */
async function findSelector(page, selectors) {
  for (const sel of selectors) {
    const el = await page.$(sel)
    if (el) return sel
  }
  return selectors[0]  // fallback 到第一个
}

module.exports = { scrapeCourses }
