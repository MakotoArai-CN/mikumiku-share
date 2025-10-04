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
}