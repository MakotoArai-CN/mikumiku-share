import { IConfig } from "../types";
import { Logger } from "./Logger";

export const DEFAULT_CONFIG: IConfig = {
    enabled: true,
    showOnHover: true,
    hoverDelay: 300,
    qrCodePosition: 'mouse',
    fixedPosition: 'top-right',
    fixedOffset: { x: 20, y: 20 },
    qrCodeSize: 160,
    enableLAN: false,
    autoResolveRedirect: true,
    blacklist: ['example.com'],
    whitelist: [],
    deviceId: 'mms-' + Math.random().toString(36).substring(2, 10),
};

export class ConfigManager {
    private config: IConfig;
    private listeners: ((config: IConfig) => void)[] = [];

    constructor(defaultConfig: IConfig) {
        this.config = { ...defaultConfig };
    }

    public async init(): Promise<void> {
        const loadedConfig = await this.load();
        this.config = { ...this.config, ...loadedConfig };
    }

    public get(): IConfig {
        return this.config;
    }

    public async set(newConfig: Partial<IConfig>): Promise<void> {
        this.config = { ...this.config, ...newConfig };
        await this.save();
        this.notify();
    }

    public async reset(): Promise<void> {
        this.config = DEFAULT_CONFIG;
        await this.save();
        this.notify();
    }

    private async load(): Promise<Partial<IConfig>> {
        try {
            const storedConfig = await GM_getValue('miku-share-config', '{}');
            return JSON.parse(storedConfig);
        } catch (e) {
            Logger.error("Failed to load config", e);
            return {};
        }
    }

    private async save(): Promise<void> {
        try {
            await GM_setValue('miku-share-config', JSON.stringify(this.config));
        } catch (e) {
            Logger.error("Failed to save config", e);
        }
    }

    public subscribe(listener: (config: IConfig) => void): void {
        this.listeners.push(listener);
    }

    private notify(): void {
        this.listeners.forEach(listener => listener(this.config));
    }
}