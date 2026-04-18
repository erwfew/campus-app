<template>
	<view class="edu-import-page">
		<!-- 教务系统选择 -->
		<view class="edu-header">
			<text class="edu-title">教务系统导入</text>
			<text class="edu-desc">搜索学校名称自动匹配，或手动选择系统类型</text>
		</view>

		<!-- 学校搜索 -->
		<view class="search-section">
			<view class="search-box">
				<text class="search-icon">🔍</text>
				<input
					class="search-input"
					v-model="schoolName"
					placeholder="输入学校名称，如：清华大学、北京大学..."
					@input="onSchoolInput"
				/>
				<text class="search-clear" v-if="schoolName" @tap="clearSearch">✕</text>
			</view>
			<!-- 搜索结果 -->
			<view class="search-result" v-if="searchResult">
				<view class="result-card" :class="searchResult.type">
					<view class="result-header">
						<text class="result-school">{{searchResult.school}}</text>
						<text class="result-badge">{{searchResult.systemName}}</text>
					</view>
					<text class="result-tip">已自动匹配教务系统类型，点击下方对应类型即可</text>
				</view>
			</view>
			<view class="no-result" v-if="schoolName && !searchResult">
				<text class="no-result-text">未找到该学校，可手动选择教务系统类型</text>
			</view>
		</view>

		<!-- 分割线 -->
		<view class="divider">
			<text class="divider-text">或手动选择系统类型</text>
		</view>

		<!-- 教务系统类型 -->
		<view class="system-list">
			<view
				class="system-item"
				v-for="(sys, index) in systems"
				:key="index"
				:class="{selected: selectedSystem === index}"
				@tap="selectSystem(index)"
			>
				<view class="sys-icon" :style="{background: sys.color}">
					<text class="sys-emoji">{{sys.icon}}</text>
				</view>
				<view class="sys-info">
					<text class="sys-name">{{sys.name}}</text>
					<text class="sys-desc">{{sys.desc}}</text>
				</view>
				<view class="sys-check" v-if="selectedSystem === index">
					<text class="check-icon">✓</text>
				</view>
			</view>
		</view>

		<!-- 学校URL输入 -->
		<view class="url-section" v-if="selectedSystem !== -1">
			<view class="form-group">
				<text class="form-label">教务系统地址</text>
				<input
					class="form-input"
					v-model="eduUrl"
					:placeholder="systems[selectedSystem].placeholder"
					type="text"
				/>
			</view>

			<!-- 登录信息 -->
			<view class="form-group">
				<text class="form-label">学号/用户名</text>
				<input class="form-input" v-model="username" placeholder="请输入学号" type="text" />
			</view>
			<view class="form-group">
				<text class="form-label">密码</text>
				<input class="form-input" v-model="password" placeholder="请输入密码" password />
			</view>

			<!-- 提示信息 -->
			<view class="tip-card">
				<text class="tip-icon">ℹ️</text>
				<view class="tip-content">
					<text class="tip-title">安全提示</text>
					<text class="tip-text">你的账号密码仅用于本次导入，不会被存储或上传到任何服务器。导入完成后请修改教务系统密码以确保安全。</text>
				</view>
			</view>

			<!-- 导入按钮 -->
			<button class="import-btn" @tap="startImport" :disabled="importing">
				<text v-if="!importing">开始导入</text>
				<text v-else>正在导入...</text>
			</button>
		</view>

		<!-- 导入结果预览 -->
		<view class="preview-section" v-if="previewCourses.length > 0">
			<view class="section-header">
				<text class="section-title">导入预览 ({{previewCourses.length}}门课程)</text>
			</view>
			<view class="preview-list">
				<view class="preview-item" v-for="(course, index) in previewCourses" :key="index">
					<view class="preview-color" :style="{background: course.color}"></view>
					<view class="preview-info">
						<text class="preview-name">{{course.name}}</text>
						<text class="preview-detail">{{course.teacher}} · {{course.location}}</text>
						<text class="preview-time">{{getWeekDayText(course.weekDay)}} 第{{course.startSection}}-{{course.endSection}}节</text>
					</view>
					<view class="preview-check">
						<checkbox :checked="course.selected" @tap="toggleCourse(index)" color="#4361ee" />
					</view>
				</view>
			</view>
			<button class="confirm-btn" @tap="confirmImport">
				确认导入选中的课程
			</button>
		</view>

		<!-- 使用说明 -->
		<view class="help-section" v-if="selectedSystem !== -1 && previewCourses.length === 0">
			<text class="help-title">使用说明</text>
			<view class="help-steps">
				<view class="help-step">
					<text class="step-num">1</text>
					<text class="step-text">输入教务系统地址和登录信息</text>
				</view>
				<view class="help-step">
					<text class="step-num">2</text>
					<text class="step-text">点击"开始导入"按钮</text>
				</view>
				<view class="help-step">
					<text class="step-num">3</text>
					<text class="step-text">系统会自动获取课程信息并展示预览</text>
				</view>
				<view class="help-step">
					<text class="step-num">4</text>
					<text class="step-text">选择要导入的课程，确认导入</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
import { importApi } from '@/utils/request.js'

