# 企业管理接口文档

## 基础信息

- **Base URL**: `/api/v1/enterprises`
- **Content-Type**: `application/json`
- **认证方式**: Bearer Token (JWT)

## 统一响应格式

所有接口返回统一的响应格式：

```json
{
  "code": "SUCCESS",        // 状态码
  "message": "操作成功",    // 提示消息
  "data": {}                // 实际数据
}
```

## 接口列表

### 1. 创建企业

创建一个新的企业，创建者自动成为企业所有者。

- **URL**: `POST /enterprises`
- **请求参数**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 企业名称（2-100字符） |
| description | string | 否 | 企业描述（最多1000字符） |
| logo_url | string | 否 | 企业Logo URL（最多500字符） |
| website | string | 否 | 企业官网（必须以http://或https://开头） |
| contact_email | string | 否 | 联系邮箱 |
| address | string | 否 | 企业地址（最多500字符） |

- **请求示例**:
```json
{
  "name": "创新科技有限公司",
  "description": "专注于Web3技术研发的高科技企业",
  "logo_url": "https://example.com/logo.png",
  "website": "https://example.com",
  "contact_email": "contact@example.com",
  "address": "北京市海淀区中关村科技园A座1001室"
}
```

- **响应示例**:
```json
{
  "code": "SUCCESS",
  "message": "企业创建成功",
  "data": {
    "id": "bd7eea58-8f9b-444d-8104-b819b17d6f84",
    "name": "创新科技有限公司",
    "description": "专注于Web3技术研发的高科技企业",
    "logo_url": "https://example.com/logo.png",
    "website": "https://example.com",
    "contact_email": "contact@example.com",
    "address": "北京市海淀区中关村科技园A座1001室",
    "wallet_address": null,
    "is_active": true,
    "is_verified": false,
    "created_at": "2026-02-15T10:30:00Z",
    "updated_at": "2026-02-15T10:30:00Z",
    "member_count": 1,
    "members": [
      {
        "id": "b86d343e-87ea-408c-ab37-4ef97faf1553",
        "user_id": "3c095217-eb97-429b-bd11-1fa4be4f60c5",
        "username": "admin",
        "email": "admin@example.com",
        "full_name": "管理员",
        "avatar_url": null,
        "role": "owner",
        "joined_at": "2026-02-15T10:30:00Z"
      }
    ]
  }
}
```

### 2. 获取我的企业列表

获取当前用户所属的所有企业列表，支持分页。

- **URL**: `GET /enterprises`
- **查询参数**:

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| page | integer | 否 | 1 | 页码（从1开始） |
| page_size | integer | 否 | 20 | 每页数量（1-100） |

- **请求示例**:
```
GET /api/v1/enterprises?page=1&page_size=20
```

- **响应示例**:
```json
{
  "code": "SUCCESS",
  "message": "获取企业列表成功",
  "data": {
    "items": [
      {
        "id": "bd7eea58-8f9b-444d-8104-b819b17d6f84",
        "name": "创新科技有限公司",
        "description": "专注于Web3技术研发的高科技企业",
        "logo_url": "https://example.com/logo.png",
        "website": "https://example.com",
        "contact_email": "contact@example.com",
        "address": "北京市海淀区中关村科技园A座1001室",
        "wallet_address": null,
        "is_active": true,
        "is_verified": false,
        "created_at": "2026-02-15T10:30:00Z",
        "updated_at": "2026-02-15T10:30:00Z",
        "member_count": 5
      }
    ],
    "total": 1,
    "page": 1,
    "page_size": 20,
    "pages": 1
  }
}
```

### 3. 获取企业详情

获取指定企业的详细信息，包括成员列表。

- **URL**: `GET /enterprises/{enterprise_id}`
- **路径参数**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| enterprise_id | string | 是 | 企业ID（UUID格式） |

- **请求示例**:
```
GET /api/v1/enterprises/bd7eea58-8f9b-444d-8104-b819b17d6f84
```

