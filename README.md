# TravelRec - 智能旅游推荐系统

## 项目简介
TravelRec是一个基于Vue3的智能旅游推荐系统前端项目，致力于为用户提供个性化的旅行建议。系统集成了智能对话、旅游推荐、收藏管理等功能，为用户打造一站式旅游规划平台。

## 项目目标
— 实现一个基于Vue3的智能旅游推荐系统前端项目，致力于为用户提供个性化的旅行建议。系统集成了智能对话、旅游推荐、收藏管理等功能，为用户打造一站式旅游规划平台。

## 项目功能
（1）用户注册与登录：允许用户注册账号并登录系统，以便进行个性化的旅游推荐。√
（2）个人信息管理：用户可以管理自己的个人信息，包括姓名、联系方式、旅游偏好等。√
（3）旅游偏好设置：系统应允许用户设置自己的旅游偏好，如目的地类型（自然风光、历史文化、休闲娱乐等）、预算范围、出行方式（自驾、公共交通等）等。√
（4）旅游推荐功能：根据用户的偏好和个人信息，系统应能够提供个性化的旅游目的地推荐。推荐算法可以是基于用户历史行为的推荐，或者是结合用户喜好和目的地特点的智能匹配。√
（5）目的地信息展示：系统应提供旅游目的地的详细信息，包括景点介绍、美食推荐、住宿选择、交通方式等。√
（6）行程规划功能：用户可以根据推荐的目的地√，规划自己的行程√，包括日程安排√、景点游览顺序√等。
（7）用户评价与反馈：用户可以对推荐的旅游目的地和行程进行评价，提供反馈，系统可以根据这些信息不断优化推荐算法。√
（8）社交分享功能：用户可以将推荐的旅游目的地和行程通过社交媒体分享给朋友。√

## 技术栈
- **前端框架**: Vue 3
- **状态管理**: Pinia
- **UI组件库**: 

  - Element Plus
  - TDesign Vue Next
- **路由管理**: Vue Router
- **工具库**:
  - Axios (HTTP请求)
  - Day.js (日期处理)
  - CryptoJS (加密处理)
  - VueDraggable (拖拽功能)

## 主要功能
1. **智能对话**
   - 基于AI的智能旅游助手
   - 个性化旅行建议
   - 实时对话历史记录

2. **旅游推荐**
   - 个性化目的地推荐
   - 智能行程规划
   - 基于标签的搜索系统

3. **收藏管理**
   - 分类管理
   - 批量操作
   - 拖拽排序
   - 网格/列表视图切换

4. **用户系统**
   - 账号登录/注册
   - 密码加密存储
   - 记住密码功能

## 项目结构 
travelrec/
├── src/
│ ├── api/ # API接口
│ ├── assets/ # 静态资源
│ ├── components/ # 公共组件
│ ├── router/ # 路由配置
│ ├── stores/ # Pinia状态管理
│ ├── styles/ # 全局样式
│ ├── utils/ # 工具函数
│ └── views/ # 页面组件
├── public/ # 公共资源
└── static/ # 静态资源


## 开发环境设置
bash

安装依赖
npm install
启动开发服务器
npm run dev
构建生产版本
npm run build
预览生产构建
npm run preview


## 环境要求
- Node.js >= 16.0.0
- npm >= 7.0.0

## 特色功能
1. **响应式设计**
   - 适配多种设备尺寸
   - 流畅的动画过渡

2. **性能优化**
   - 组件懒加载
   - 状态持久化
   - 图片加载优化

3. **用户体验**
   - 优雅的错误处理
   - 友好的加载状态
   - 直观的操作反馈

## 开发规范
1. **代码风格**
   - 使用ESLint进行代码规范检查
   - 遵循Vue3组合式API规范

2. **组件开发**
   - 采用功能模块化设计
   - 组件命名采用PascalCase
   - Props类型必须明确声明

3. **状态管理**
   - 使用Pinia进行集中状态管理
   - 按功能模块拆分Store
   - 实现状态持久化

## 版本历史
- v1.0.0 (2024-01) - 初始版本发布
  - 实现基础功能架构
  - 完成核心功能开发