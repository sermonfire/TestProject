# 本项目的对应旅游推荐系统后端服务

## 数据库设计

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


##API接口文档

文件上传接口
1. 通用文件上传
请求路径: /upload
请求方法: POST
请求头: Authorization: token
请求参数: 
- file: 文件(multipart/form-data)
响应结果:
{
    "code": 0,
    "message": "success",
    "data": "文件访问url"
}

用户管理接口
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

用户偏好接口
1. 保存用户偏好
请求路径: /recommend/preferences
请求方法: POST
请求头: Authorization: token
请求参数:
{
    "travelStyles": ["自然风光", "文化遗产"],
    "destinationTypes": ["山岳", "古镇"],
    "seasonalPreferences": ["春季", "秋季"],
    "budget": 1000,
    "duration": "medium"
}
响应结果:
{
    "code": 0,
    "message": "success"
}

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

目的地推荐接口
1. 获取个性化推荐目的地
请求路径: /recommend/destinations
请求方法: GET
请求头: Authorization: token
请求参数:
- pageNum: Integer (可选，默认1)
- pageSize: Integer (可选，默认10)
响应结果:
{
    "code": 0,
    "message": "success",
    "data": {
        "list": [{
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
        }],
        "pageNum": 1,
        "pageSize": 10,
        "total": 100,
        "pages": 10
    }
}

2. 预览推荐结果
请求路径: /recommend/personalized/preview
请求方法: POST
请求头: Authorization: token
请求参数: 同保存用户偏好的参数格式
响应结果: 同获取推荐目的地的响应格式

3. 获取相关推荐
请求路径: /recommend/related
请求方法: GET
请求头: Authorization: token
请求参数: 
- tags: List<String> (必需，通过请求参数传递，例如 ?tags=自然风光&tags=美食)
- pageNum: Integer (可选，默认1)
- pageSize: Integer (可选，默认10)
响应结果:
{
    "code": 0,
    "message": "success",
    "data": {
        "list": [
            {
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
        ],
        "pageNum": 1,
        "pageSize": 10,
        "total": 100,
        "pages": 10
    }
}

##推荐算法说明

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

##技术栈

Spring Boot 3.x
MyBatis
MySQL 8.0
Redis
JWT


