/// <reference types="greasemonkey" />

// 声明 Greasemonkey API 类型
declare const GM_getValue: (key: string, defaultValue?: any) => Promise<any>;
declare const GM_setValue: (key: string, value: any) => Promise<void>;
declare const GM_registerMenuCommand: typeof GM.registerMenuCommand;
declare const GM_addStyle: typeof GM.addStyle;
declare const GM_xmlhttpRequest: typeof GM.xmlhttpRequest;
declare const GM_openInTab: (url: string, options?: {
    active?: boolean;
    insert?: boolean;
    setParent?: boolean;
}) => void;

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

// jsqr 模块声明
declare module 'jsqr' {
    interface QRCode {
        binaryData: number[];
        data: string;
        chunks: any[];
        location: {
            topRightCorner: { x: number; y: number };
            topLeftCorner: { x: number; y: number };
            bottomRightCorner: { x: number; y: number };
            bottomLeftCorner: { x: number; y: number };
        };
    }

    interface Options {
        inversionAttempts?: 'dontInvert' | 'onlyInvert' | 'attemptBoth' | 'invertFirst';
    }

    function jsQR(
        data: Uint8ClampedArray,
        width: number,
        height: number,
        options?: Options
    ): QRCode | null;

    export default jsQR;
}