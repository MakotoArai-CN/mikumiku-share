import { ConfigManager } from '../core/ConfigManager';
import { IConfig } from '../types';
import { LanPanel } from './LanPanel';
import { LanSharer } from '../core/LanSharer';
import { showToast } from './Toast';
import { Logger } from "../core/Logger";

export class SettingsPanel {
    private shadowRoot: ShadowRoot;
    private configManager: ConfigManager;
    private overlayElement: HTMLElement | null = null;
    private panelElement: HTMLElement | null = null;
    private lanPanel: LanPanel;
    private lanSharer: LanSharer;
    private Logger = Logger;

    constructor(shadowRoot: ShadowRoot, configManager: ConfigManager) {
        this.shadowRoot = shadowRoot;
        this.configManager = configManager;
        // 实例化 LanSharer 和 LanPanel
        const config = this.configManager.get();
        this.lanSharer = new LanSharer(config);
        this.lanPanel = new LanPanel(this.shadowRoot, config, this.lanSharer);
    }

    public getLanSharer(): LanSharer {
        return this.lanSharer;
    }

    public init() {
        this.overlayElement = document.createElement('div');
        this.overlayElement.className = 'mms-settings-overlay';
        this.overlayElement.addEventListener('click', (e) => {
            if (e.target === this.overlayElement) this.hide();
        });

        this.panelElement = document.createElement('div');
        this.panelElement.className = 'mms-settings-panel';

        this.overlayElement.appendChild(this.panelElement);
        this.shadowRoot.appendChild(this.overlayElement);
    }

    public toggleVisibility() {
        if (this.overlayElement?.classList.contains('visible')) this.hide();
        else this.show();
    }

    public show() {
        this.render();
        this.overlayElement?.classList.add('visible');
    }

    public hide() {
        this.overlayElement?.classList.remove('visible');
    }

    private render() {
        if (!this.panelElement) return;

        const config = this.configManager.get();
        this.panelElement.innerHTML = `
            <h2>MikuShare设置</h2>
            <div class="content">
                <div class="form-group">
                    <button id="mms-manage-lan-btn" class="action-button">管理局域网设备</button>
                </div>
                <div class="form-group">
                    ${this.createSwitch('master-switch', '总开关', config.enabled)}
                </div>
                <div class="form-group">
                    ${this.createSwitch('hover-switch', '鼠标悬浮显示二维码', config.showOnHover)}
                </div>
                <div class="form-group">
                    <label for="mms-hover-delay">悬浮显示延迟 (毫秒)</label>
                    <input type="number" id="mms-hover-delay" value="${config.hoverDelay}" min="0" max="5000" step="100">
                </div>
                <div class="form-group">
                    <label for="mms-qr-size">二维码大小 (像素)</label>
                    <input type="number" id="mms-qr-size" value="${config.qrCodeSize}" min="100" max="500" step="10">
                </div>
                <div class="form-group">
                    ${this.createSwitch('lan-switch', '启用局域网分享', config.enableLAN)}
                </div>
                <div class="form-group">
                    ${this.createSwitch('auto-resolve-switch', '链接净化', config.autoResolveRedirect)}
                    <p style="font-size: 12px; color: #666; margin-top: 4px; margin-bottom: 0;">
                        自动识别并解析知乎、CSDN等网站的跳转链接，直接显示真实URL的二维码
                    </p>
                </div>
                <div class="form-group">
                    <label for="mms-position-select">二维码显示位置</label>
                    <select id="mms-position-select">
                        <option value="mouse" ${config.qrCodePosition === 'mouse' ? 'selected' : ''}>跟随鼠标</option>
                        <option value="fixed" ${config.qrCodePosition === 'fixed' ? 'selected' : ''}>固定位置</option>
                    </select>
                </div>
                <div class="form-group" id="fixed-position-group" style="${config.qrCodePosition === 'fixed' ? '' : 'display:none'}">
                    <label for="mms-fixed-position">固定位置</label>
                    <select id="mms-fixed-position">
                        <option value="top-left" ${config.fixedPosition === 'top-left' ? 'selected' : ''}>左上角</option>
                        <option value="top-right" ${config.fixedPosition === 'top-right' ? 'selected' : ''}>右上角</option>
                        <option value="bottom-left" ${config.fixedPosition === 'bottom-left' ? 'selected' : ''}>左下角</option>
                        <option value="bottom-right" ${config.fixedPosition === 'bottom-right' ? 'selected' : ''}>右下角</option>
                    </select>
                </div>
                <div class="form-group" id="fixed-offset-group" style="${config.qrCodePosition === 'fixed' ? '' : 'display:none'}">
                    <label>固定位置偏移量</label>
                    <div style="display: flex; gap: 10px;">
                        <input type="number" id="mms-offset-x" placeholder="X偏移" value="${config.fixedOffset.x}" min="0" max="200" style="flex: 1;">
                        <input type="number" id="mms-offset-y" placeholder="Y偏移" value="${config.fixedOffset.y}" min="0" max="200" style="flex: 1;">
                    </div>
                </div>
                <div class="form-group">
                    <label for="mms-blacklist">黑名单 (每行一个)</label>
                    <textarea id="mms-blacklist" rows="3">${config.blacklist.join('\n')}</textarea>
                </div>
                <div class="form-group">
                    <label for="mms-whitelist">白名单 (填写后, 仅在这些网站生效)</label>
                    <textarea id="mms-whitelist" rows="3">${config.whitelist.join('\n')}</textarea>
                </div>
            </div>
            <div class="footer">
                <button id="mms-save-btn" class="save">保存设置</button>
            </div>
        `;
        this.attachEventListeners();
    }

