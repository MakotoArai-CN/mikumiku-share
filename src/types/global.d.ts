/// <reference types="greasemonkey" />

// 确保 Greasemonkey API 在全局可用
declare const GM_getValue: (key: string, defaultValue?: any) => Promise<any>;
declare const GM_setValue: (key: string, value: any) => Promise<void>;
declare const GM_registerMenuCommand: typeof GM.registerMenuCommand;
declare const GM_addStyle: typeof GM.addStyle;
declare const GM_xmlhttpRequest: typeof GM.xmlhttpRequest;

// qrious 模块声明
declare module 'qrious' {
    export default class QRious {
        constructor(options?: QRiousOptions);
        element: HTMLCanvasElement;
        value: string;
        size: number;
        level: string;
    }

    interface QRiousOptions {
        element?: HTMLCanvasElement;
        value?: string;
        size?: number;
        level?: 'L' | 'M' | 'Q' | 'H';
        background?: string;
        backgroundAlpha?: number;
        foreground?: string;
        foregroundAlpha?: number;
        padding?: number;
    }
}