- **响应示例**:
```json
{
  "code": "SUCCESS",
  "message": "获取企业详情成功",
  "data": {
    "id": "bd7eea58-8f9b-444d-8104-b819b17d6f84",
    "name": "创新科技有限公司",
    "description": "专注于Web3技术研发的高科技企业",
    "logo_url": "https://example.com/logo.png",
    "website": "https://example.com",
    "contact_email": "contact@example.com",
    "address": "北京市海淀区中关村科技园A座1001室",
    "wallet_address": null,
    "is_active": true,
    "is_verified": false,
    "created_at": "2026-02-15T10:30:00Z",
    "updated_at": "2026-02-15T10:30:00Z",
    "member_count": 5,
    "members": [
      {
        "id": "b86d343e-87ea-408c-ab37-4ef97faf1553",
        "user_id": "3c095217-eb97-429b-bd11-1fa4be4f60c5",
        "username": "admin",
        "email": "admin@example.com",
        "full_name": "管理员",
        "avatar_url": null,
        "role": "owner",
        "joined_at": "2026-02-15T10:30:00Z"
      }
    ]
  }
}
```

### 4. 更新企业信息

更新企业基本信息（仅企业所有者和管理员可操作）。

- **URL**: `PUT /enterprises/{enterprise_id}`
- **路径参数**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| enterprise_id | string | 是 | 企业ID（UUID格式） |

- **请求体参数**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 否 | 企业名称（2-100字符） |
| description | string | 否 | 企业描述 |
| logo_url | string | 否 | 企业Logo URL |
| website | string | 否 | 企业官网 |
| contact_email | string | 否 | 联系邮箱 |
| address | string | 否 | 企业地址 |

- **请求示例**:
```json
{
  "name": "创新科技有限公司（新名称）",
  "description": "更新后的企业描述",
  "address": "北京市朝阳区新地址1001室"
}
```

- **响应示例**:
```json
{
  "code": "SUCCESS",
  "message": "企业信息更新成功",
  "data": {
    "id": "bd7eea58-8f9b-444d-8104-b819b17d6f84",
    "name": "创新科技有限公司（新名称）",
    "description": "更新后的企业描述",
    "logo_url": "https://example.com/logo.png",
    "website": "https://example.com",
    "contact_email": "contact@example.com",
    "address": "北京市朝阳区新地址1001室",
    "wallet_address": null,
    "is_active": true,
    "is_verified": false,
    "created_at": "2026-02-15T10:30:00Z",
    "updated_at": "2026-02-15T12:00:00Z",
    "member_count": 5,
    "members": [...]
  }
}
```

### 5. 删除企业

删除企业（仅企业所有者可操作，将同时删除所有成员关系）。

- **URL**: `DELETE /enterprises/{enterprise_id}`
- **路径参数**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| enterprise_id | string | 是 | 企业ID（UUID格式） |

- **请求示例**:
```
DELETE /api/v1/enterprises/bd7eea58-8f9b-444d-8104-b819b17d6f84
```

- **响应示例**:
```json
{
  "code": "SUCCESS",
  "message": "企业已成功删除",
  "data": {}
}
```

## 成员管理接口

### 6. 获取企业成员列表

获取指定企业的所有成员列表。

- **URL**: `GET /enterprises/{enterprise_id}/members`
- **路径参数**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| enterprise_id | string | 是 | 企业ID（UUID格式） |

- **请求示例**:
```
GET /api/v1/enterprises/bd7eea58-8f9b-444d-8104-b819b17d6f84/members
```

- **响应示例**:
```json
{
  "code": "SUCCESS",
  "message": "获取成员列表成功",
  "data": [
    {
      "id": "b86d343e-87ea-408c-ab37-4ef97faf1553",
      "user_id": "3c095217-eb97-429b-bd11-1fa4be4f60c5",
      "username": "admin",
      "email": "admin@example.com",
      "full_name": "管理员",
      "avatar_url": null,
      "role": "owner",
      "joined_at": "2026-02-15T10:30:00Z"
    },
    {
      "id": "c92f456d-98fb-519d-bc48-2ea8cgf16664",
      "user_id": "4d1a6328-fc08-53ac-ce22-2gb5cf571d6",
      "username": "member1",
      "email": "member1@example.com",
      "full_name": "张三",
      "avatar_url": null,
      "role": "member",
      "joined_at": "2026-02-15T11:00:00Z"
    }
  ]
}
```

### 7. 邀请成员加入企业

邀请用户加入企业，可指定成员角色（仅企业所有者和管理员可操作）。

- **URL**: `POST /enterprises/{enterprise_id}/members`
- **路径参数**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| enterprise_id | string | 是 | 企业ID（UUID格式） |

- **请求体参数**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| user_id | string | 是 | 被邀请用户的ID |
| role | string | 否 | 成员角色（admin/member/viewer），默认member |

