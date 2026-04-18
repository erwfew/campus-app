// 效园通 - 前端 JavaScript（API 对接版）

var API_BASE = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
  ? 'http://localhost:3000/api'
  : location.origin + '/api';

// ==================== API 客户端 ====================

function getToken() {
  return localStorage.getItem('campus_token');
}

function setToken(token) {
  localStorage.setItem('campus_token', token);
}

function getUser() {
  var u = localStorage.getItem('campus_user');
  return u ? JSON.parse(u) : null;
}

function setUser(user) {
  localStorage.setItem('campus_user', JSON.stringify(user));
}

function apiRequest(method, url, data) {
  var headers = { 'Content-Type': 'application/json' };
  var token = getToken();
  if (token) headers['Authorization'] = 'Bearer ' + token;

  var options = { method: method, headers: headers };
  if (data && method !== 'GET') {
    options.body = JSON.stringify(data);
  }

  return fetch(API_BASE + url, options)
    .then(function(res) { return res.json(); })
    .then(function(json) {
      if (!json.success) throw new Error(json.error ? json.error.message : '请求失败');
      return json.data;
    });
}

// ==================== 页面初始化 ====================

document.addEventListener('DOMContentLoaded', function() {
  checkAuth();
  updateTime();
  setInterval(updateTime, 60000);
});

function checkAuth() {
  var token = getToken();
  if (!token) {
    showLoginPage();
    return;
  }
  // 验证 token 是否有效
  apiRequest('GET', '/student/profile')
    .then(function(data) {
      setUser(data);
      loadAllData();
    })
    .catch(function() {
      localStorage.removeItem('campus_token');
      localStorage.removeItem('campus_user');
      showLoginPage();
    });
}

function showLoginPage() {
  var content = document.getElementById('mainContent');
  content.innerHTML =
    '<div class="page active" id="page-login">' +
      '<div style="padding:60px 20px;text-align:center;">' +
        '<div style="font-size:60px;margin-bottom:20px;">🏫</div>' +
        '<h2 style="margin-bottom:30px;color:#333;">效园通</h2>' +
        '<p style="color:#999;margin-bottom:30px;">一站式校园生态综合平台</p>' +
        '<div style="margin-bottom:16px;">' +
          '<input type="text" id="loginUsername" placeholder="学号/用户名" style="width:100%;padding:14px 16px;border:1px solid #ddd;border-radius:12px;font-size:16px;box-sizing:border-box;">' +
        '</div>' +
        '<div style="margin-bottom:24px;">' +
          '<input type="password" id="loginPassword" placeholder="密码" style="width:100%;padding:14px 16px;border:1px solid #ddd;border-radius:12px;font-size:16px;box-sizing:border-box;">' +
        '</div>' +
        '<div id="loginError" style="color:#f44336;margin-bottom:16px;font-size:14px;display:none;"></div>' +
        '<button onclick="doLogin()" style="width:100%;padding:14px;background:linear-gradient(135deg,#4361ee,#3a56d4);color:white;border:none;border-radius:12px;font-size:16px;font-weight:bold;cursor:pointer;">登录</button>' +
        '<p style="margin-top:16px;color:#999;font-size:12px;">默认账号：stu20230001 / student123</p>' +
      '</div>' +
    '</div>';
}

function doLogin() {
  var username = document.getElementById('loginUsername').value.trim();
  var password = document.getElementById('loginPassword').value;
  var errorDiv = document.getElementById('loginError');

  if (!username || !password) {
    errorDiv.textContent = '请输入用户名和密码';
    errorDiv.style.display = 'block';
    return;
  }

  apiRequest('POST', '/auth/login', { username: username, password: password })
    .then(function(data) {
      setToken(data.token);
      setUser(data.user);
      // 重新加载主页面
      location.reload();
    })
    .catch(function(err) {
      errorDiv.textContent = err.message || '登录失败';
      errorDiv.style.display = 'block';
    });
}

