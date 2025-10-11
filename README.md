# 🚀 MikuMiku-share - 链接转为二维码

一个功能强大的脚本，把鼠标可以点击的链接转为二维码。

## ✨ 功能

- **链接悬浮二维码**: 鼠标悬停在任何链接上时，显示该链接的二维码，方便手机扫描。
- **局域网分享**(实验性): 扫描局域网内的其他安装了MikuMiku-share的设备，一键将链接发送到指定设备上直接打开。
- **高度可定制**:
  - 黑/白名单设置，控制脚本在哪些网站上启用。
  - 二维码显示位置可调（鼠标附近或固定位置）。
  - 主要功能均可独立开关。
- **现代化UI**: 现代化的UI设计和优雅的过渡动画，使用Shadow DOM隔离样式，避免与主站冲突。

## 🛠️ 技术栈

- **运行时**: Bun.js
- **语言**: TypeScript
- **打包工具**: Vite.js + vite-plugin-monkey
- **二维码**: qrious
- **通信**: WebRTC ，websockets (局域网)

## 📦 安装与使用

### 1. 环境准备

- 安装 [Tampermonkey](https://www.tampermonkey.net/) 浏览器扩展。
- 无法使用**Tampermonkey**的用户安装[脚本猫](https://scriptcat.org/)浏览器扩展。
- 安装 [Bun.js](https://bun.sh/) 作为项目开发环境。

### 2. 开发

```bash
# 克隆或下载项目后，进入项目目录
cd mikumiku-share

# 安装依赖
bun install

# 启动开发服务器
bun dev
```

开发服务器启动后，会自动在Tampermonkey中安装一个开发版本的脚本。刷新网页即可看到效果，修改代码后页面会自动更新。

>使用脚本猫时，配合脚本猫的vscode扩展[CodFrm.scriptcat-vscode](https://marketplace.visualstudio.com/items?itemName=CodFrm.scriptcat-vscode),可以实时预览效果。无需启动开发服务器，直接使用 `bun run build` 命令即可。

### 3. 构建

```bash
# 执行构建命令
bun run build
```

构建成功后，会在 `dist` 目录下生成最终的 `mikumiku-share.js` 文件。您可以将此文件拖拽到浏览器中进行安装。

###  4. 使用

脚本已发布到 [Tampermonkey](https://greasyfork.org) 和 [ScriptCat](https://scriptcat.org/) 市场中，您可以直接到市场搜索并安装。

>大陆用户点击[mikumiku-share](https://scriptcat.org/zh-CN/script-show-page/4361)，非大陆用户点击[mikumiku-share](https://greasyfork.org/zh-CN/scripts/552026-mikumiku-share)

1. 安装脚本后，刷新网页，即可看到链接悬浮二维码的效果，默认开启二维码生成，位置跟随鼠标，默认净化连接。

2. 设置：点击Tampermonkey/ScriptCat图标，选择MikuMiku-share，进入设置页面，可以设置黑/白名单，二维码显示位置，局域网分享开关，净化连接开关等。设置实时生效，无需刷新页面。

3. 删除：点击Tampermonkey/ScriptCat图标，选择MikuMiku-share，点击删除即可。

4. 修改：本项目使用Typescript开发，vite打包，发布版已经经过vite优化，无法直接修改，如需修改，请自行fork项目。

### 5. 已知bug

- 部分网站的二维码识别不正确
- 部分网站的链接净化失效，其他功能正常

不属于分享范围的功能，短时间内可能不考虑修复。

## Todolist

- [ ] 优化二维码识别功能（针对PC端），鼠标悬停在图片上方超过3S自动触发识别，识别成功后自动复制识别结果到剪贴板并弹出toast提示。
- [ ] 优化复制净化，某些网站复制分享连接时会自动添加用户ID等隐私，例如B**i，网某乐会在链接后面加入隐私相关参数（先生/小姐，你也不想被别人看见你的奇怪XP吧[bushi]。其实是用户画像，用于精准推送？）
- [x] 新增更多自定义选项
- [x] 修复局域网服务器
- [x] 优化二维码浮窗显示逻辑
- [x] 支持自定义二维码样式
- [x] 二维码居中
- [x] 新增链接过滤，把某些网站的转内链的链接过滤掉，直接跳转真实链接，example:`https://www.******.top/share/?url=https://www.******.com`，直接跳转真实链接。部分加密/转为杂乱字符串的解析出真实链接。
- [x] 支持自定义二维码显示位置
- [x] 发布到[Tampermonkey](https://www.tampermonkey.net/)市场、脚本猫[ScriptCat](https://scriptcat.org/)市场。

## 更新日志

> 版本号更新规则：主版本号.次版本号.修订号，版本号递增规则如下：
> 1. 主版本号：发生重大更新/重构时，主版本号递增
> 2. 次版本号：新增/修改功能时，次版本号递增
> 3. 修订号：修复bug时，修订号递增

- 1.3.0
  该版本新增功能不影响兼容性，标记为测试的功能在部分网站无法正常使用
 - 新增扫描二维码功能（测试），鼠标悬停在图片上方超过3S自动触发识别，识别成功后自动复制识别结果到剪贴板并弹出toast提示。
 - 新增复制净化功能，复制文字/链接时自动过滤小尾巴/隐私参数（测试）
 - 新增更多二维码浮窗配置项，详情可打开面板查看。

- 1.2.2
  - 修复部分二维码显示逻辑

- 1.2.1
  - 修复部分连接二维码不居中的问题。
  - 修复二维码没有占满浮窗的bug。
  - 发布到[Tampermonkey](https://www.tampermonkey.net/)市场、脚本猫[ScriptCat](https://scriptcat.org/)市场。

- 1.2.0
  - 新增链接过滤功能，把某些网站的转内链的链接过滤掉，直接跳转真实链接。

- 1.1.0
  - 新增自定义二维码显示位置功能。
  - 新增二维码浮窗拖拽功能

- 1.0.0
  - 初始版本，支持链接悬浮二维码和局域网分享功能。

## License

本项目采用 [APGL3.0 License](LICENSE) 许可证。

## Thanks

- [Tampermonkey](https://www.tampermonkey.net/)
- [Greasyfork](https://greasyfork.org)
- [ScriptCat](https://scriptcat.org/)
- [Bun.js](https://bun.sh/)
- [Vite.js](https://vitejs.dev/)
- [qrious](https://github.com/neocotic/qrious)
- [WebRTC](https://webrtc.org/)
- [AutoRedirector](https://github.com/galaxy-sea/AutoRedirector)