export default {
	data() {
		return {
			selectedSystem: -1,
			eduUrl: '',
			username: '',
			password: '',
			importing: false,
			previewCourses: [],
			schoolName: '',
			searchResult: null,
			// 常见高校教务系统数据库
			schoolDatabase: [
				// ============ 985高校 ============
				{ school: '清华大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '北京大学', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '浙江大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '复旦大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '上海交通大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '南京大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '中国科学技术大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '武汉大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '华中科技大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '中山大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '西安交通大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '哈尔滨工业大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '北京航空航天大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '同济大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '天津大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '厦门大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '东南大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '北京理工大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '南开大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '四川大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '电子科技大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '华南理工大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '大连理工大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '西北工业大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '重庆大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '湖南大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '中南大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '吉林大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '山东大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '中国海洋大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '东北大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '兰州大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '中国人民大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '北京师范大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '华东师范大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '中国农业大学', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '国防科技大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '西北农林科技大学', type: 'zhengfang', systemName: '正方教务系统' },
				// ============ 211高校 ============
				{ school: '北京邮电大学', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '华北电力大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '中央财经大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '对外经济贸易大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '上海财经大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '中南财经政法大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '西南财经大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '中国政法大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '中国矿业大学', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '河海大学', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '南京理工大学', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '南京航空航天大学', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '苏州大学', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '江南大学', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '合肥工业大学', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '华中师范大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '西南大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '东北师范大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '华中农业大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '南京农业大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '中国地质大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '中国石油大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '中国传媒大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '北京外国语大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '上海外国语大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '北京交通大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '北京科技大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '北京化工大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '北京林业大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '南京师范大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '湖南师范大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '暨南大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '华南师范大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广西大学', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '贵州大学', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '海南大学', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '郑州大学', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '南昌大学', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '云南大学', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '西藏大学', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '宁夏大学', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '新疆大学', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '内蒙古大学', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '石河子大学', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '青海大学', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '延边大学', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '大连海事大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '东北林业大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '东北农业大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '四川农业大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '电子科技大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '西南交通大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '长安大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '西安电子科技大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '西北大学', type: 'zhengfang', systemName: '正方教务系统' },
				// ============ 省属重点高校 ============
				{ school: '首都医科大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '首都师范大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '深圳大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '南方科技大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '浙江工业大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '浙江师范大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '杭州电子科技大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '宁波大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '温州医科大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '浙江理工大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '浙江工商大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '上海大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '上海理工大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '上海师范大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '上海科技大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '东华大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '上海海事大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '南京邮电大学', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '南京工业大学', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '南京林业大学', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '南京信息工程大学', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '南京中医药大学', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '南京医科大学', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '南京财经大学', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '江苏大学', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '江苏科技大学', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '扬州大学', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '南通大学', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '常州大学', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '南京审计大学', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '江苏师范大学', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '中国药科大学', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '广东工业大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广东外语外贸大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广州大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '华南农业大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广州医科大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '汕头大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广东财经大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广东医科大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '武汉理工大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '中国地质大学(武汉)', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '武汉科技大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '湖北大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '中南民族大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '三峡大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '长江大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '湖南科技大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '长沙理工大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '湘潭大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '南华大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '湖南工业大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '福建师范大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '福州大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '福建农林大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '华侨大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '集美大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '福建医科大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '山东科技大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '山东师范大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '青岛大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '青岛科技大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '济南大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '山东理工大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '山东财经大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '烟台大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '曲阜师范大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '聊城大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '鲁东大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '青岛理工大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '哈尔滨理工大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '黑龙江大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '哈尔滨工程大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '东北石油大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '佳木斯大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '齐齐哈尔大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '长春理工大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '延边大学', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '东北电力大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '长春工业大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '北华大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '辽宁大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '沈阳工业大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '沈阳建筑大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '沈阳农业大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '辽宁师范大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '大连大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '沈阳药科大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '河北大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '河北工业大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '燕山大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '河北师范大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '石家庄铁道大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '河北科技大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '河北农业大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '河北医科大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '河南大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '河南科技大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '河南师范大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '河南理工大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '河南工业大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '华北水利水电大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '河南财经政法大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '郑州轻工业大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '太原理工大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '中北大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '山西大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '山西财经大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '山西师范大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '太原科技大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '西安理工大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '西安建筑科技大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '西安科技大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '陕西科技大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '西安邮电大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '西安外国语大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '西安工业大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '延安大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '陕西师范大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '甘肃农业大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '兰州理工大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '兰州交通大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '西北师范大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '成都理工大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '四川师范大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '西南石油大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '西华大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '成都信息工程大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '四川农业大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '西华师范大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '西南科技大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '重庆邮电大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '重庆交通大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '重庆理工大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '四川外国语大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '重庆工商大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广西师范大学', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '广西医科大学', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '桂林电子科技大学', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '桂林理工大学', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '广西民族大学', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '广西中医药大学', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '贵州师范大学', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '贵州医科大学', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '贵州财经大学', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '贵州民族大学', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '云南师范大学', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '云南财经大学', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '云南民族大学', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '昆明理工大学', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '昆明医科大学', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '云南农业大学', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '大理大学', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '海南师范大学', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '海南热带海洋学院', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '内蒙古科技大学', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '内蒙古工业大学', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '内蒙古农业大学', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '内蒙古师范大学', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '宁夏医科大学', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '北方民族大学', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '新疆医科大学', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '新疆农业大学', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '新疆师范大学', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '新疆财经大学', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '塔里木大学', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '西藏民族大学', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '江西财经大学', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '江西师范大学', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '华东交通大学', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '南昌航空大学', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '东华理工大学', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '江西理工大学', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '井冈山大学', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '赣南师范大学', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '景德镇陶瓷大学', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '江西农业大学', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '江西中医药大学', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '安徽大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '安徽工业大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '安徽农业大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '安徽师范大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '安徽医科大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '安徽理工大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '安徽财经大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '淮北师范大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '安庆师范大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '阜阳师范大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '蚌埠医学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '皖南医学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '铜陵学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '合肥学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '滁州学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '宿州学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '巢湖学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '淮南师范学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '安徽建筑大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '安徽工程大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '安徽中医药大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '皖西学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '黄山学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '合肥师范学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '蚌埠学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '池州学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '亳州学院', type: 'zhengfang', systemName: '正方教务系统' },
				// ============ 常用简称 ============
				{ school: '清华', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '北大', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '浙大', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '复旦', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '上交', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '南大', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '中科大', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '武大', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '华科', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '中大', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '西交', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '哈工大', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '北航', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '同济', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '天大', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '厦大', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '东南', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '北理工', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '南开', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '川大', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '电子科大', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '华南理工', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '大工', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '西工大', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '重大', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '湖大', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '中南', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '吉大', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '山大', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '东大', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '兰大', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '人大', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '北师大', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '华东师大', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '北邮', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '南航', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '南理工', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '河海', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '苏大', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '江南', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '合工大', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '郑大', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '南大', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '云大', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '贵大', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '新大', type: 'jinzhi', systemName: '金智教务系统' },
				// ============ 补充高校 ============
				{ school: '北京中医药大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '对外经贸', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '中央民族大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '民大', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '中央美院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '中央音乐学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '中国音乐学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '北京电影学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '北京体育大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '上海音乐学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '上海戏剧学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '上海体育学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '南京体育学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '武汉体育学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '成都体育学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '天津医科大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '河北经贸大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '河北工程大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '北华航天工业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '华北理工大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '山西农业大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '山西医科大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '长治医学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '内蒙古民族大学', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '赤峰学院', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '呼伦贝尔学院', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '沈阳化工大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '沈阳航空航天大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '沈阳理工大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '大连交通大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '大连工业大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '大连外国语大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '锦州医科大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '渤海大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '沈阳医学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '长春大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '吉林师范大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '吉林农业大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '长春中医药大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '哈尔滨师范大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '哈尔滨医科大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '黑龙江科技大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '黑龙江中医药大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '牡丹江师范学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '佳木斯大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '江苏理工学院', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '常熟理工学院', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '盐城工学院', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '盐城师范学院', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '淮阴师范学院', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '淮阴工学院', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '南京工程学院', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '南京晓庄学院', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '金陵科技学院', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '三江学院', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '浙江农林大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '浙江中医药大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '中国计量大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '嘉兴学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '湖州师范学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '绍兴文理学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '台州学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '丽水学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '衢州学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '浙江科技学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '浙江万里学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '安徽三联学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '福建工程学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '闽江学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '泉州师范学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '漳州师范学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '龙岩学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '三明学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '武夷学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '莆田学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '厦门理工学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '厦门医学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '厦门工学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '南昌工程学院', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '九江学院', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '宜春学院', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '上饶师范学院', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '赣南医学院', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '新余学院', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '萍乡学院', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '山东建筑大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '山东中医药大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '潍坊医学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '滨州医学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '济宁医学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '临沂大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '德州学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '泰山学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '枣庄学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '菏泽学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '潍坊学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '山东女子学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '山东青年政治学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '山东管理学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '河南农业大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '河南中医药大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '新乡医学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '信阳师范学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '南阳师范学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '洛阳师范学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '南阳理工学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '洛阳理工学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '许昌学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '商丘师范学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '周口师范学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '黄淮学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '平顶山学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '安阳工学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '河南城建学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '河南工程学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '河南科技学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '湖北工业大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '湖北中医药大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '湖北医药学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '湖北文理学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '湖北工程学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '湖北科技学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '黄冈师范学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '湖北民族大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '荆楚理工学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '武汉商学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '湖南农业大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '中南林业科技大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '湖南中医药大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '长沙学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '湖南文理学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '湖南工程学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '湖南城市学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '邵阳学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '怀化学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '湖南科技学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '湖南人文科技学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '湘南学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '湖南工学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '湖南财政经济学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '湖南警察学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '湖南女子学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广东技术师范大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广东药科大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '五邑大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '仲恺农业工程学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广东金融学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广东石油化工学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '东莞理工学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '佛山科学技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '肇庆学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '惠州学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '嘉应学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '韩山师范学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '岭南师范学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '韶关学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广东第二师范学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广西科技大学', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '桂林医学院', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '右江民族医学院', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '广西艺术学院', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '广西财经学院', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '河池学院', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '玉林师范学院', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '梧州学院', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '百色学院', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '贺州学院', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '钦州学院', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '桂林航天工业学院', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '桂林旅游学院', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '成都中医药大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '川北医学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '成都大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '攀枝花学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '绵阳师范学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '内江师范学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '宜宾学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '乐山师范学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '四川文理学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '四川旅游学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '四川民族学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '阿坝师范学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '重庆文理学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '重庆三峡学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '长江师范学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '重庆科技学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '重庆第二师范学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '贵州中医药大学', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '贵州理工学院', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '遵义医科大学', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '遵义师范学院', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '黔南民族师范学院', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '黔东南民族职业技术学院', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '六盘水师范学院', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '安顺学院', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '兴义民族师范学院', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '铜仁学院', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '凯里学院', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '云南中医药大学', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '云南艺术学院', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '曲靖师范学院', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '玉溪师范学院', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '楚雄师范学院', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '红河学院', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '文山学院', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '普洱学院', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '保山学院', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '滇西科技师范学院', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '滇西应用技术大学', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '西藏藏医药大学', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '西藏农牧学院', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '甘肃中医药大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '甘肃政法大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '天水师范学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '河西学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '陇东学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '兰州城市学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '兰州文理学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '兰州工业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '甘肃民族师范学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '宁夏师范学院', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '宁夏理工学院', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '银川能源学院', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '新疆工程学院', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '新疆艺术学院', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '喀什大学', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '伊犁师范大学', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '昌吉学院', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '新疆警察学院', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '海南医学院', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '琼台师范学院', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '三亚学院', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '海口经济学院', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '广东白云学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广州工商学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广州商学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广东培正学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广东东软学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '中山大学新华学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '中山大学南方学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '华南农业大学珠江学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广东外语外贸大学南国商学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广东工业大学华立学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广州大学松田学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '华南理工大学广州学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '电子科技大学中山学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '北京师范大学珠海分校', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '吉林大学珠海学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '东莞城市学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广州理工学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广东科技学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广州华立学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广州应用科技学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广州软件学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广州新华学院', type: 'zhengfang', systemName: '正方教务系统' },
				// ============ 补充简称 ============
				{ school: '北师', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '华师', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '南师', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '上师', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '首师', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '湖师', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '福师', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '陕师', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '东师', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '西大', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '暨大', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '华农', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '南农', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '华工', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '东华', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '矿大', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '地大', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '油大', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '海大', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '深大', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广大', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '华师大', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '北科', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '北交', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '北化', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '北林', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '北语', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '央财', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '上财', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '中南财', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '西财', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '中传', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '国传', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '政法', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '南审', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '南邮', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '南林', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '南信', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '南财', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '南医', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '南工', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '扬大', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '通大', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '江大', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '杭电', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '浙工大', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '浙师', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '浙理工', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '浙工商', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '宁大', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '温医', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '温大', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '上大', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '上理', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '上科', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '海事', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广工', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广外', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '华农大', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '汕大', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广财', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '莞工', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '佛科', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '武理工', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '武科大', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '湖工大', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '湖中医', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '长理工', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '长大', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '黑大', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '哈理工', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '哈工程', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '哈医大', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '辽大', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '沈工大', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '沈建大', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '沈农大', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '辽师', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '大外', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '大交', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '冀大', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '冀工大', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '冀师', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '燕大', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '石铁大', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '河科大', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '河师大', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '河理工', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '河工大', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '华水', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '河财', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '郑轻', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '太理工', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '中北', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '山大', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '山财', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '山师', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '青大', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '青科', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '济大', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '山理工', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '鲁大', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '西理工', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '西建大', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '西科大', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '陕科大', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '西邮', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '西外', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '延大', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '甘农', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '兰理工', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '兰交大', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '西师', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '成理工', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '川师', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '西油', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '西华', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '成信', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '西师大', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '西科', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '重邮', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '重交', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '重理工', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '川外', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '重工商', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '桂电', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '桂理工', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '桂师', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '桂医', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '昆理工', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '云师', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '云财', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '云民', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '云农', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '云医', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '赣师', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '赣医', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '赣理', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '江财', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '江师', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '华东交大', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '昌航', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '东华理工', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '江理工', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '安大', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '安工大', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '安农', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '安师', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '安医', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '安理工', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '安财', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '安建', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '安工程', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '安中医', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '合工大', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '福大', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '福师大', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '福农', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '福医', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '厦理工', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '厦医', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '闽江', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '泉师', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '内医', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '内工大', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '内农大', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '内师', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '宁医', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '北民大', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '新医', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '新农', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '新师', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '新财', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '海师', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '海医', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '广中医', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广药', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广技师', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广金', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广石化', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '肇院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '惠院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '嘉应', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '韩师', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '岭师', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '韶院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广二师', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '五邑', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '仲恺', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '莞理', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '佛科院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广技师', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '北师大', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '北中医', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '天医', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '河大', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '河农', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '河医', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '新医', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '信师', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '南阳师', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '洛师', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '洛理工', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '许院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '商师', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '周师', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '黄淮', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '平院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '安工', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '城建', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '河工院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '河科院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '郑大', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '湖工大', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '湖中医', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '湖医', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '湖文理', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '湖工程', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '湖科技', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '黄冈师', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '湖民大', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '荆楚', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '汉院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '湖商', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '湖农', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '中南林', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '长院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '湖文理', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '湖工程', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '湖城', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '邵院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '怀院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '湖科院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '湖人文', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '湘南', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '湖工院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '湖财', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '湖警', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '湖女', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '成大', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '川北', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '攀院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '绵师', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '内师', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '宜宾', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '乐师', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '川文理', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '川旅', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '川民', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '阿坝师', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '重文理', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '三峡', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '长师', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '重科', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '重二师', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '贵中医', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '贵理工', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '遵医', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '遵师', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '黔南师', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '六盘水', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '安院', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '兴义', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '铜院', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '凯院', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '云中医', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '云艺', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '曲师', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '玉师', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '楚师', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '红院', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '文院', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '普院', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '保院', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '滇西', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '甘中医', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '甘政法', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '天师', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '河西', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '陇东', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '兰城', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '兰文理', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '兰工', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '甘民师', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '宁师', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '宁理工', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '银能', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '新工', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '新艺', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '喀大', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '伊师', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '昌吉', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '新警', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '海医', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '琼台', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '三亚', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '海口经', type: 'jinzhi', systemName: '金智教务系统' },
				{ school: '广白云', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广工商', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广商', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '培正', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '东软', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '华立', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '松田', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '华广', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '吉珠', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '北理珠', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '中大新华', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '中大南方', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '华农珠', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广外南国', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广工华立', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广大松田', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '华广院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '电子科大中山', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '北师珠', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '吉大珠', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '莞城', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广理', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广科', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广应科', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广软', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广新华', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广华立', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广城院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广技师院', type: 'zhengfang', systemName: '正方教务系统' },
				// ============ 专科院校（部分） ============
				{ school: '深圳职业技术大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '深圳职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '金华职业技术大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '金华职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '无锡职业技术学院', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '南京工业职业技术大学', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '南京工业职业技术学院', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '北京电子科技职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '山东商业职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '山东职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '山东科技职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '山东劳动职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '山东水利职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '日照职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '威海职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '潍坊职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '烟台职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '滨州职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '东营职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '聊城职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '青岛职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '济南职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '淄博职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '山东交通职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '山东信息职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '山东外贸职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '山东化工职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '山东电子职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '山东铝业职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '山东药品食品职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '山东城市建设职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '山东中医药高等专科学校', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '山东医学高等专科学校', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '菏泽医学专科学校', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '山东畜牧兽医职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '山东旅游职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '山东经贸职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '山东工业职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '山东服装职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '山东商务职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '山东司法警官职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '山东传媒职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '山东艺术设计职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '山东轻工职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '山东力明科技职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '山东圣翰财贸职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '山东杏林科技职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '山东英才学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '山东协和学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '山东现代学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '山东工程职业技术大学', type: 'zhengfang', systemName: '正方教务系统' },
				// 广东专科
				{ school: '广东轻工职业技术大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广东轻工职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广州番禺职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广东交通职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广东水利电力职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广东科学技术职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广东机电职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广东农工商职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广东食品药品职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广东邮电职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广东工贸职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广东女子职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广东体育职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广东环境保护工程职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广东建设职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广东理工职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广东松山职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广东行政职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广东司法警官职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广东文艺职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广东舞蹈戏剧职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广东体育职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广州铁路职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广州城市职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广州民航职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广州体育职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广州工程技术职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广州科技职业技术大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广州华商职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广州南洋理工职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广州涉外经济职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广州康大职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广州现代信息工程职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广州东华职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广州华夏职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广州珠江职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广州城建职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广州科技贸易职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广州卫生职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '深圳信息职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '深圳技师学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '深圳鹏城职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '顺德职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '东莞职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广东创新科技职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广东酒店管理职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广东南方职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广东信息工程职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广东文理职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广东碧桂园职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广东茂名健康职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广东茂名幼儿师范专科学校', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '惠州卫生职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '惠州城市职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '惠州工程职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '中山职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '中山火炬职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '珠海城市职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '江门职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '江门中医药职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '佛山职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广东职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广东生态工程职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广东财贸职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广东青年职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广东工程职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '汕头职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '揭阳职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '河源职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '清远职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '阳江职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '茂名职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '梅州职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '潮汕职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广东科贸职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广东岭南职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广东新安职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广东亚视演艺职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广东体育职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				// 江苏专科
				{ school: '苏州职业大学', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '苏州卫生职业技术学院', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '苏州农业职业技术学院', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '苏州经贸职业技术学院', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '苏州工业职业技术学院', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '苏州信息职业技术学院', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '苏州健雄职业技术学院', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '苏州高博软件技术职业学院', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '南京信息职业技术学院', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '南京铁道职业技术学院', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '南京交通职业技术学院', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '南京化工职业技术学院', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '南京科技职业学院', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '南京机电职业技术学院', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '南京旅游职业学院', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '南京城市职业学院', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '南京视觉艺术职业学院', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '南京特殊教育师范学院', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '无锡商业职业技术学院', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '无锡城市职业技术学院', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '无锡工艺职业技术学院', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '无锡科技职业学院', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '无锡南洋职业技术学院', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '常州信息职业技术学院', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '常州纺织服装职业技术学院', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '常州工程职业技术学院', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '常州机电职业技术学院', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '常州工业职业技术学院', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '常州轻工职业技术学院', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '常州旅游商贸高等专科学校', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '常州幼儿师范学校', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '江苏建筑职业技术学院', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '江苏农牧科技职业学院', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '江苏食品药品职业技术学院', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '江苏财经职业技术学院', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '江苏电子信息职业学院', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '江苏海事职业技术学院', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '江苏航运职业技术学院', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '江苏工程职业技术学院', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '江苏城市职业学院', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '江苏商贸职业学院', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '江苏医药职业学院', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '江苏安全技术职业学院', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '江苏财会职业学院', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '江苏旅游职业学院', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '江苏卫生健康职业学院', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '江苏农林职业技术学院', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '江苏信息职业技术学院', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '江苏联合职业技术学院', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '南通职业大学', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '南通科技职业学院', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '南通航运职业技术学院', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '南通师范高等专科学校', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '南通纺织职业技术学院', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '南通职业大学', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '徐州工业职业技术学院', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '徐州生物工程职业技术学院', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '徐州幼儿师范高等专科学校', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '徐州医药高等职业学校', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '徐州财经高等职业技术学校', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '扬州工业职业技术学院', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '扬州环境资源职业技术学院', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '扬州职业大学', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '扬州商务高等专科学校', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '扬州中瑞酒店职业学院', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '镇江高等专科学校', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '镇江市高等专科学校', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '盐城工业职业技术学院', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '盐城卫生职业技术学院', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '盐城幼儿师范高等专科学校', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '泰州职业技术学院', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '泰州学院', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '宿迁职业技术学院', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '宿迁泽达职业技术学院', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '连云港职业技术学院', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '连云港师范高等专科学校', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '淮安信息职业技术学院', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '淮安生物工程高等职业学校', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '江苏财经高等职业技术学校', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '沙洲职业工学院', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '硅湖职业技术学院', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '建东职业技术学院', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '应天职业技术学院', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '正德职业技术学院', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '钟山职业技术学院', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '金肯职业技术学院', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '金山职业技术学院', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '太湖创意职业技术学院', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '炎黄职业技术学院', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '明达职业技术学院', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '江海职业技术学院', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '九州职业技术学院', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '紫琅职业技术学院', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '硅湖职业技术学院', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '苏州百年职业学院', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '昆山登云科技职业学院', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '苏州托普信息职业技术学院', type: 'qingguo', systemName: '青果教务系统' },
				{ school: '太湖创意职业技术学院', type: 'qingguo', systemName: '青果教务系统' },
				// 浙江专科
				{ school: '浙江金融职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '浙江机电职业技术大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '浙江机电职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '浙江经贸职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '浙江交通职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '浙江建设职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '浙江商业职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '浙江旅游职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '浙江警官职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '浙江工贸职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '浙江经济职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '浙江纺织服装职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '浙江邮电职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '浙江国际海运职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '浙江艺术职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '浙江体育职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '浙江同济科技职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '浙江电力职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '浙江工商职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '浙江长征职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '杭州职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '杭州科技职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '杭州万向职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '杭州医学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '宁波职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '宁波城市职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '宁波卫生职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '宁波幼儿师范高等专科学校', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '温州职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '温州科技职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '温州商学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '浙江东方职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '浙江横店影视职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '浙江育英职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '浙江广厦建设职业技术大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '浙江汽车职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '浙江宇翔职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '浙江金华科贸职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '嘉兴职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '嘉兴南洋职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '湖州职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '湖州健康职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '绍兴职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '浙江农业商贸职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '台州职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '台州科技职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '浙江汽车职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '丽水职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '浙江特殊教育职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '义乌工商职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '浙江安防职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				// 湖北专科
				{ school: '武汉职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '武汉船舶职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '武汉铁路职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '武汉软件工程职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '武汉城市职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '武汉交通职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '武汉电力职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '武汉生物工程学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '武汉工商学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '武汉工程职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '武汉商贸职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '武汉信息传播职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '武汉外语外事职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '武汉光谷职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '武汉科技职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '武汉工贸职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '武汉民政职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '武汉警官职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '武汉交通职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '湖北职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '襄阳职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '黄冈职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '湖北工业职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '鄂州职业大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '荆州职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '湖北三峡职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '随州职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '武汉铁路桥梁职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '武汉海事职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '湖北城市建设职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '湖北水利水电职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '湖北交通职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '湖北轻工职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '湖北财税职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '湖北国土资源职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '湖北生态工程职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '湖北科技职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '湖北艺术职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '湖北体育职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '三峡电力职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '三峡旅游职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '长江工程职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '长江职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '江汉艺术职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '湖北幼儿师范高等专科学校', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '湖北中医药高等专科学校', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '襄阳汽车职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '湖北铁道运输职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '天门职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '湖北健康职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '咸宁职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '仙桃职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '湖北工业经济学校', type: 'zhengfang', systemName: '正方教务系统' },
				// 湖南专科
				{ school: '长沙民政职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '湖南铁道职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '湖南工业职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '湖南交通职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '湖南信息职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '湖南环境生物职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '湖南大众传媒职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '湖南科技职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '湖南商务职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '湖南工程职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '湖南机电职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '湖南汽车工程职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '湖南化工职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '湖南中医药高等专科学校', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '湖南高速铁路职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '湖南铁路科技职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '湖南城建职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '湖南电气职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '湖南财经工业职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '湖南有色金属职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '湖南网络工程职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '湖南司法警官职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '湖南艺术职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '湖南体育职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '长沙航空职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '长沙商贸旅游职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '长沙职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '长沙卫生职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '长沙电力职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '长沙南方职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '长沙环境保护职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '湖南水利水电职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '湖南安全技术职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '湖南劳动人事职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '湖南食品药品职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '湖南幼儿师范高等专科学校', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '湘南幼儿师范高等专科学校', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '湖南外国语职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '湖南电子科技职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '湖南三一工业职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '湖南高尔夫旅游职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '湖南都市职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '湖南工商职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '湖南九嶷职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '湖南石油化工职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '怀化职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '岳阳职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '常德职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '娄底职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '永州职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '郴州职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '张家界航空工业职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '益阳医学高等专科学校', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '益阳职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '邵阳职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '湘西民族职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '潇湘职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '湖南吉利汽车职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '湖南应用技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '湖南信息学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '湖南涉外经济学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '湖南交通工程学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '湖南软件职业技术大学', type: 'zhengfang', systemName: '正方教务系统' },
				// 四川专科
				{ school: '四川建筑职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '四川工程职业技术大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '四川工程职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '四川交通职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '四川邮电职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '四川工商职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '四川水利职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '四川财经职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '四川商务职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '四川信息职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '四川艺术职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '四川文化产业职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '四川科技职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '四川城市职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '四川长江职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '四川文化传媒职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '四川华新现代职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '四川电力职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '四川铁道职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '四川司法警官职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '四川航天职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '四川机电职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '四川化工职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '四川汽车职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '四川幼儿师范高等专科学校', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '川北幼儿师范高等专科学校', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '四川中医药高等专科学校', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '四川卫生康复职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '四川护理职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '成都航空职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '成都职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '成都纺织高等专科学校', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '成都农业科技职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '成都工业职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '成都信息工程大学银杏酒店管理学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '成都艺术职业大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '成都文理学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '成都东软学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '成都锦城学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '成都银杏酒店管理学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '内江职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '乐山职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '泸州职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '绵阳职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '南充职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '达州职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '眉山职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '雅安职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广安职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '四川职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '四川文轩职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '四川希望汽车职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '四川电子机械职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '四川三河职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '四川汽车职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '巴中职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '川南幼儿师范高等专科学校', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '四川体育职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '天一学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '四川国际标榜职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '四川托普信息技术职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '四川文化传媒职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '四川现代职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '四川文化传媒职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '民办四川天一学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '四川科技职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '四川城市职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '四川长江职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '四川西南航空职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '四川文化传媒职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '四川应用技术职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				// 补充各省缺失高校
				{ school: '杭州师范大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '浙江理工大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '浙江农林大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '浙江中医药大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '浙江传媒学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '浙江外国语学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '浙江科技学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '浙江万里学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '浙江树人学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '浙江越秀外国语学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '宁波工程学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '嘉兴学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '湖州师范学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '绍兴文理学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '台州学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '丽水学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '衢州学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '宁波财经学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '杭州医学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '温州医科大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '温州大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '天津科技大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '天津工业大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '天津理工大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '天津农学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '天津中医药大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '天津师范大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '天津职业技术师范大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '天津外国语大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '天津商业大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '天津财经大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '天津体育学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '天津美术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '天津音乐学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '天津城建大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '天津中德应用技术大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '河北大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '河北工程大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '河北地质大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '河北科技大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '河北建筑工程学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '河北水利电力学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '河北农业大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '河北医科大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '河北师范大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '石家庄铁道大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '燕山大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '河北经贸大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '河北北方学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '承德医学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '廊坊师范学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '唐山师范学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '石家庄学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '邯郸学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '邢台学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '沧州师范学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '衡水学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '唐山学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '华北科技学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '防灾科技学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '中国人民警察大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '河北金融学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '北华航天工业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '河北建筑工程学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '河北环境工程学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '河北水利电力学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '山西大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '太原科技大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '中北大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '太原理工大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '山西农业大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '山西医科大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '长治医学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '山西师范大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '太原师范学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '山西大同大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '晋中学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '长治学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '运城学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '忻州师范学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '山西财经大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '山西中医药大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '吕梁学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '太原学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '山西工程技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '山西能源学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '辽宁大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '大连理工大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '沈阳工业大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '沈阳航空航天大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '沈阳理工大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '东北大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '辽宁科技大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '辽宁工程技术大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '辽宁石油化工大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '大连交通大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '大连海事大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '大连工业大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '沈阳建筑大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '沈阳农业大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '大连海洋大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '中国医科大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '锦州医科大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '大连医科大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '辽宁中医药大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '沈阳药科大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '沈阳医学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '辽宁师范大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '沈阳师范大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '渤海大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '鞍山师范学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '大连外国语大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '东北财经大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '沈阳大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '大连大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '沈阳工程学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '辽宁科技学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '辽东学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '营口理工学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '吉林大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '延边大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '长春理工大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '东北电力大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '长春工业大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '吉林建筑大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '吉林化工学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '吉林农业大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '长春中医药大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '东北师范大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '北华大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '通化师范学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '吉林师范大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '吉林工程技术师范学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '长春师范大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '白城师范学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '吉林财经大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '吉林外国语大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '长春大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '长春工程学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '吉林农业科技学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '吉林警察学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '黑龙江大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '哈尔滨工业大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '哈尔滨理工大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '哈尔滨工程大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '黑龙江科技大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '东北石油大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '佳木斯大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '黑龙江八一农垦大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '东北农业大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '东北林业大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '哈尔滨医科大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '黑龙江中医药大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '牡丹江医学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '哈尔滨师范大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '齐齐哈尔大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '牡丹江师范学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '哈尔滨学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '大庆师范学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '绥化学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '哈尔滨金融学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '齐齐哈尔医学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '黑龙江工程学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '黑龙江工业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '福建师范大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '福建农林大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '福建医科大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '福建中医药大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '集美大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '闽江学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '泉州师范学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '闽南师范大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '厦门理工学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '三明学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '龙岩学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '武夷学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '福建工程学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '莆田学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '宁德师范学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '福建江夏学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '厦门医学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '江西师范大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '江西财经大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '华东交通大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '东华理工大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '南昌航空大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '江西理工大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '井冈山大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '江西农业大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '江西中医药大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '赣南医学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '赣南师范大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '上饶师范学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '宜春学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '南昌师范学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '九江学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '景德镇陶瓷大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '新余学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '萍乡学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '南昌工程学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '江西科技师范大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广西大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广西科技大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '桂林电子科技大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '桂林理工大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广西医科大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '右江民族医学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广西中医药大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '桂林医学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广西师范大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '南宁师范大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广西民族师范学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '河池学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '玉林师范学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广西艺术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广西民族大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '百色学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '梧州学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广西科技师范学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广西财经学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '北部湾大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '贺州学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '桂林航天工业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '桂林旅游学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '重庆大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '重庆邮电大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '重庆交通大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '重庆医科大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '西南大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '重庆师范大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '重庆文理学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '重庆三峡学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '长江师范学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '四川外国语大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '四川美术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '重庆理工大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '重庆工商大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '重庆第二师范学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '贵州大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '贵州医科大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '遵义医科大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '贵州中医药大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '贵州师范大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '铜仁学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '兴义民族师范学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '安顺学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '贵州工程应用技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '凯里学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '黔南民族师范学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '六盘水师范学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '贵州民族大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '贵州财经大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '贵阳学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '遵义师范学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '贵州理工学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '云南大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '昆明理工大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '云南农业大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '西南林业大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '昆明医科大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '大理大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '云南中医药大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '云南师范大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '昭通学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '曲靖师范学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '普洱学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '保山学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '红河学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '云南财经大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '云南艺术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '云南民族大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '云南警官学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '昆明学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '文山学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '云南经济管理学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '西安交通大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '西北工业大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '西安电子科技大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '长安大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '西北农林科技大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '陕西师范大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '西安建筑科技大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '西安理工大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '西安科技大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '西安石油大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '陕西科技大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '西安工程大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '西安工业大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '西安邮电大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '陕西中医药大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '西安医学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '延安大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '渭南师范学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '咸阳师范学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '陕西理工大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '宝鸡文理学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '西安文理学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '榆林学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '商洛学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '安康学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '西安航空学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '西安财经大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '西安外国语大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '西北政法大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '西安音乐学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '西安美术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '兰州大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '兰州理工大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '兰州交通大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '甘肃农业大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '甘肃中医药大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '西北师范大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '兰州城市学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '陇东学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '天水师范学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '河西学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '兰州文理学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '兰州工业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '甘肃民族师范学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '甘肃政法大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '青海大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '青海师范大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '青海民族大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '青海大学昆仑学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '宁夏大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '宁夏医科大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '宁夏师范大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '北方民族大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '宁夏理工学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '银川能源学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '新疆大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '新疆农业大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '新疆医科大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '新疆师范大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '喀什大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '伊犁师范大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '新疆财经大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '新疆艺术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '昌吉学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '新疆工程学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '新疆理工学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '西藏大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '西藏民族大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '西藏藏医药大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '西藏农牧学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '海南大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '海南师范大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '海南热带海洋学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '海南医学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '三亚学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '海口经济学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '内蒙古大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '内蒙古科技大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '内蒙古工业大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '内蒙古农业大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '内蒙古医科大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '内蒙古师范大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '内蒙古民族大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '赤峰学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '内蒙古财经大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '呼伦贝尔学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '集宁师范学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '河套学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '呼和浩特民族学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '鄂尔多斯应用技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				// 北京专科
				{ school: '北京工业职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '北京信息职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '北京电子科技职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '北京京北职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '北京交通职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '北京青年政治学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '北京农业职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '北京政法职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '北京财贸职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '北京经贸职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '北京经济技术职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '北京科技职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '北京培黎职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '北京艺术传媒职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '北京网络职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				// 天津专科
				{ school: '天津市职业大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '天津滨海职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '天津工程职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '天津渤海职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '天津电子信息职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '天津机电职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '天津现代职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '天津轻工职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '天津商务职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '天津国土资源和房屋职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '天津医学高等专科学校', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '天津开发区职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '天津艺术职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '天津交通职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '天津城市建设管理职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '天津生物工程职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '天津海运职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '天津广播影视职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				// 河北专科
				{ school: '邯郸职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '石家庄职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '张家口职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '河北软件职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '河北建材职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '沧州医学高等专科学校', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '河北职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '石家庄铁路职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '石家庄工程职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '石家庄城市经济职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '唐山职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '衡水职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '唐山工业职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '邢台医学高等专科学校', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '河北艺术职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '河北对外经贸职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '石家庄信息工程职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '保定职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '河北化工医药职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '河北交通职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '石家庄邮电职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '河北女子职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '石家庄医学高等专科学校', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '石家庄幼儿师范高等专科学校', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '廊坊卫生职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '石家庄科技工程职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '河北司法警官职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '沧州幼儿师范高等专科学校', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '宣化科技职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '廊坊燕京职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '承德护理职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '石家庄幼儿师范高等专科学校', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '河北工艺美术职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '渤海理工职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '唐山海运职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				// 山西专科
				{ school: '山西省财政税务专科学校', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '长治职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '山西艺术职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '晋城职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '山西建筑职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '山西药科职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '山西交通职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '大同煤炭职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '山西机电职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '山西戏剧职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '山西财贸职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '山西林业职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '山西水利职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '阳泉职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '临汾职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '山西职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '山西金融职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '太原城市职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '山西信息职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '山西体育职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '山西警官职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '山西国际商务职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '潞安职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '太原旅游职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '山西旅游职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '山西电力职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '忻州职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '山西同文职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '山西华澳商贸职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '山西老区职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				// 辽宁专科
				{ school: '辽宁省交通高等专科学校', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '抚顺师范高等专科学校', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '锦州师范高等专科学校', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '营口职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '铁岭师范高等专科学校', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '大连职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '辽宁农业职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '抚顺职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '辽阳职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '阜新高等专科学校', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '辽宁经济职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '辽宁石化职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '渤海船舶职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '辽宁职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '辽宁建筑职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '辽宁机电职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '辽宁广告职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '辽宁轻工职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '辽宁装备制造职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '辽宁现代服务职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '辽宁城市建设职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '辽宁医药职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '铁岭卫生职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '沈阳北软信息职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '大连商务职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '大连软件职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '大连翻译职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '大连枫叶职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '大连航运职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '辽宁政法职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				// 吉林专科
				{ school: '长春师范高等专科学校', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '辽源职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '四平职业大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '长春汽车工业高等专科学校', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '长春金融高等专科学校', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '长春医学高等专科学校', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '吉林交通职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '长春东方职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '吉林司法警官职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '吉林电子信息职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '吉林工业职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '吉林工程职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '长春职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '白城医学高等专科学校', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '松原职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '白城职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '延边职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '吉林水利电力职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '长春健康职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				// 黑龙江专科
				{ school: '齐齐哈尔高等师范专科学校', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '牡丹江大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '佳木斯职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '黑龙江幼儿师范高等专科学校', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '黑龙江职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '黑龙江建筑职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '黑龙江艺术职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '大庆职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '黑龙江林业职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '黑龙江农业职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '黑龙江农业工程职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '黑龙江农垦职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '哈尔滨电力职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '哈尔滨铁道职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '哈尔滨职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '黑龙江生物科技职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '黑龙江信息技术职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '哈尔滨科学技术职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '黑龙江旅游职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '黑龙江公安警官职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '黑龙江司法警官职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '黑龙江交通职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '哈尔滨幼儿师范高等专科学校', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '黑龙江民族职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '七台河职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '黑龙江能源职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '伊春职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '鹤岗师范高等专科学校', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '黑龙江商业职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '黑龙江护理高等专科学校', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '大兴安岭职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				// 安徽专科
				{ school: '安徽水利水电职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '安徽职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '民办安徽旅游职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '安徽警官职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '安徽工业经济职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '合肥通用职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '安徽电子信息职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '安徽交通职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '安徽体育运动职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '安徽医学高等专科学校', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '合肥职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '安徽广播影视职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '安徽电气工程职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '安徽冶金科技职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '安徽城市管理职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '安徽工商职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '安徽中澳科技职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '安徽审计职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '安徽新闻出版职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '安徽邮电职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '安徽财贸职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '安徽国际商务职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '安徽林业职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '安徽艺术职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '安徽粮食工程职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '安徽人口职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '马鞍山师范高等专科学校', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '芜湖职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '安徽商贸职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '安徽机电职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '安徽中医药高等专科学校', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '安徽工贸职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '淮南联合大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '淮北职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '铜陵职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '安庆职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '安徽黄梅戏艺术职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '池州职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '六安职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '亳州职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '滁州职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '宿州职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '宣城职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '黄山职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '安徽汽车职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				// 福建专科
				{ school: '福建船政交通职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '漳州职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '闽西职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '黎明职业大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '福州职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '福建林业职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '福建信息职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '福建水利电力职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '福建电力职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '厦门海洋职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '福建农业职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '厦门城市职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '泉州医学高等专科学校', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '泉州工艺美术职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '闽北职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '福州软件职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '泉州纺织服装职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '泉州华光职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '泉州理工职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '闽南科技学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '厦门华天涉外职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '厦门兴才职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '厦门南洋职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '厦门东海职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '漳州科技职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '漳州理工职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '武夷山职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '泉州轻工职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '泉州海洋职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '福建幼儿师范高等专科学校', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '福建体育职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '湄洲湾职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '厦门安防科技职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '厦门演艺职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '福州英华职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '福州黎明职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '厦门软件职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				// 江西专科
				{ school: '九江职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '江西工业职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '江西医学高等专科学校', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '九江职业大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '江西陶瓷工艺美术职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '江西旅游商贸职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '江西电力职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '江西环境工程职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '江西交通职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '江西应用技术职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '江西财经职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '江西现代职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '江西工业工程职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '江西机电职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '上饶职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '宜春职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '江西外语外贸职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '江西工业贸易职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '江西中医药高等专科学校', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '江西先锋软件职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '江西制造职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '江西工程职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '江西青年职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '江西生物科技职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '江西建设职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '抚州职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '南昌影视传播职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '赣南卫生健康职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '江西水利职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '江西婺源茶业职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '上饶幼儿师范高等专科学校', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '赣州师范高等专科学校', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '宜春幼儿师范高等专科学校', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '吉安职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '江西陶瓷工艺美术职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '南昌健康职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				// 广西专科
				{ school: '南宁职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '柳州职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广西职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '桂林师范高等专科学校', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广西机电职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广西体育高等专科学校', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广西水利电力职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广西建设职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广西交通职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广西农业职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广西工商职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广西电力职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '柳州铁道职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广西生态工程职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广西国际商务职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广西经贸职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广西警官高等专科学校', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广西工业职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广西现代职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '北海职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广西卫生职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广西金融职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广西城市职业大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广西蓝天航空职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广西安全工程职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广西幼儿师范高等专科学校', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广西演艺职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广西英华国际职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广西工程职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广西理工职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广西经济职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广西科技职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广西中远职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '桂林山水职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广西培贤国际职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '广西自然资源职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '钦州幼儿师范高等专科学校', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '梧州医学高等专科学校', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '北海康养职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				// 海南专科
				{ school: '海南职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '海南软件职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '海南经贸职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '海南外国语职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '海南政法职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '海南体育职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '海南卫生健康职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '三亚城市职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '三亚航空旅游职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '三亚理工职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '三亚中瑞酒店管理职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '海南工商职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '海南科技职业大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '海南健康管理职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '三亚护理职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				// 内蒙古专科
				{ school: '内蒙古建筑职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '内蒙古丰州职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '包头职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '兴安职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '呼和浩特职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '包头轻工职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '内蒙古电子信息职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '内蒙古机电职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '内蒙古化工职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '内蒙古商贸职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '锡林郭勒职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '内蒙古警察职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '内蒙古体育职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '乌兰察布职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '通辽职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '科尔沁艺术职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '内蒙古北方职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '内蒙古科技职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '内蒙古交通职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '包头钢铁职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '满洲里俄语职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '赤峰工业职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '阿拉善职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '内蒙古能源职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '乌海职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '内蒙古经贸外语职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '内蒙古美术职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '内蒙古工业职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '呼伦贝尔职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '鄂尔多斯职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '扎兰屯职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '内蒙古幼儿师范高等专科学校', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '内蒙古民族幼儿师范高等专科学校', type: 'zhengfang', systemName: '正方教务系统' },
				// 重庆专科
				{ school: '重庆航天职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '重庆电子工程职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '重庆工业职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '重庆工程职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '重庆城市管理职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '重庆工商职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '重庆三峡职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '重庆工贸职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '重庆医药高等专科学校', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '重庆电力高等专科学校', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '重庆水利电力职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '重庆青年职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '重庆财经职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '重庆建筑工程职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '重庆商务职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '重庆化工职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '重庆旅游职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '重庆安全技术职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '重庆幼儿师范高等专科学校', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '重庆海联职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '重庆信息技术职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '重庆科创职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '重庆电讯职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '重庆能源职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '重庆交通职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '重庆公共运输职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '重庆艺术工程职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '重庆轻工职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '重庆电信职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '重庆经贸职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '重庆城市职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '重庆应用技术职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '重庆科技职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '重庆资源与环境保护职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '重庆智能工程职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '重庆健康职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				// 贵州专科
				{ school: '铜仁职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '贵州交通职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '贵州轻工职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '贵州电子信息职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '贵州警官职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '贵州工业职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '贵州电力职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '贵州职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '贵州航天职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '贵州亚泰职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '贵州工商职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '贵州盛华职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '贵州城市职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '黔东南民族职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '黔南民族职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '遵义职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '六盘水职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '贵州建设职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '贵州食品工程职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '贵州经贸职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '贵州护理职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '贵州航空职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '贵州电子商务职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '贵州文化旅游职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '贵州机电职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '贵州水利水电职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '毕节职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '毕节医学高等专科学校', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '毕节幼儿师范高等专科学校', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '贵州应用技术职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '贵州民用航空职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '贵州铜仁数据职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				// 云南专科
				{ school: '昆明冶金高等专科学校', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '云南交通职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '云南能源职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '云南机电职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '云南林业职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '云南农业职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '云南司法警官职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '云南文化艺术职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '云南体育运动职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '云南国防工业职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '云南旅游职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '云南国土资源职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '云南热带作物职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '云南锡业职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '云南科技信息职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '昆明艺术职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '玉溪农业职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '云南商务职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '云南城市建设职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '云南工程职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '云南新兴职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '云南经贸外事职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '云南三鑫职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '云南医药健康职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '云南理工职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '曲靖医学高等专科学校', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '楚雄医药高等专科学校', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '保山中医药高等专科学校', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '丽江师范高等专科学校', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '德宏师范高等专科学校', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '临沧师范高等专科学校', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '大理农林职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '大理护理职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '德宏职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '昭通卫生职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '红河卫生职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '云南水利水电职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '云南交通运输职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '云南轻纺职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '云南特殊教育职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '云南工贸职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '云南能源职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '曲靖职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '红河职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				// 陕西专科
				{ school: '陕西工业职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '杨凌职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '西安电力高等专科学校', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '陕西能源职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '陕西国防工业职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '西安航空职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '陕西交通职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '陕西铁路工程职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '陕西职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '宝鸡职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '西安铁路职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '咸阳职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '渭南职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '汉中职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '延安职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '榆林职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '商洛职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '安康职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '铜川职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '西安高新科技职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '西安城市建设职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '陕西电子信息职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '西安海棠职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '西安健康工程职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '陕西旅游烹饪职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '陕西青年职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '陕西工商职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '陕西艺术职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '西安电力机械制造公司机电学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '陕西省建筑职工大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '西安交通工程学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '西安职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '西安医学高等专科学校', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '西安铁路工程职工大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '西安飞机工业公司职工工学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '陕西航天职工大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '陕西经济管理职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '西安机电职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '陕西航天职工大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '西安高新技师学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '陕西航空技师学院', type: 'zhengfang', systemName: '正方教务系统' },
				// 甘肃专科
				{ school: '兰州石化职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '甘肃建筑职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '兰州职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '甘肃林业职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '甘肃工业职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '甘肃警察职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '甘肃交通职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '甘肃农业职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '甘肃卫生职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '甘肃畜牧工程职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '甘肃钢铁职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '甘肃机电职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '甘肃有色冶金职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '白银矿冶职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '甘肃能源化工职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '兰州资源环境职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '兰州科技职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '甘肃财贸职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '甘肃林业职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '庆阳职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '临夏现代职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '兰州现代职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '平凉职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '甘肃工业职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '武威职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '甘肃建筑职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '甘肃财贸职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '甘肃体育职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				// 青海专科
				{ school: '青海卫生职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '青海警官职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '青海畜牧兽医职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '青海交通职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '青海建筑职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '青海高等职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '青海柴达木职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '西宁城市职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				// 宁夏专科
				{ school: '宁夏民族职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '宁夏工业职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '宁夏职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '宁夏工商职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '宁夏财经职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '宁夏警官职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '宁夏建设职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '宁夏体育职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '宁夏艺术职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '宁夏幼儿师范高等专科学校', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '宁夏卫生健康职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				// 新疆专科
				{ school: '新疆农业职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '新疆轻工职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '新疆交通职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '新疆机电职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '新疆建设职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '新疆现代职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '新疆职业大学', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '新疆体育职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '新疆应用职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '新疆师范高等专科学校', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '新疆铁道职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '新疆生产建设兵团兴边职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '新疆能源职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '昌吉职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '阿克苏职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '巴音郭楞职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '新疆科信职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '新疆石河子职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '新疆塔里木职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '新疆兵团警官高等专科学校', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '新疆司法警官职业学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '和田职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '克孜勒苏职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '新疆工业职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '新疆维吾尔医学专科学校', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '哈密职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '吐鲁番职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '博尔塔拉职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '伊犁职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '塔城职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '阿勒泰职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				// 西藏专科
				{ school: '西藏警官高等专科学校', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '西藏职业技术学院', type: 'zhengfang', systemName: '正方教务系统' },
				{ school: '拉萨师范高等专科学校', type: 'zhengfang', systemName: '正方教务系统' }
			],
			systems: [
				{
					name: '正方教务系统',
					desc: '国内使用最广泛的教务系统',
					icon: '\u{1F3EB}',
					color: 'linear-gradient(135deg, #667eea, #764ba2)',
					placeholder: '如：jwgl.xxx.edu.cn',
					type: 'zhengfang'
				},
				{
					name: '青果教务系统',
					desc: '常见于部分高校',
					icon: '\u{1F4DA}',
					color: 'linear-gradient(135deg, #43e97b, #38f9d7)',
					placeholder: '如：jw.xxx.edu.cn',
					type: 'qingguo'
				},
				{
					name: '金智教务系统',
					desc: '今日校园旗下教务系统',
					icon: '\u{1F4BB}',
					color: 'linear-gradient(135deg, #fa709a, #fee140)',
					placeholder: '如：jwc.xxx.edu.cn',
					type: 'jinzhi'
				},
				{
					name: '其他/自定义',
					desc: '手动输入教务系统地址',
					icon: '\u2699\uFE0F',
					color: 'linear-gradient(135deg, #a8edea, #fed6e3)',
					placeholder: '请输入完整的教务系统网址',
					type: 'custom'
				}
			],
			colors: ['#4361ee', '#764ba2', '#43e97b', '#f5576c', '#fa709a', '#fee140', '#38f9d7', '#667eea', '#ff9800', '#e91e63']
		}
	},
	methods: {
		selectSystem(index) {
			this.selectedSystem = index
			this.previewCourses = []
		},
		onSchoolInput() {
			if (!this.schoolName.trim()) {
				this.searchResult = null
				return
			}
			var keyword = this.schoolName.trim().toLowerCase()
			var found = this.schoolDatabase.find(item =>
				item.school.toLowerCase().includes(keyword) ||
				keyword.includes(item.school.toLowerCase())
			)
			if (found) {
				this.searchResult = found
				// 自动选中对应系统类型
				var sysIndex = this.systems.findIndex(s => s.type === found.type)
				if (sysIndex !== -1) {
					this.selectedSystem = sysIndex
				}
			} else {
				this.searchResult = null
			}
		},
		clearSearch() {
			this.schoolName = ''
			this.searchResult = null
		},
		getWeekDayText(day) {
			var days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
			return days[day] || ''
		},
		toggleCourse(index) {
			this.previewCourses[index].selected = !this.previewCourses[index].selected
		},
		async startImport() {
			if (!this.eduUrl.trim()) {
				uni.showToast({ title: '请输入教务系统地址', icon: 'none' })
				return
			}
			if (!this.username.trim()) {
				uni.showToast({ title: '请输入学号', icon: 'none' })
				return
			}
			if (!this.password.trim()) {
				uni.showToast({ title: '请输入密码', icon: 'none' })
				return
			}

			var systemType = this.systems[this.selectedSystem].type
			var school = this.searchResult ? this.searchResult.school : this.schoolName

			this.importing = true
			uni.showLoading({ title: '正在登录教务系统...' })

			try {
				var res = await importApi.preview({
					systemType: systemType,
					school: school,
					eduUrl: this.eduUrl.trim(),
					username: this.username.trim(),
					password: this.password,
					semester: '2025-1'
				})

				if (res.success && res.data.courses && res.data.courses.length > 0) {
					this.previewCourses = res.data.courses
					uni.showToast({ title: '获取成功，请选择要导入的课程', icon: 'none' })
				} else {
					uni.showToast({ title: '未查询到课程数据，请检查信息', icon: 'none' })
				}
			} catch (err) {
				// 后端不可用时降级使用模拟数据
				console.warn('后端服务不可用，使用模拟数据:', err)
				this.previewCourses = this.generateMockCourses()
				uni.showToast({ title: '已加载演示数据（后端未连接）', icon: 'none' })
			} finally {
				uni.hideLoading()
				this.importing = false
			}
		},
		generateMockCourses() {
			// 模拟从教务系统获取的课程数据
			var mockData = [
				{ name: '高等数学A', teacher: '王教授', location: '教学楼A-301', weekDay: 0, startSection: 1, endSection: 2, startTime: '08:00', endTime: '09:40', startWeek: 1, endWeek: 16 },
				{ name: '大学英语', teacher: '李老师', location: '教学楼B-205', weekDay: 0, startSection: 3, endSection: 4, startTime: '10:00', endTime: '11:40', startWeek: 1, endWeek: 16 },
				{ name: '数据结构', teacher: '张教授', location: '实验楼C-102', weekDay: 0, startSection: 5, endSection: 6, startTime: '14:00', endTime: '15:40', startWeek: 1, endWeek: 16 },
				{ name: '大学物理', teacher: '陈教授', location: '教学楼A-201', weekDay: 1, startSection: 1, endSection: 2, startTime: '08:00', endTime: '09:40', startWeek: 1, endWeek: 16 },
				{ name: 'C语言程序设计', teacher: '刘老师', location: '实验楼D-305', weekDay: 1, startSection: 5, endSection: 6, startTime: '14:00', endTime: '15:40', startWeek: 1, endWeek: 16 },
				{ name: '马克思主义基本原理', teacher: '赵教授', location: '教学楼C-101', weekDay: 2, startSection: 3, endSection: 4, startTime: '10:00', endTime: '11:40', startWeek: 1, endWeek: 16 },
				{ name: '线性代数', teacher: '孙教授', location: '教学楼A-402', weekDay: 2, startSection: 7, endSection: 8, startTime: '16:00', endTime: '17:40', startWeek: 1, endWeek: 16 },
				{ name: '体育', teacher: '周老师', location: '体育馆', weekDay: 3, startSection: 5, endSection: 6, startTime: '14:00', endTime: '15:40', startWeek: 1, endWeek: 16 },
				{ name: '概率论与数理统计', teacher: '吴教授', location: '教学楼B-302', weekDay: 4, startSection: 1, endSection: 2, startTime: '08:00', endTime: '09:40', startWeek: 1, endWeek: 16 },
				{ name: '思想道德与法治', teacher: '郑老师', location: '教学楼C-205', weekDay: 4, startSection: 3, endSection: 4, startTime: '10:00', endTime: '11:40', startWeek: 1, endWeek: 16 }
			]

			return mockData.map((course, index) => ({
				...course,
				color: this.colors[index % this.colors.length],
				selected: true,
				remark: ''
			}))
		},
		confirmImport() {
			var selectedCourses = this.previewCourses.filter(c => c.selected)
			if (selectedCourses.length === 0) {
				uni.showToast({ title: '请至少选择一门课程', icon: 'none' })
				return
			}

			// 获取已有课程
			var courses = []
			try {
				var data = uni.getStorageSync('campus_courses')
				if (data) courses = JSON.parse(data)
			} catch (e) {}

			// 添加导入的课程
			selectedCourses.forEach(course => {
				var { selected, ...courseData } = course
				courses.push(courseData)
			})

			uni.setStorageSync('campus_courses', JSON.stringify(courses))

			uni.showToast({
				title: '成功导入 ' + selectedCourses.length + ' 门课程',
				icon: 'success'
			})

			// 后端确认（仅日志记录，不影响前端保存）
			var systemType = this.systems[this.selectedSystem].type
			var school = this.searchResult ? this.searchResult.school : this.schoolName
			importApi.confirm({
				systemType: systemType,
				school: school,
				eduUrl: this.eduUrl.trim(),
				username: this.username.trim(),
				semester: '2025-1',
				courseCount: selectedCourses.length
			}).catch(function() {})

			setTimeout(() => {
				uni.navigateBack()
			}, 1500)
		}
	}
}
</script>

<style>
.edu-import-page {
	min-height: 100vh;
	background: #f5f6fa;
	padding-bottom: 40rpx;
}

.edu-header {
	padding: 40rpx 32rpx 32rpx;
	background: linear-gradient(135deg, #43e97b, #38f9d7);
}
.edu-title {
	font-size: 44rpx;
	font-weight: bold;
	color: #ffffff;
	display: block;
	margin-bottom: 12rpx;
}
.edu-desc {
	font-size: 26rpx;
	color: rgba(255,255,255,0.85);
}

/* 搜索区域 */
.search-section {
	padding: 24rpx 32rpx;
}
.search-box {
	display: flex;
	align-items: center;
	background: #ffffff;
	border-radius: 20rpx;
	padding: 20rpx 28rpx;
	box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.08);
}
.search-icon {
	font-size: 32rpx;
	margin-right: 16rpx;
}
.search-input {
	flex: 1;
	font-size: 28rpx;
	color: #333;
}
.search-input::placeholder {
	color: #999;
}
.search-clear {
	font-size: 28rpx;
	color: #999;
	padding: 8rpx;
}
.search-result {
	margin-top: 16rpx;
}
.result-card {
	background: #ffffff;
	border-radius: 16rpx;
	padding: 24rpx;
	border-left: 8rpx solid #43e97b;
	box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.06);
}
.result-card.zhengfang {
	border-left-color: #667eea;
}
.result-card.qingguo {
	border-left-color: #43e97b;
}
.result-card.jinzhi {
	border-left-color: #fa709a;
}
.result-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 12rpx;
}
.result-school {
	font-size: 30rpx;
	font-weight: bold;
	color: #333;
}
.result-badge {
	font-size: 22rpx;
	padding: 6rpx 16rpx;
	border-radius: 20rpx;
	background: #e3f2fd;
	color: #4361ee;
}
.result-tip {
	font-size: 24rpx;
	color: #666;
}
.no-result {
	margin-top: 16rpx;
	padding: 24rpx;
	background: #fff3e0;
	border-radius: 16rpx;
	text-align: center;
}
.no-result-text {
	font-size: 26rpx;
	color: #e65100;
}
/* 分割线 */
.divider {
	display: flex;
	align-items: center;
	padding: 20rpx 32rpx;
}
.divider::before,
.divider::after {
	content: '';
	flex: 1;
	height: 2rpx;
	background: #e0e0e0;
}
.divider-text {
	font-size: 24rpx;
	color: #999;
	padding: 0 24rpx;
}

/* 系统列表 */
.system-list {
	padding: 32rpx;
	display: flex;
	flex-direction: column;
	gap: 20rpx;
}
.system-item {
	display: flex;
	align-items: center;
	gap: 24rpx;
	background: #ffffff;
	padding: 28rpx 32rpx;
	border-radius: 20rpx;
	box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.06);
	border: 4rpx solid transparent;
	transition: all 0.2s;
}
.system-item.selected {
	border-color: #43e97b;
	background: #f0fff4;
}
.sys-icon {
	width: 80rpx;
	height: 80rpx;
	border-radius: 20rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
}
.sys-emoji {
	font-size: 40rpx;
}
.sys-info {
	flex: 1;
}
.sys-name {
	font-size: 30rpx;
	font-weight: bold;
	color: #333;
	display: block;
	margin-bottom: 6rpx;
}
.sys-desc {
	font-size: 22rpx;
	color: #999;
}
.sys-check {
	width: 48rpx;
	height: 48rpx;
	border-radius: 50%;
	background: #43e97b;
	display: flex;
	align-items: center;
	justify-content: center;
}
.check-icon {
	color: #ffffff;
	font-size: 28rpx;
}

/* 表单 */
.url-section {
	padding: 0 32rpx;
}
.form-group {
	background: #ffffff;
	border-radius: 20rpx;
	padding: 24rpx 32rpx;
	margin-bottom: 20rpx;
	box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.04);
}
.form-label {
	font-size: 24rpx;
	color: #666;
	display: block;
	margin-bottom: 12rpx;
	font-weight: bold;
}
.form-input {
	font-size: 28rpx;
	color: #333;
	padding: 12rpx 0;
}

/* 提示卡片 */
.tip-card {
	display: flex;
	gap: 20rpx;
	background: #fff8e1;
	padding: 24rpx;
	border-radius: 16rpx;
	margin-bottom: 24rpx;
}
.tip-icon {
	font-size: 40rpx;
	flex-shrink: 0;
}
.tip-content {
	flex: 1;
}
.tip-title {
	font-size: 26rpx;
	font-weight: bold;
	color: #e65100;
	display: block;
	margin-bottom: 8rpx;
}
.tip-text {
	font-size: 22rpx;
	color: #666;
	line-height: 1.5;
}

/* 导入按钮 */
.import-btn {
	height: 88rpx;
	border-radius: 44rpx;
	background: linear-gradient(135deg, #43e97b, #38f9d7);
	color: #ffffff;
	font-size: 32rpx;
	font-weight: bold;
	border: none;
	margin-top: 16rpx;
}
.import-btn[disabled] {
	opacity: 0.7;
}

/* 预览 */
.preview-section {
	padding: 0 32rpx;
	margin-top: 32rpx;
}
.section-header {
	margin-bottom: 20rpx;
}
.section-title {
	font-size: 30rpx;
	font-weight: bold;
	color: #333;
}
.preview-list {
	background: #ffffff;
	border-radius: 20rpx;
	padding: 24rpx;
	box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.06);
}
.preview-item {
	display: flex;
	align-items: center;
	gap: 16rpx;
	padding: 16rpx 0;
	border-bottom: 2rpx solid #f0f0f0;
}
.preview-item:last-child {
	border-bottom: none;
}
.preview-color {
	width: 8rpx;
	height: 64rpx;
	border-radius: 4rpx;
	flex-shrink: 0;
}
.preview-info {
	flex: 1;
}
.preview-name {
	font-size: 26rpx;
	font-weight: bold;
	color: #333;
	display: block;
	margin-bottom: 4rpx;
}
.preview-detail {
	font-size: 20rpx;
	color: #666;
	display: block;
	margin-bottom: 2rpx;
}
.preview-time {
	font-size: 18rpx;
	color: #999;
}
.preview-check {
	flex-shrink: 0;
}

.confirm-btn {
	height: 88rpx;
	border-radius: 44rpx;
	background: linear-gradient(135deg, #4361ee, #7b8cff);
	color: #ffffff;
	font-size: 32rpx;
	font-weight: bold;
	border: none;
	margin-top: 24rpx;
}

/* 使用说明 */
.help-section {
	margin: 32rpx;
	background: #ffffff;
	border-radius: 20rpx;
	padding: 32rpx;
	box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.06);
}
.help-title {
	font-size: 30rpx;
	font-weight: bold;
	color: #333;
	display: block;
	margin-bottom: 24rpx;
}
.help-steps {
	display: flex;
	flex-direction: column;
	gap: 20rpx;
}
.help-step {
	display: flex;
	align-items: center;
	gap: 20rpx;
}
.step-num {
	width: 48rpx;
	height: 48rpx;
	border-radius: 50%;
	background: #4361ee;
	color: #ffffff;
	font-size: 24rpx;
	font-weight: bold;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
}
.step-text {
	font-size: 26rpx;
	color: #666;
}
</style>
