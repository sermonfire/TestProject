旅游推荐系统后端服务

# 项目简介
本项目是一个基于Spring Boot的旅游目的地推荐系统后端服务，提供用户管理、偏好设置和个性化推荐等功能。

# 技术栈
Spring Boot 3.x
MyBatis
MySQL 8.0
Redis
JWT

# 项目特点
- 采用JWT实现无状态的用户认证
- 使用Redis存储token实现token刷新和失效处理
- 自定义TypeHandler处理JSON类型数据
- 全局异常处理
- 参数校验
- 基于规则的个性化推荐算法
- ThreadLocal管理用户会话信息
- 统一的响应格式（ClientResult）
- 完善的数据验证（使用Jakarta Validation）
- 支持文件上传（集成腾讯云COS）
- 多级分类管理
- 灵活的收藏分类系统

# 功能模块

## 1. 用户管理
- 用户注册、登录
- 用户信息管理
- JWT认证
- Token刷新机制

## 2. 个性化推荐
- 用户偏好设置
- 个性化推荐算法
- 相关目的地推荐

## 3. 收藏管理
### 3.1 收藏分类管理
- 支持创建、删除、更新收藏分类
- 每个用户默认创建一个"默认收藏"分类
- 默认分类不能删除或修改
- 分类支持自定义排序
- 同一用户下分类名称唯一
- 使用乐观锁控制并发更新
- 删除分类时自动将收藏移至默认分类

### 3.2 收藏功能
- 支持添加、取消、批量取消收藏
- 支持将收藏添加到指定分类
- 支持修改收藏的分类
- 支持收藏备注
- 支持收藏排序
- 支持按分类查看收藏
- 支持搜索收藏（支持目的地名称、描述和收藏备注）
- 软删除机制（使用status字段标记）

### 3.3 收藏统计
- 支持查看总收藏数
- 支持查看各分类的收藏数量
- 支持查看默认分类的收藏数量

# 数据库设计

