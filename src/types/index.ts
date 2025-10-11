export interface IConfig {
    enabled: boolean;
    showOnHover: boolean;
    hoverDelay: number;
    qrCodePosition: 'mouse' | 'fixed';
    fixedPosition: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    fixedOffset: { x: number; y: number };
    qrCodeSize: number;
    enableLAN: boolean;
    autoResolveRedirect: boolean;
    blacklist: string[];
    whitelist: string[];
    deviceId: string;
    qrCodeAutoHide: boolean; // 是否自动隐藏二维码
    qrCodeHideDelay: number; // 自动隐藏延迟（毫秒），0表示永不隐藏
    qrCodeHideTrigger: 'onLinkLeave' | 'global'; // 自动隐藏触发条件：鼠标置于链接时开始计时 或 全局计时
    enableDragging: boolean; // 是否允许拖拽二维码面板
    qrCodeStyle: {
        mode: 'auto' | 'light' | 'dark' | 'custom'; // 二维码样式模式
        background: string; // 背景色
        foreground: string; // 前景色
        backgroundAlpha: number; // 背景透明度
        foregroundAlpha: number; // 前景透明度
    };
    enableQRRecognition: boolean; // 是否启用二维码识别
    qrRecognitionAction: 'copy' | 'copyWithToast' | 'copyAndOpen' | 'silentOpen'; // 识别后的动作
    qrRecognitionDelay: number; // 识别延迟（毫秒）
    enableCopyPurify: boolean; // 是否启用复制净化
    copyPurifyDomains: string[]; // 需要净化的域名列表
    enableSelectionUnlock: boolean; // 是否启用选择解锁
    useGMOpenTab?: boolean; // 是否使用油猴API打开链接
}