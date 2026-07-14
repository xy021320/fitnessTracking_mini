# 铸力微信登录与云端数据设计说明

## 目标

将微信小程序从演示数据和纯本地存储升级为微信身份隔离的真实数据应用。使用微信原生云开发提供身份、文档型数据库、云函数和头像存储，不部署自建服务器。首期面向开发者本人和少量体验成员，不正式发布。

## 已确认决策

- 使用 Taro 的 `Taro.cloud` 接入微信原生云开发。
- 云端从空数据开始，不上传现有演示数据。
- 登录身份由微信云开发自动建立，用户无需账号密码。
- 昵称和头像是可选资料；拒绝授权不影响训练记录功能。
- 云端为登录后的主数据源，本地缓存负责启动速度、训练草稿和离线重试。
- 首次使用个人版免费试用 1 个月，关闭自动续费并设置用量提醒；试用到期后不付费时继续保留本地记录和待同步队列。
- 不接入独立 CloudBase Auth SDK、Supabase、自建 API 服务器或云托管。

## 运行配置

- 小程序 AppID：`wxcbad07e3fb2b6b8e`。
- 云环境使用微信开发者工具当前与 AppID 关联的默认环境，不把机器专属环境 ID 写入仓库。
- 应用启动调用 `Taro.cloud.init({ traceUser: true })`。
- 不在前端、仓库或环境文件中保存 AppSecret。
- 微信开发者工具生成的 `project.private.config.json` 仅用于本机，不提交仓库。

## 登录流程

1. 应用启动后初始化微信云开发。
2. 未确认进入应用时显示登录页，包含产品说明和“微信登录”主按钮。
3. 用户点击按钮后调用 `bootstrapUser` 云函数。
4. 云函数通过运行上下文获取 `OPENID`，在 `users` 集合创建或更新当前用户记录，并返回不含 OpenID 的公开资料。
5. 前端保存登录态和用户文档 ID，加载该用户的项目、偏好与训练记录。
6. 用户未设置资料时使用默认昵称“微信用户”和本地默认头像。
7. 用户可在“我的”页面选择头像、输入昵称；头像压缩后上传云存储，资料写入 `users`。

微信身份认证与资料授权相互独立。用户拒绝头像或昵称授权后仍保持登录状态。

## 数据集合

### users

- `_id: string`
- `_openid: string`
- `nickname: string`
- `avatarFileId: string | null`
- `preferences: { weeklyGoal: number; weightUnit: 'kg'; distanceUnit: 'km' }`
- `createdAt: Date`
- `updatedAt: Date`
- `lastLoginAt: Date`
- `schemaVersion: 1`

### exercise_library

- `_id: string`
- `_openid: string`
- `clientExerciseId: string`
- `name: string`
- `category: string`
- `metrics: MetricKey[]`
- `custom: boolean`
- `createdAt: Date`
- `updatedAt: Date`
- `deletedAt: Date | null`
- `schemaVersion: 1`

### workout_sessions

- `_id: string`
- `_openid: string`
- `clientSessionId: string`
- `date: string`
- `duration: number`
- `entries: WorkoutEntry[]`
- `summary: { totalVolume: number; totalDistance: number; totalReps: number; completedSets: number }`
- `createdAt: Date`
- `updatedAt: Date`
- `deletedAt: Date | null`
- `schemaVersion: 1`

所有历史训练条目保存项目快照。项目库删除使用 `deletedAt` 软删除，不影响历史记录。

## 数据安全

三个集合默认拒绝公开读取，使用文档级安全规则限制为创建者本人：

```json
{
  "read": "doc._openid == auth.openid",
  "write": "doc._openid == auth.openid"
}
```

客户端查询必须包含 `_openid: '{openid}'` 条件。`bootstrapUser` 使用可信云函数运行上下文写入 `_openid`，前端不接受或传递任意用户 ID。头像存储路径以用户身份隔离，并使用仅创建者可读写规则。

## 客户端模块

- `cloud/config`：云环境解析与初始化。
- `cloud/repository`：资料、项目和训练记录的数据库接口。
- `cloud/mappers`：数据库文档与现有领域模型互转。
- `cloud/sync-engine`：增量拉取、待同步队列、去重与重试。
- `auth/auth-store`：初始化、登录、资料与错误状态。
- `store/app-store`：继续负责训练交互状态，通过 repository 和 sync-engine 与云端通信。