function doLogout() {
  localStorage.removeItem('campus_token');
  localStorage.removeItem('campus_user');
  location.reload();
}

// ==================== 数据加载 ====================

function loadAllData() {
  loadWelcomeData();
  loadTodayCourses();
  loadAttendance();
  loadCourseSchedule();
  loadHomework();
  loadNotices();
  loadRanking();
  loadProfile();
  loadGrades();
}

function loadWelcomeData() {
  var user = getUser();
  if (user) {
    var h2 = document.querySelector('#page-home .welcome-text h2');
    var p = document.querySelector('#page-home .welcome-text p');
    if (h2) h2.textContent = '你好，' + (user.realName || '同学') + ' 👋';
    if (p) p.textContent = user.college ? user.college + ' · ' + (user.studentId || '') : '欢迎使用效园通';
  }
}

function loadTodayCourses() {
  apiRequest('GET', '/student/today-courses')
    .then(function(data) {
      var container = document.querySelector('#page-home .course-timeline');
      if (!container || !data || data.length === 0) {
        var section = document.querySelector('#page-home .section');
        if (section) {
          var timeline = section.querySelector('.course-timeline');
          if (timeline) timeline.innerHTML = '<div style="text-align:center;padding:20px;color:#999;">今天没有课程</div>';
        }
        return;
      }

      var html = '';
      for (var i = 0; i < data.length; i++) {
        var c = data[i];
        var statusClass = c.status === 'finished' ? 'completed' : c.status === 'ongoing' ? 'current' : 'upcoming';
        var statusLabel = c.status === 'finished' ? '已上课' : c.status === 'ongoing' ? '上课中' : '待上课';
        html += '<div class="course-card ' + statusClass + '">' +
          '<div class="course-time">' + (c.time || '').replace(' - ', '<br>') + '</div>' +
          '<div class="course-info"><h4>' + escapeHtml(c.name) + '</h4>' +
          '<p>' + escapeHtml(c.location || '') + ' · ' + escapeHtml(c.teacher || '') + '</p>' +
          '<span class="course-status ' + (statusClass === 'completed' ? 'done' : statusClass === 'current' ? 'going' : 'wait') + '">' + statusLabel + '</span></div></div>';
      }
      container.innerHTML = html;

      // 更新首页欢迎语中的课程数
      var welcomeP = document.querySelector('#page-home .welcome-text p');
      if (welcomeP && !welcomeP.textContent.includes(user.college)) {
        welcomeP.textContent = '今天有' + data.length + '节课，加油！';
      }
    })
    .catch(function() { /* 静默失败 */ });
}

function loadAttendance() {
  apiRequest('GET', '/student/attendance')
    .then(function(data) {
      if (!data) return;

      // 更新首页考勤圆环
      var circle = document.querySelector('#page-study .attendance-circle circle:nth-child(2)');
      var text = document.querySelector('#page-study .attendance-circle text');
      if (circle && text) {
        var circumference = 2 * Math.PI * 42;
        var offset = circumference * (1 - data.rate / 100);
        circle.setAttribute('stroke-dasharray', circumference);
        circle.setAttribute('stroke-dashoffset', offset);
        text.textContent = data.rate + '%';
      }

      // 更新考勤详情
      var details = document.querySelectorAll('#page-study .att-item');
      if (details.length >= 3) {
        details[0].innerHTML = '<span class="att-dot present"></span>出勤 ' + data.present + '次';
        details[1].innerHTML = '<span class="att-dot absent"></span>缺勤 ' + data.absent + '次';
        details[2].innerHTML = '<span class="att-dot late"></span>迟到 ' + data.late + '次';
      }
    })
    .catch(function() { /* 静默失败 */ });
}

