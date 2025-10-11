import { StyleManager } from './core/StyleManager';
import { ConfigManager, DEFAULT_CONFIG } from './core/ConfigManager';
import { DOMObserver } from './core/DOMObserver';
import { SettingsPanel } from './ui/SettingsPanel';
import { Logger } from './core/Logger';
import { QRCodeRecognizer } from './core/QRCodeRecognizer';
import { CopyPurifier } from './core/CopyPurifier';

// --- 初始化程序 --- //
(async function() {
    'use strict';

    // 安全检查：确保脚本只在最顶层窗口运行，避免在iframe中执行
    if (window.self !== window.top) {
        Logger.log("脚本在iframe中，已停止执行。");
        return;
    }

    Logger.log("脚本开始初始化...");

    // 加载用户配置
    const configManager = new ConfigManager(DEFAULT_CONFIG);
    await configManager.init(); // 异步初始化配置
    let config = configManager.get();

    // 创建UI根容器并注入样式
    // 使用Shadow DOM来确保样式隔离
    const shadowHost = document.createElement('div');
    shadowHost.id = 'miku-share-host';
    document.body.appendChild(shadowHost);
    const shadowRoot = shadowHost.attachShadow({ mode: 'open' });
    
    const styleManager = new StyleManager(shadowRoot);
    styleManager.injectStyles();

    // 初始化UI组件
    // SettingsPanel内部会创建和管理LanSharer和LanPanel
    const settingsPanel = new SettingsPanel(shadowRoot, configManager);
    settingsPanel.init();
    
    // 从SettingsPanel获取共享的LanSharer实例
    const lanSharer = settingsPanel.getLanSharer();

    // 初始化复制净化器
    let copyPurifier = new CopyPurifier(config);
    copyPurifier.init();

    // 初始化二维码识别器
    const qrRecognizer = new QRCodeRecognizer(shadowRoot);
    qrRecognizer.start(config.enableQRRecognition, config.qrRecognitionDelay, config.qrRecognitionAction);

    // 配置更新监听器 - 实时生效
    configManager.subscribe((newConfig) => {
        Logger.log('配置已更新，正在应用新设置...');
        
        // 更新配置引用
        config = newConfig;
        
        // 更新复制净化器
        copyPurifier.updateConfig(newConfig);
        
        // 更新二维码识别器配置
        qrRecognizer.updateConfig(
            newConfig.enableQRRecognition, 
            newConfig.qrRecognitionDelay, 
            newConfig.qrRecognitionAction
        );
        
        Logger.log('新设置已应用');
    });

    // 注册油猴菜单命令
    GM_registerMenuCommand("⚙️ 打开MikuShare设置", () => {
        settingsPanel.toggleVisibility();
    });

    // 启动核心功能：DOM观察器
    // 将共享的lanSharer实例传递给DOM观察器，以便它能进一步传递给QRCodePannel
    const domObserver = new DOMObserver(shadowRoot, configManager, lanSharer);
    domObserver.observe();

    // 页面卸载时清理
    window.addEventListener('beforeunload', () => {
        qrRecognizer.destroy();
        copyPurifier.destroy();
    });

    Logger.log("脚本初始化完成。");
})();