1. 用户表 (client_user)
CREATE TABLE client_user (
    id int NOT NULL AUTO_INCREMENT,
    username varchar(50) NOT NULL COMMENT '用户名',
    password varchar(64) NOT NULL COMMENT '密码',
    phone varchar(20) NOT NULL COMMENT '手机号',
    email varchar(50) DEFAULT NULL COMMENT '邮箱',
    gender char(1) DEFAULT '0' COMMENT '性别(0:未知,1:男,2:女)',
    user_pic varchar(255) DEFAULT NULL COMMENT '用户头像',
    create_time datetime DEFAULT CURRENT_TIMESTAMP,
    update_time datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY idx_phone (phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='客户端用户表';

2. 用户偏好表 (user_preference)
CREATE TABLE user_preference (
    id int NOT NULL AUTO_INCREMENT,
    user_id int NOT NULL COMMENT '用户ID',
    travel_styles json DEFAULT NULL COMMENT '旅行风格',
    destination_types json DEFAULT NULL COMMENT '目的地类型',
    seasonal_preferences json DEFAULT NULL COMMENT '季节偏好',
    budget int DEFAULT NULL COMMENT '预算',
    duration varchar(20) DEFAULT NULL COMMENT '期望行程时长',
    create_time datetime DEFAULT CURRENT_TIMESTAMP,
    update_time datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户偏好表';

3. 目的地表 (destination)
CREATE TABLE destination (
    id int NOT NULL AUTO_INCREMENT,
    name varchar(100) NOT NULL COMMENT '目的地名称',
    description text COMMENT '目的地描述',
    image_url varchar(255) DEFAULT NULL COMMENT '图片URL',
    rating decimal(2,1) DEFAULT NULL COMMENT '评分',
    recommended_duration varchar(50) DEFAULT NULL COMMENT '推荐游玩时长',
    average_budget decimal(10,2) DEFAULT NULL COMMENT '平均预算',
    tags json DEFAULT NULL COMMENT '标签(如文化,美食等)',
    best_seasons json DEFAULT NULL COMMENT '最佳季节',
    seasonal_features json DEFAULT NULL COMMENT '季节特色',
    popularity int DEFAULT '0' COMMENT '热度',
    seasonal_score int DEFAULT '0' COMMENT '季节性评分',
    create_time datetime DEFAULT CURRENT_TIMESTAMP,
    update_time datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='旅游目的地表';

4. 用户收藏表 (user_favorite)
CREATE TABLE user_favorite (
    id int NOT NULL AUTO_INCREMENT,
    user_id int NOT NULL COMMENT '用户ID',
    destination_id int NOT NULL COMMENT '目的地ID',
    create_time datetime DEFAULT CURRENT_TIMESTAMP COMMENT '收藏时间',
    status tinyint(1) DEFAULT 1 COMMENT '收藏状态(0:取消收藏,1:已收藏)',
    category varchar(50) DEFAULT NULL COMMENT '收藏分类',
    notes text DEFAULT NULL COMMENT '收藏备注',
    sort_order int DEFAULT 0 COMMENT '排序顺序',
    update_time datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_user_destination (user_id, destination_id),
    KEY idx_create_time (create_time),
    KEY idx_sort (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户收藏表';

5. 收藏分类表 (favorite_category)
// 在创建用户时，自动创建一个默认分类
INSERT INTO favorite_category (user_id, name, description, is_default) 
VALUES (#{userId}, '默认收藏', '未分类的收藏', 1);

CREATE TABLE favorite_category (
    id int NOT NULL AUTO_INCREMENT,
    user_id int NOT NULL COMMENT '用户ID',
    name varchar(50) NOT NULL COMMENT '分类名称',
    description varchar(255) DEFAULT NULL COMMENT '分类描述',
    is_default tinyint(1) DEFAULT 0 COMMENT '是否默认分类(0:否,1:是)',
    sort_order int DEFAULT 0 COMMENT '排序顺序',
    create_time datetime DEFAULT CURRENT_TIMESTAMP,
    update_time datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY idx_user_category (user_id, name) COMMENT '同一用户下分类名称唯一',
    KEY idx_sort (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='收藏分类表';

# API接口文档

## 1. 文件上传接口
1. 通用文件上传
请求路径: /upload
请求方法: POST
请求头: 
- Authorization: token
- Content-Type: multipart/form-data
请求参数: 
- file: 文件(multipart/form-data)
响应结果:
{
    "code": 0,
    "message": "success",
    "data": "文件访问url"
}
说明：
- 支持的文件类型：图片(jpg, jpeg, png, gif)
- 单个文件大小限制：10MB
- 文件将上传到腾讯云COS存储

## 2. 用户管理接口
1. 用户注册
请求路径: /ClientUser/register
请求方法: POST
请求参数:
{
    "phone": "手机号",
    "password": "密码",
    "username": "用户名"
}
响应结果:
{
    "code": 0,
    "message": "success"
}

2. 用户登录
请求路径: /ClientUser/login
请求方法: POST
请求参数:
{
    "phone": "手机号",
    "password": "密码"
}
响应结果:
{
    "code": 0,
    "message": "success",
    "data": {
        "token": "jwt令牌",
        "userInfo": {
            "phone": "手机号",
            "avatar": "头像url",
            "username": "用户名"
        }
    }
}

3. 获取用户信息
请求路径: /ClientUser/userInfo
请求方法: GET
请求头: Authorization: token
响应结果:
{
    "code": 0,
    "message": "success",
    "data": {
        "id": 1,
        "username": "用户名",
        "phone": "手机号",
        "email": "邮箱",
        "gender": "性别",
        "userPic": "头像url",
        "createTime": "创建时间",
        "updateTime": "更新时间"
    }
}

4. 更新用户信息
请求路径: /ClientUser/userInfoUpdate
请求方法: PUT
请求头: Authorization: token
请求参数:
{
    "id": 1,
    "username": "用户名",
    "email": "邮箱",
    "gender": "性别",
    "userPic": "头像url"
}
响应结果:
{
    "code": 0,
    "message": "success"
}

5. 更新密码
请求路径: /ClientUser/updatePassword
请求方法: PUT
请求头: Authorization: token
请求参数:
{
    "oldPassword": "旧密码",
    "newPassword": "新密码",
    "confirmPassword": "确认新密码"
}
响应结果:
{
    "code": 0,
    "message": "success"
}

6. 检查登录状态
请求路径: /ClientUser/checkLoginStatus
请求方法: GET
请求头: Authorization: token
响应结果:
{
    "code": 0,
    "message": "success",
    "data": {
        "isValid": true,
        "newToken": "新token" // 当token即将过期时返回
    }
}
说明：
- isValid为true表示登录状态有效
- 当token剩余有效期小于5分钟时，会返回新的token
- 新token的有效期为30分钟

## 3. 用户偏好接口
1. 保存用户偏好
请求路径: /recommend/preferences
请求方法: POST
请求头: Authorization: token
请求参数:
{
    "travelStyles": ["自然风光", "文化遗产", "美食", "购物", "历史", "艺术", "冒险"],
    "destinationTypes": ["山岳", "海滨", "古镇", "城市", "乡村", "海岛", "沙漠"],
    "seasonalPreferences": ["春季", "夏季", "秋季", "冬季"],
    "budget": 1000,
    "duration": "medium"
}
响应结果:
{
    "code": 0,
    "message": "success"
}
说明：
- travelStyles: 旅行风格，可选值：["自然风光", "文化遗产", "美食", "购物", "历史", "艺术", "冒险"]
- destinationTypes: 目的地类型，可选值：["山岳", "海滨", "古镇", "城市", "乡村", "海岛", "沙漠"]
- seasonalPreferences: 季节偏好，可选值：["春季", "夏季", "秋季", "冬季"]
- budget: 预算，单位元，范围100-2000
- duration: 期望行程时长，可选值：short(1-3天), medium(4-7天), long(7天以上)

2. 获取用户偏好
请求路径: /recommend/preferences
请求方法: GET
请求头: Authorization: token
响应结果:
{
    "code": 0,
    "message": "success",
    "data": {
        "travelStyles": ["自然风光", "文化遗产"],
        "destinationTypes": ["山岳", "古镇"],
        "seasonalPreferences": ["春季", "秋季"],
        "budget": 1000,
        "duration": "medium"
    }
}

## 5. 收藏管理接口
1. 添加收藏
请求路径: /favorite/{destinationId}
请求方法: POST
请求头: Authorization: token
请求参数: 
- destinationId: 目的地ID (路径参数)
- category: 收藏分类 (可选，查询参数)
- notes: 收藏备注 (可选，查询参数)
响应结果:
{
    "code": 0,
    "message": "success"
}

2. 取消收藏
请求路径: /favorite/{destinationId}
请求方法: DELETE
请求头: Authorization: token
请求参数:
- destinationId: 目的地ID (路径参数)
响应结果:
{
    "code": 0,
    "message": "success"
}

3. 取消所有收藏
请求路径: /favorite/all
请求方法: DELETE
请求头: Authorization: token
响应结果:
{
    "code": 0,
    "message": "success"
}

4. 获取收藏列表
请求路径: /favorite/list
请求方法: GET
请求头: Authorization: token
请求参数:
- categoryId: Integer (可选，不传表示获取所有收藏，1表示获取默认分类的收藏)
- pageNum: Integer (可选，默认1)
- pageSize: Integer (可选，默认10)
响应结果:
{
    "code": 0,
    "message": "success",
    "data": {
        "list": [{
            "id": 1,
            "userId": 1,
            "destinationId": 1,
            "createTime": "2024-01-01 12:00:00",
            "status": true,
            "category": "想去",
            "notes": "下个月去玩",
            "sortOrder": 0,
            "updateTime": "2024-01-01 12:00:00",
            "destination": {
                "id": 1,
                "name": "目的地名称",
                "description": "描述",
                "imageUrl": "图片url",
                "rating": 4.5,
                "recommendedDuration": "medium",
                "averageBudget": 800.00,
                "tags": ["标签1", "标签2"],
                "bestSeasons": ["春季", "秋季"],
                "seasonalFeatures": {
                    "春季": "特色描述",
                    "秋季": "特色描述"
                },
                "popularity": 90
            }
        }],
        "pageNum": 1,
        "pageSize": 10,
        "total": 100,
        "pages": 10
    }
}
说明：
- categoryId不传时获取所有收藏
- categoryId=1时获取默认分类（未分类）的收藏
- categoryId>1时获取指定分类的收藏
- 返回结果按sort_order升序、create_time降序排序
- 返回的收藏信息包含完整的目的地信息
- 目的地信息中的tags、bestSeasons使用StringListTypeHandler处理
- seasonalFeatures使用JsonTypeHandler处理
- 所有时间字段格式为"yyyy-MM-dd HH:mm:ss"

5. 搜索收藏
请求路径: /favorite/search
请求方法: GET
请求头: Authorization: token
请求参数:
- keyword: String (必需，搜索关键词)
- pageNum: Integer (可选，默认1)
- pageSize: Integer (可选，默认10)
响应结果: 同获取收藏列表
说明：
- 支持搜索目的地名称、描述和收藏备注
- 返回结果按sort_order升序、create_time降序排序

6. 更新收藏排序
请求路径: /favorite/{favoriteId}/sort
请求方法: PUT
请求头: Authorization: token
请求参数:
- favoriteId: Integer (路径参数)
- sortOrder: Integer (查询参数，排序值)
响应结果:
{
    "code": 0,
    "message": "success"
}
说明：
- sortOrder值越小排序越靠前
- 同一分类下的收藏按sortOrder排序

7. 获取收藏统计信息
请求路径: /favorite/stats
请求方法: GET
请求头: Authorization: token
响应结果:
{
    "code": 0,
    "message": "success",
    "data": {
        "totalCount": 100,
        "defaultCategoryCount": 20,
        "categoryStats": {
            "想去的地方": 30,
            "已去过": 50
        }
    }
}
说明：
- totalCount: 总收藏数
- defaultCategoryCount: 默认分类的收藏数
- categoryStats: 各分类的收藏数量统计

8. 检查是否已收藏
请求路径: /favorite/check/{destinationId}
请求方法: GET
请求头: Authorization: token
请求参数:
- destinationId: 目的地ID (路径参数)
响应结果:
{
    "code": 0,
    "message": "success",
    "data": true  // true表示已收藏，false表示未收藏
}

9. 批量更新收藏分类
请求路径: /favorite/batch/category
请求方法: PUT
请求头: Authorization: token
请求参数:
- favoriteIds: List<Integer> (必需，收藏ID列表)
- category: String (必需，目标分类名称)
响应结果:
{
    "code": 0,
    "message": "success"
}

10. 批量删除收藏
请求路径: /favorite/batch
请求方法: DELETE
请求头: Authorization: token
请求参数:
- favoriteIds: List<Integer> (必需，收藏ID列表)
响应结果:
{
    "code": 0,
    "message": "success"
}

## 6. 收藏分类管理接口
1. 创建收藏分类
请求路径: /favorite/category
请求方法: POST
请求头: Authorization: token
请求参数: 
{
    "name": "分类名称",
    "description": "分类描述"
}
响应结果:
{
    "code": 0,
    "message": "success"
}
说明：
- 分类名称在同一用户下不能重复
- 不能创建与默认分类同名的分类
- 分类名称长度1-50个字符
- 分类描述最大255个字符

2. 删除收藏分类
请求路径: /favorite/category/{categoryId}
请求方法: DELETE
请求头: Authorization: token
请求参数:
- categoryId: 分类ID (路径参数)
响应结果:
{
    "code": 0,
    "message": "success"
}
说明：
- 不能删除默认分类（is_default=1）
- 删除分类时，该分类下的收藏会自动移到默认分类

3. 获取用户的所有收藏分类
请求路径: /favorite/category/list
请求方法: GET
请求头: Authorization: token
响应结果:
{
    "code": 0,
    "message": "success",
    "data": [
        {
            "id": 1,
            "userId": 1,
            "name": "默认收藏",
            "description": "未分类的收藏",
            "isDefault": true,
            "sortOrder": 0,
            "createTime": "2024-01-01 12:00:00",
            "updateTime": "2024-01-01 12:00:00"
        }
    ]
}
说明：
- 返回结果按sort_order升序、id升序排序

4. 更新分类信息
请求路径: /favorite/category/{categoryId}
请求方法: PUT
请求头: Authorization: token
请求参数: 
{
    "name": "分类名称",
    "description": "分类描述"
}
响应结果:
{
    "code": 0,
    "message": "success"
}
说明：
- 分类名称在同一用户下不能重复
- 不能修改默认分类
- 分类名称长度1-50个字符
- 分类描述最大255个字符

5. 更新分类排序
请求路径: /favorite/category/{categoryId}/sort
请求方法: PUT
请求头: Authorization: token
请求参数: 
- categoryId: Integer (路径参数)
- sortOrder: Integer (查询参数，排序值)
响应结果:
{
    "code": 0,
    "message": "success"
}
说明：
- sortOrder值越小排序越靠前
- 分类列表按sort_order排序
- 不能修改默认分类的排序
- 同一用户下的分类排序值唯一

# 推荐算法说明

系统采用基于规则的推荐算法，主要考虑以下因素：
标签匹配度 (权重2分/个)
预算匹配度 (权重3分)
季节匹配度 (权重2分/个)
目的地热度 (最高1分)
目的地评分 (最高2分)

相关推荐算法：
1. 标签相似度 (权重40分)
- 完全匹配：40分
- 部分匹配：根据匹配标签数量比例计算

2. 目的地评分 (权重25分)
- 根据目的地评分(1-5分)计算

3. 热度权重 (权重20分)
- 根据目的地热度(0-100)计算

4. 季节适配度 (权重15分)
- 当前季节匹配：15分
- 不匹配：0分

# 开发注意事项

1. 分类管理
- 创建分类时需验证名称唯一性
- 删除分类时，该分类下的收藏会自动移到默认分类
- 默认分类（is_default=1）不能删除或修改

2. 收藏管理
- 添加收藏时如指定分类，需验证分类是否存在
- 更新收藏分类时需验证目标分类是否存在
- 批量操作时注意数据一致性

3. 性能优化
- 添加了适当的索引（user_id, destination_id, sort_order等）
- 使用PageHelper实现分页
- 批量操作时可以优化为一次性更新
- Redis缓存token减少数据库访问
- JSON类型数据使用自定义TypeHandler优化处理

4. 安全性考虑
- 密码使用Md5加密存储
- 使用Redis管理token，支持token失效和刷新机制
- 全局异常处理避免敏感信息泄露
- 参数校验防止非法输入

5. 代码规范
- 统一的异常处理机制
- 规范的命名约定
- 完善的注释文档
- 模块化的项目结构
- 统一的接口响应格式

6. 项目结构说明
src/main/java/com/travelrec/
├── config/ // 配置类
├── controller/ // 控制器
├── dto/ // 数据传输对象
├── enums/ // 枚举类
├── exception/ // 异常处理
├── interceptor/ // 拦截器
├── mapper/ // MyBatis映射接口
├── pojo/ // 实体类
├── service/ // 服务层
└── utils/ // 工具类

7. 环境要求
- JDK 17+
- Maven 3.6+
- MySQL 8.0+
- Redis 6.0+
- 腾讯云COS服务

8. 部署说明
- 需要配置application.yml中的数据库连接信息
- 需要配置Redis连接信息
- 需要配置腾讯云COS的访问密钥和存储桶信息
- 建议使用nginx进行反向代理

## 最佳实践

### 1. 安全性考虑
- 所有接口都需要JWT认证（除登录注册外）
- 用户只能访问自己的数据
- 密码使用MD5加密存储
- 使用Redis管理token，支持失效和刷新
- 参数校验防止非法输入

### 2. 性能优化
- 合理使用索引（user_id, destination_id等）
- 分页查询避免大量数据返回
- Redis缓存减少数据库访问
- 使用乐观锁处理并发更新
- JSON类型数据使用TypeHandler优化

### 3. 代码规范
- 统一的异常处理机制
- 规范的命名约定
- 完善的注释文档
- 模块化的项目结构
- 统一的接口响应格式

### 4. 数据库设计最佳实践
- 合理使用索引提升查询性能
- 使用软删除而不是物理删除
- 记录创建和更新时间
- 使用乐观锁控制并发
- 合理设计字段类型和长度
- 使用唯一索引确保同一用户下分类名称唯一
- 使用乐观锁控制并发更新

# 旅游推荐系统优化记录

## 最新优化 - 用户收藏分类查询功能

### 优化内容
1. 优化了用户收藏分类查询的SQL查询和结果映射
2. 改进了异常处理和日志记录机制
3. 提升了查询性能和代码可维护性

### 具体改进
1. SQL查询优化：
   - 将LEFT JOIN改为INNER JOIN提升连接查询性能
   - 使用EXISTS子查询确保分类存在且属于当前用户
   - 优化了默认分类的处理逻辑，支持多种默认分类标识

2. 结果映射优化：
   - 移除了N+1查询问题，直接在联表查询中映射destination属性
   - 完善了字段映射，确保数据完整性
   - 添加了对复杂类型（List和JSON）的正确处理

3. 异常处理优化：
   - 添加了参数验证
   - 完善了异常捕获和日志记录
   - 统一了错误返回格式

### 性能提升
1. 减少了数据库查询次数
2. 优化了JOIN操作性能
3. 改进了分类查询逻辑

### 代码维护性提升
1. 统一了分类处理逻辑
2. 完善了注释和日志
3. 增强了代码的可读性和可维护性

### 安全性提升
1. 添加了用户权限验证
2. 防止了SQL注入风险
3. 确保用户只能访问自己的数据

## 下一步优化计划
1. 考虑添加缓存机制
2. 优化批量操作性能
3. 添加更多的数据验证和清理机制