function loadCourseSchedule() {
  apiRequest('GET', '/student/courses')
    .then(function(data) {
      if (!data || data.length === 0) return;

      // 更新周课表视图
      var weekView = document.getElementById('weekView');
      if (weekView) {
        var dayNames = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
        var grouped = {};
        for (var i = 0; i < data.length; i++) {
          var c = data[i];
          if (!grouped[c.weekDay]) grouped[c.weekDay] = [];
          grouped[c.weekDay].push(c);
        }

        var html = '';
        for (var d = 0; d < 5; d++) {
          var dayCourses = grouped[d] || [];
          html += '<div class="day-col"><div class="day-header">' + dayNames[d] + '</div>';
          if (dayCourses.length > 0) {
            for (var j = 0; j < dayCourses.length; j++) {
              var dc = dayCourses[j];
              html += '<div class="course-block" style="background:' + (dc.color || '#4361ee') + ';">' +
                '<h5>' + escapeHtml(dc.name) + '</h5>' +
                '<p>第' + dc.startSection + '-' + dc.endSection + '节</p>' +
                '<p>' + escapeHtml(dc.location || '') + '</p></div>';
            }
          } else {
            html += '<div class="no-course">—</div>';
          }
          html += '</div>';
        }
        weekView.innerHTML = html;
      }

      // 更新我的课程总数
      var summaryValue = document.querySelector('#page-study .data-summary .summary-value');
      if (summaryValue) summaryValue.textContent = data.length;
    })
    .catch(function() { /* 静默失败 */ });
}

function loadHomework() {
  apiRequest('GET', '/homework')
    .then(function(data) {
      if (!data || !data.homeworks) return;

      var container = document.querySelector('#page-study .homework-list');
      if (!container) return;

      var html = '';
      for (var i = 0; i < data.homeworks.length; i++) {
        var h = data.homeworks[i];
        var statusLabel = h.submitted ? '已提交' : (h.dueDate && new Date(h.dueDate) < new Date() ? '已过期' : '待提交');
        var statusClass = h.submitted ? 'done' : (h.dueDate && new Date(h.dueDate) < new Date() ? 'expired' : 'pending');
        html += '<div class="homework-item">' +
          '<div class="hw-dot ' + statusClass + '"></div>' +
          '<div class="hw-info"><h4>' + escapeHtml(h.name) + '</h4>' +
          '<p>' + escapeHtml(h.courseName) + ' · 截止 ' + (h.dueDate || '未知') + '</p></div>' +
          '<span class="hw-status ' + statusClass + '">' + statusLabel + '</span></div>';
      }
      container.innerHTML = html;
    })
    .catch(function() { /* 静默失败 */ });
}

function loadNotices() {
  apiRequest('GET', '/notices')
    .then(function(data) {
      if (!data || data.length === 0) return;

      // 更新首页公告栏
      var noticeBar = document.querySelector('#page-home .notice-bar .notice-text');
      if (noticeBar && data.length > 0) {
        noticeBar.textContent = data[0].title;
      }

      // 更新公告列表页
      var noticeList = document.querySelector('#page-home .notice-list');
      if (noticeList) {
        var html = '';
        for (var i = 0; i < Math.min(data.length, 5); i++) {
          var n = data[i];
          html += '<div class="notice-item' + (n.important ? ' important' : '') + '" onclick="viewNotice(' + n.id + ')">' +
            '<span class="notice-tag">' + escapeHtml(n.type || '通知') + '</span>' +
            '<span class="notice-title">' + escapeHtml(n.title) + '</span>' +
            '<span class="notice-date">' + escapeHtml(n.date || '') + '</span></div>';
        }
        noticeList.innerHTML = html;
      }
    })
    .catch(function() { /* 静默失败 */ });
}

function loadRanking() {
  apiRequest('GET', '/ranking')
    .then(function(data) {
      if (!data || data.length === 0) return;

      var container = document.querySelector('#page-rank .rank-list');
      if (!container) return;

      var medals = ['🥇', '🥈', '🥉'];
      var html = '';
      for (var i = 0; i < data.length; i++) {
        var r = data[i];
        html += '<div class="rank-item">' +
          '<div class="rank-number">' + r.rank + '</div>' +
          '<div class="rank-avatar">🧑</div>' +
          '<div class="rank-info"><h4>' + escapeHtml(r.name) + '</h4>' +
          '<p>到课率 ' + r.value + r.unit + '</p></div>' +
          '<div class="rank-score">' + (medals[i] || r.value + r.unit) + '</div></div>';
      }
      container.innerHTML = html;
    })
    .catch(function() { /* 静默失败 */ });
}