- **请求示例**:
```json
{
  "user_id": "4d1a6328-fc08-53ac-ce22-2gb5cf571d6",
  "role": "admin"
}
```

- **响应示例**:
```json
{
  "code": "SUCCESS",
  "message": "成员邀请成功",
  "data": {
    "id": "d03e567e-09gc-620e-cd59-3fb9dgh27775",
    "user_id": "4d1a6328-fc08-53ac-ce22-2gb5cf571d6",
    "username": "member1",
    "email": "member1@example.com",
    "full_name": "张三",
    "avatar_url": null,
    "role": "admin",
    "joined_at": "2026-02-15T12:30:00Z"
  }
}
```

### 8. 更新成员角色

更新企业成员的角色（仅企业所有者和管理员可操作，不能更改所有者角色）。

- **URL**: `PUT /enterprises/{enterprise_id}/members/{user_id}`
- **路径参数**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| enterprise_id | string | 是 | 企业ID（UUID格式） |
| user_id | string | 是 | 目标成员的用户ID |

- **请求体参数**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| role | string | 是 | 新的成员角色（admin/member/viewer） |

- **请求示例**:
```json
{
  "role": "member"
}
```

- **响应示例**:
```json
{
  "code": "SUCCESS",
  "message": "成员角色更新成功",
  "data": {
    "id": "d03e567e-09gc-620e-cd59-3fb9dgh27775",
    "user_id": "4d1a6328-fc08-53ac-ce22-2gb5cf571d6",
    "username": "member1",
    "email": "member1@example.com",
    "full_name": "张三",
    "avatar_url": null,
    "role": "member",
    "joined_at": "2026-02-15T12:30:00Z"
  }
}
```

### 9. 移除企业成员

从企业中移除指定成员（企业所有者不能被移除，成员可以自己退出）。

- **URL**: `DELETE /enterprises/{enterprise_id}/members/{user_id}`
- **路径参数**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| enterprise_id | string | 是 | 企业ID（UUID格式） |
| user_id | string | 是 | 目标成员的用户ID |

- **请求示例**:
```
DELETE /api/v1/enterprises/bd7eea58-8f9b-444d-8104-b819b17d6f84/members/4d1a6328-fc08-53ac-ce22-2gb5cf571d6
```

- **响应示例**:
```json
{
  "code": "SUCCESS",
  "message": "成员已成功移除",
  "data": {}
}
```

## 错误码说明

| 错误码 | 说明 |
|--------|------|
| SUCCESS | 操作成功 |
| ENTERPRISE_NOT_FOUND | 企业不存在 |
| PERMISSION_DENIED | 权限不足 |
| MEMBER_EXISTS | 该用户已是企业成员 |
| MEMBER_NOT_FOUND | 成员不存在 |
| CANNOT_REMOVE_OWNER | 不能移除企业所有者 |
| USER_NOT_FOUND | 用户不存在 |

## 成员角色说明

| 角色 | 权限说明 |
|------|----------|
| owner | 所有者，拥有最高权限（创建企业时自动分配，唯一，不可删除） |
| admin | 管理员，可以管理日常运营（邀请成员、更新信息、移除成员等） |
| member | 普通成员，可以参与协作 |
| viewer | 观察者，只能查看信息 |

## 数据模型

### Enterprise (企业)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 企业唯一标识符（UUID） |
| name | string | 企业名称 |
| description | string | 企业描述 |
| logo_url | string | 企业Logo URL |
| website | string | 企业官网 |
| contact_email | string | 联系邮箱 |
| address | string | 企业地址 |
| wallet_address | string | 企业钱包地址（区块链地址） |
| is_active | boolean | 企业是否激活 |
| is_verified | boolean | 企业是否已认证 |
| created_at | string | 创建时间（ISO 8601格式） |
| updated_at | string | 更新时间（ISO 8601格式） |
| member_count | integer | 成员数量 |
| members | array | 成员列表（仅在详情接口返回） |

### Member (成员)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 成员关系ID |
| user_id | string | 用户ID |
| username | string | 用户名 |
| email | string | 邮箱 |
| full_name | string | 用户全名 |
| avatar_url | string | 头像URL |
| role | string | 角色（owner/admin/member/viewer） |
| joined_at | string | 加入时间 |

---

**文档版本**: 1.0  
**最后更新**: 2026-02-15
