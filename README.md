# 🚀 MikuMiku-share - 链接转为二维码

一个功能强大的油猴脚本，把鼠标可以点击的链接转为二维码。

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

>使用脚本猫时，配合脚本猫的vscode扩展[CodFrm.scriptcat-vscode](https://marketplace.visualstudio.com/items?itemName=CodFrm.scriptcat-vscode),可以实时预览效果。无需启动开发服务器，直接使用 `bun build` 命令即可。

### 3. 构建

```bash
# 执行构建命令
bun build
```

构建成功后，会在 `dist` 目录下生成最终的 `mikumiku-share.js` 文件。您可以将此文件拖拽到浏览器中进行安装。

## Todolist

- [ ] 二维码居中
- [ ] 修复局域网服务器
- [x] 新增链接过滤，把某些网站的转内链的链接过滤掉，直接跳转真实链接，example:`https://www.******.top/share/?url=https://www.******.com`，直接跳转真实链接。部分加密/转为杂乱字符串的解析出真实链接。
- [ ] 优化二维码浮窗显示逻辑
- [ ] 支持自定义二维码样式
- [x] 支持自定义二维码显示位置
- [ ] 发布到油猴[Tampermonkey](https://www.tampermonkey.net/)市场、脚本猫[ScriptCat](https://scriptcat.org/)市场。

## 更新日志

- 1.2.0
  - 新增链接过滤功能，把某些网站的转内链的链接过滤掉，直接跳转真实链接。

- 1.1.0
  - 新增自定义二维码显示位置功能。
  - 新增二维码浮窗拖拽功能

- 1.0.0
  - 初始版本，支持链接悬浮二维码和局域网分享功能。

## License

本项目采用 [APGL3.0 License](LICENSE) 许可证。

## 感谢

- [Tampermonkey](https://www.tampermonkey.net/)
- [ScriptCat](https://scriptcat.org/)
- [Bun.js](https://bun.sh/)
- [Vite.js](https://vitejs.dev/)
- [qrious](https://github.com/neocotic/qrious)
- [WebRTC](https://webrtc.org/)
- [AutoRedirector](https://github.com/galaxy-sea/AutoRedirector)