function loadProfile() {
  var user = getUser();
  if (!user) return;

  var nameEl = document.querySelector('#page-profile .profile-info h2');
  var descEl = document.querySelector('#page-profile .profile-info p');
  if (nameEl) nameEl.textContent = user.realName || '同学';
  if (descEl) descEl.textContent = (user.college || '') + (user.studentId ? ' · ' + user.studentId : '');

  // 更新考勤率
  apiRequest('GET', '/student/attendance')
    .then(function(data) {
      var summaryValue = document.querySelector('#page-profile .data-summary .summary-value');
      if (summaryValue && data) summaryValue.textContent = data.rate + '%';
    })
    .catch(function() { /* 静默失败 */ });
}

function loadGrades() {
  apiRequest('GET', '/student/grades')
    .then(function(data) {
      if (!data || data.length === 0) return;

      // 可以在学习页面的成绩区域展示
      var gradesSection = document.getElementById('gradesContainer');
      if (gradesSection) {
        var html = '';
        for (var i = 0; i < data.length; i++) {
          var g = data[i];
          html += '<div class="grade-item"><h4>' + escapeHtml(g.course) + '</h4>' +
            '<p>平时: ' + g.usual + ' 期中: ' + g.midterm + ' 期末: ' + g.final + ' 总评: ' + g.total + '</p></div>';
        }
        gradesSection.innerHTML = html;
      }
    })
    .catch(function() { /* 静默失败 */ });
}

// ==================== 页面切换 ====================

function switchTab(tab) {
  document.querySelectorAll('.page').forEach(function(p) { p.classList.remove('active'); });
  var target = document.getElementById('page-' + tab);
  if (target) target.classList.add('active');
  document.querySelectorAll('.nav-item').forEach(function(n) { n.classList.remove('active'); });
  var navItem = document.querySelector('.nav-item[data-tab="' + tab + '"]');
  if (navItem) navItem.classList.add('active');
  window.scrollTo(0, 0);
}

// ==================== 学习中心 Tab ====================

function switchStudyTab(el, tabId) {
    document.querySelectorAll('.study-tab').forEach(function(t) { t.classList.remove('active'); });
    el.classList.add('active');
    document.querySelectorAll('.study-panel').forEach(function(p) { p.classList.remove('active'); });
    document.getElementById(tabId).classList.add('active');
}

// ==================== 弹窗 ====================

function closeModal() {
  document.getElementById('modalOverlay').style.display = 'none';
}

function showModal(title, content) {
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalBody').innerHTML = content;
  document.getElementById('modalOverlay').style.display = 'flex';
}

// ==================== 导航功能 ====================

function showRoute(place) {
  document.getElementById('routeEnd').value = place;
}

function swapRoute() {
  var start = document.getElementById('routeStart');
  var end = document.getElementById('routeEnd');
  var temp = start.value;
  start.value = end.value;
  end.value = temp;
}

function selectMode(el, mode) {
  document.querySelectorAll('.route-mode').forEach(function(m) { m.classList.remove('active'); });
  el.classList.add('active');
}

function planRoute() {
  var start = document.getElementById('routeStart').value;
  var end = document.getElementById('routeEnd').value;
  if (!end) { showModal('提示', '请输入目的地'); return; }
  var result = document.getElementById('routeResult');
  result.style.display = 'block';
  result.innerHTML = '<div class="route-info"><p><strong>' + escapeHtml(start) + '</strong> → <strong>' + escapeHtml(end) + '</strong></p><p>预计步行 5 分钟 · 约 350 米</p></div>';
}

