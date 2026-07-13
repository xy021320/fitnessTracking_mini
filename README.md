# 铸力 · 健身记录小程序

面向规律力量训练者的健身记录应用，包含 React Web 原型与 Taro 微信小程序版本。

## 主要功能

- 首页快速开始今日训练并查看近期进度。
- 支持杠铃、哑铃、跳绳、跑步、平板支撑等项目。
- 自定义项目可自由组合重量、次数、组数、时长和距离。
- 完成训练后自动生成训练量、距离、时长、配速和项目表现统计。
- 微信小程序使用设备本地存储，无需服务器即可运行。

## 项目目录

- `src/`：React/Vite Web 设计原型。
- `miniapp/`：Taro 4.2.0 微信小程序源码。
- `docs/`：产品设计与实现计划。
- `docs/images/prototypes/`：原型截图与视觉对比图。

## 微信小程序运行

进入 `miniapp` 安装依赖并构建：

```bash
cd miniapp
npm install
npm run build:weapp
```

随后在微信开发者工具中导入 `miniapp/` 目录。项目已配置 AppID `wxcbad07e3fb2b6b8e`，点击“预览”即可生成手机扫码二维码。

完整说明见 [`miniapp/README.md`](miniapp/README.md)。

## Web 原型运行

```bash
npm install
npm run dev
```

## 验证

Web 与微信小程序分别提供自动测试：

```bash
npm test
cd miniapp && npm test
```