页面不直接调用数据库，避免云端字段和 UI 耦合。

## 数据同步

- 未登录：不加载演示 session，显示登录页。
- 首次登录：云端无记录时进入真实空状态，预设训练项目可以作为本地模板使用，但不计入历史统计。
- 普通启动：先显示已登录用户的本地缓存，再以 `updatedAt > lastSyncAt` 增量拉取云端变化。
- 训练编辑：只更新本地草稿，不产生云端请求。
- 完成训练：立即保存 session；失败时写入 `pendingSync`。
- 项目和偏好：用户确认保存时写入云端；失败时保留本地并进入队列。
- 网络恢复或下次启动：按创建顺序重试队列。
- session 使用 `clientSessionId` 去重；项目使用 `clientExerciseId` 去重。
- 历史 session 视为不可变快照；项目与偏好以 `updatedAt` 最后写入为准。
- 本地缓存按用户身份分键，退出或切换微信身份时不串用数据。

## 查询与额度控制

- 训练历史每页 20 条，按日期和更新时间倒序。
- 首次同步分页加载，后续只拉取增量。
- session 保存 `summary`，数据页优先使用现有摘要，不调用云端聚合。
- 输入过程不访问云端；完成训练才写一次主记录。
- `bootstrapUser` 每次冷启动最多调用一次。
- 头像只在用户主动更换时上传。
- 免费环境不开启按量付费，超额后保留本地和待同步队列。

## 界面变化

### 登录页

- 延续近黑背景和青柠品牌色。
- 显示产品名、训练数据云端保存说明、隐私说明和“微信登录”。
- 初始化中、失败重试和登录中均有明确状态。

### 首页

- 无训练时展示“开始第一次训练”，不展示种子历史。
- 云同步失败时显示非阻塞状态提示。

### 我的

- 展示微信用户资料和同步状态。
- 支持选择头像、输入昵称、修改偏好。
- 展示“数据仅本人可见”和最近同步时间。

## 错误处理

- 云初始化失败：停留在可重试错误页。
- `bootstrapUser` 失败：不进入业务页面，不写入演示数据。
- 拉取失败：使用同一用户的缓存并显示离线状态。
- 写入失败：业务操作成功保留在本地，进入待同步队列。
- 重复写入：以客户端 ID 查询后更新或跳过。
- 数据格式无效：忽略单条异常记录并记录日志，不覆盖有效缓存。
- 免费额度耗尽：停止自动高频重试，保留数据并提示稍后同步。
- 头像上传失败：保留原头像和昵称，不影响训练数据。

## 云端资源

- 一个微信云开发个人版环境；首次使用按当前官方政策可免费试用 1 个月，之后是否付费由用户决定。
- 三个数据库集合：`users`、`exercise_library`、`workout_sessions`。
- 一个云函数：`bootstrapUser`，Node.js 运行时，3 秒以内完成。
- 一个头像目录：`avatars/{openid-hash}/`，不在公开 URL 中暴露 OpenID。
- 两个组合索引：训练记录 `_openid + updatedAt`，项目 `_openid + updatedAt`。

## 测试与验收

- 登录状态机覆盖初始化、首次登录、已有用户、失败重试。
- repository 使用适配器测试查询条件、分页、软删除和去重。
- sync-engine 覆盖离线入队、重试成功、重复 session 和用户缓存隔离。
- 云函数测试确认忽略客户端用户 ID，只使用可信上下文 OPENID。
- 两个不同微信测试账号无法互相读取数据。
- 同一微信在重新打开和更换手机后可以恢复云端记录。
- 断网完成训练后记录不丢失，恢复网络后只生成一条 session。
- 首次云端为空时不出现演示训练和假统计。
- 完整测试与 `npm run build:weapp` 通过。

## 明确不做

- 正式发布、审核、微信支付和手机号登录。
- 独立 Web 端账号与小程序账号合并。
- 管理后台、多人共享训练、排行榜和社交功能。
- 自建服务器、云托管、定时任务和复杂云端统计。