function showPlaceDetail(place) {
  var details = {
    '图书馆': { floors: 6, hours: '7:00-22:00', seats: 1200 },
    '食堂一': { floors: 3, hours: '6:30-21:00', seats: 800 },
    '体育馆': { floors: 2, hours: '6:00-22:00', seats: 500 }
  };
  var info = details[place] || { floors: '-', hours: '-', seats: '-' };
  showModal(place + ' 详情', '<p>楼层数：' + info.floors + ' 层</p><p>开放时间：' + info.hours + '</p><p>容纳人数：' + info.seats + ' 人</p>');
}

// ==================== 课表功能 ====================

function switchView(el, view) {
  document.querySelectorAll('.toggle-btn').forEach(function(b) { b.classList.remove('active'); });
  el.classList.add('active');
  document.getElementById('weekView').style.display = view === 'week' ? 'block' : 'none';
  document.getElementById('dayView').style.display = view === 'day' ? 'block' : 'none';
}

var currentDayOffset = 0;
var dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

function changeDay(delta) {
  currentDayOffset += delta;
  var d = new Date();
  d.setDate(d.getDate() + currentDayOffset);
  var label = (currentDayOffset === 0 ? '今天 ' : '') + dayNames[d.getDay()];
  document.getElementById('currentDay').textContent = label;
}

// ==================== 跑步功能 ====================

var runTimer = null;
var runSeconds = 0;
var runStarted = false;

function toggleRun() {
  var btn = document.getElementById('runBtn');
  if (runStarted) {
    clearInterval(runTimer);
    btn.textContent = '继续跑步';
    btn.classList.remove('pause');
    btn.classList.add('start');
    runStarted = false;
  } else {
    runStarted = true;
    btn.textContent = '暂停';
    btn.classList.remove('start');
    btn.classList.add('pause');
    runTimer = setInterval(function() {
      runSeconds++;
      var h = String(Math.floor(runSeconds / 3600)).padStart(2, '0');
      var m = String(Math.floor((runSeconds % 3600) / 60)).padStart(2, '0');
      var s = String(runSeconds % 60).padStart(2, '0');
      document.getElementById('runTimer').textContent = h + ':' + m + ':' + s;
      var dist = (runSeconds * 0.0025).toFixed(2);
      document.getElementById('runDistance').textContent = dist;
      document.getElementById('runCalories').textContent = Math.floor(runSeconds * 0.15);
    }, 1000);
  }
}

function resetRun() {
  clearInterval(runTimer);
  runStarted = false;
  runSeconds = 0;
  document.getElementById('runTimer').textContent = '00:00:00';
  document.getElementById('runDistance').textContent = '0.00';
  document.getElementById('runPace').textContent = "0'00\"";
  document.getElementById('runCalories').textContent = '0';
  var btn = document.getElementById('runBtn');
  btn.textContent = '开始跑步';
  btn.classList.remove('pause');
  btn.classList.add('start');
}

// ==================== 排行功能 ====================

function switchRankTab(el, tab) {
  document.querySelectorAll('.rank-tab').forEach(function(t) { t.classList.remove('active'); });
  el.classList.add('active');
}

// ==================== 公告 ====================

function viewNotice(id) {
  showModal('公告详情', '<p>加载中...</p>');
  apiRequest('GET', '/notices')
    .then(function(data) {
      for (var i = 0; i < data.length; i++) {
        if (data[i].id === id) {
          showModal(data[i].title, '<p>' + escapeHtml(data[i].content || '暂无详细内容') + '</p>');
          return;
        }
      }
    })
    .catch(function() {
      showModal('提示', '加载失败');
    });
}

// ==================== 工具函数 ====================

function updateTime() {
  var now = new Date();
  var h = String(now.getHours()).padStart(2, '0');
  var m = String(now.getMinutes()).padStart(2, '0');
  var el = document.getElementById('currentTime');
  if (el) el.textContent = h + ':' + m;
}

function escapeHtml(str) {
  if (!str) return '';
  var div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}