    private createSwitch(id: string, label: string, isChecked: boolean): string {
        return `
            <div class="switch">
                <span class="switch-label" id="${id}-label">${label}</span>
                <label class="switch-control" for="${id}">
                    <input type="checkbox" id="${id}" aria-labelledby="${id}-label" ${isChecked ? 'checked' : ''}>
                    <span class="slider"></span>
                </label>
            </div>
        `;
    }

    private attachEventListeners() {
        this.panelElement?.querySelector('#mms-save-btn')?.addEventListener('click', this.saveConfig.bind(this));
        this.panelElement?.querySelector('#mms-manage-lan-btn')?.addEventListener('click', () => {
            this.lanPanel.show();
        });
        
        // 显示/隐藏固定位置选项
        const positionSelect = this.panelElement?.querySelector('#mms-position-select') as HTMLSelectElement;
        const fixedPositionGroup = this.panelElement?.querySelector('#fixed-position-group') as HTMLElement;
        const fixedOffsetGroup = this.panelElement?.querySelector('#fixed-offset-group') as HTMLElement;
        
        positionSelect?.addEventListener('change', () => {
            const isFixed = positionSelect.value === 'fixed';
            if (fixedPositionGroup) fixedPositionGroup.style.display = isFixed ? '' : 'none';
            if (fixedOffsetGroup) fixedOffsetGroup.style.display = isFixed ? '' : 'none';
        });
    }

    private async saveConfig() {
        if (!this.panelElement) return;

        try {
            const newConfig: Partial<IConfig> = {
                enabled: (this.panelElement.querySelector('#master-switch') as HTMLInputElement).checked,
                showOnHover: (this.panelElement.querySelector('#hover-switch') as HTMLInputElement).checked,
                hoverDelay: parseInt((this.panelElement.querySelector('#mms-hover-delay') as HTMLInputElement).value) || 300,
                qrCodeSize: parseInt((this.panelElement.querySelector('#mms-qr-size') as HTMLInputElement).value) || 160,
                enableLAN: (this.panelElement.querySelector('#lan-switch') as HTMLInputElement).checked,
                autoResolveRedirect: (this.panelElement.querySelector('#auto-resolve-switch') as HTMLInputElement).checked,
                qrCodePosition: (this.panelElement.querySelector('#mms-position-select') as HTMLSelectElement).value as 'mouse' | 'fixed',
                fixedPosition: (this.panelElement.querySelector('#mms-fixed-position') as HTMLSelectElement)?.value as any || 'top-right',
                fixedOffset: {
                    x: parseInt((this.panelElement.querySelector('#mms-offset-x') as HTMLInputElement)?.value) || 20,
                    y: parseInt((this.panelElement.querySelector('#mms-offset-y') as HTMLInputElement)?.value) || 20
                },
                blacklist: (this.panelElement.querySelector('#mms-blacklist') as HTMLTextAreaElement).value.split('\n').map(d => d.trim()).filter(Boolean),
                whitelist: (this.panelElement.querySelector('#mms-whitelist') as HTMLTextAreaElement).value.split('\n').map(d => d.trim()).filter(Boolean),
            };

            await this.configManager.set(newConfig);
            showToast(this.shadowRoot, '设置已保存', 'success');

            // 延迟关闭面板，让用户看到提示
            setTimeout(() => {
                this.hide();
            }, 500);

        } catch (error) {
            showToast(this.shadowRoot, '保存失败，请重试', 'error');
            this.Logger.error('保存配置失败:', error);
        }
    }
}