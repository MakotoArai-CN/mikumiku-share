// src/main.ts

import { StyleManager } from './core/StyleManager';
import { ConfigManager, DEFAULT_CONFIG } from './core/ConfigManager';
import { DOMObserver } from './core/DOMObserver';
import { SettingsPanel } from './ui/SettingsPanel';
import { Logger } from './core/Logger';

// --- 初始化程序 --- //
(async function() {
    'use strict';

    // 1. 安全检查：确保脚本只在最顶层窗口运行，避免在iframe中执行
    if (window.self !== window.top) {
        Logger.log("脚本在iframe中，已停止执行。");
        return;
    }

    Logger.log("脚本开始初始化...");

    // 2. 加载用户配置
    const configManager = new ConfigManager(DEFAULT_CONFIG);
    await configManager.init(); // 异步初始化配置

    // 3. 创建UI根容器并注入样式
    // 使用Shadow DOM来确保样式隔离
    const shadowHost = document.createElement('div');
    shadowHost.id = 'miku-share-host';
    document.body.appendChild(shadowHost);
    const shadowRoot = shadowHost.attachShadow({ mode: 'open' });
    
    const styleManager = new StyleManager(shadowRoot);
    styleManager.injectStyles();

    // 4. 初始化UI组件
    // SettingsPanel内部会创建和管理LanSharer和LanPanel
    const settingsPanel = new SettingsPanel(shadowRoot, configManager);
    settingsPanel.init();
    
    // 从SettingsPanel获取共享的LanSharer实例
    const lanSharer = settingsPanel.getLanSharer();

    // 5. 注册油猴菜单命令
    GM_registerMenuCommand("⚙️ 打开MikuShare设置", () => {
        settingsPanel.toggleVisibility();
    });

    // 6. 启动核心功能：DOM观察器
    // 将共享的lanSharer实例传递给DOM观察器，以便它能进一步传递给QRCodePannel
    const domObserver = new DOMObserver(shadowRoot, configManager, lanSharer);
    domObserver.observe();

    Logger.log("脚本初始化完成。");
})();