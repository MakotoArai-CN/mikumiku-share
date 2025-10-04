import { LanSharer, Peer } from "../core/LanSharer";
import { IConfig } from "../types";

export class LanPanel {
    private shadowRoot: ShadowRoot;
    private lanSharer: LanSharer;
    private config: IConfig;
    private overlayElement: HTMLElement | null = null;
    private panelElement: HTMLElement | null = null;

    constructor(shadowRoot: ShadowRoot, config: IConfig, lanSharer: LanSharer) {
        this.shadowRoot = shadowRoot;
        this.config = config;
        this.lanSharer = lanSharer;
    }

    public show() {
        if (!this.overlayElement) {
            this.create();
        }
        this.overlayElement!.classList.add('visible');
        this.lanSharer.onSignalingStateChange = this.updateSignalingStatus.bind(this);
        this.lanSharer.onPeersUpdate = this.renderDeviceList.bind(this);
        // 假设用户总是想在打开面板时开始连接
        this.lanSharer.connect('miku-share-default-network');
    }

    public hide() {
        this.overlayElement?.classList.remove('visible');
        this.lanSharer.disconnect();
    }
    
    private create() {
        this.overlayElement = document.createElement('div');
        this.overlayElement.className = 'mms-settings-overlay mms-lan-overlay';
        this.overlayElement.addEventListener('click', (e) => {
            if (e.target === this.overlayElement) this.hide();
        });

        this.panelElement = document.createElement('div');
        this.panelElement.className = 'mms-settings-panel mms-lan-panel';
        
        this.overlayElement.appendChild(this.panelElement);
        this.shadowRoot.appendChild(this.overlayElement);
        this.render();
    }

    private render() {
        if (!this.panelElement) return;
        this.panelElement.innerHTML = `
            <div class="header">
                <h2>局域网设备</h2>
                <div class="status" id="mms-lan-status">
                    <span class="dot"></span>
                    <span class="text">未连接</span>
                </div>
            </div>
            <div class="content">
                <div class="mms-lan-scanner">
                    <div class="mms-scan-wave"></div>
                    <div class="mms-scan-wave"></div>
                    <div class="mms-scan-wave"></div>
                    <div class="mms-device-icon" title="这是您自己的设备ID">
                        <svg viewBox="0 0 24 24"><path d="M12 12.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 1 0 0 7Z M18.5 10.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0Z M12 1.5a10.5 10.5 0 1 0 0 21 10.5 10.5 0 1 0 0-21Z"></path></svg>
                        <span>${this.config.deviceId}</span>
                    </div>
                </div>
                <div class="mms-device-list-container">
                    <h3>已发现的设备:</h3>
                    <ul class="mms-device-list" id="mms-device-list">
                        </ul>
                </div>
            </div>
        `;
    }
    
    private updateSignalingStatus(state: 'connecting' | 'connected' | 'disconnected') {
        const statusEl = this.shadowRoot.querySelector('#mms-lan-status');
        const scannerEl = this.shadowRoot.querySelector('.mms-lan-scanner');
        if (!statusEl || !scannerEl) return;

        const dot = statusEl.querySelector('.dot') as HTMLElement;
        const text = statusEl.querySelector('.text') as HTMLElement;

        dot.className = `dot ${state}`;
        scannerEl.classList.toggle('active', state === 'connected');
        
        switch (state) {
            case 'connecting': text.textContent = '连接中...'; break;
            case 'connected': text.textContent = '已连接，正在扫描'; break;
            case 'disconnected': text.textContent = '已断开'; break;
        }
    }

    private renderDeviceList(peers: Peer[]) {
        const listEl = this.shadowRoot.querySelector('#mms-device-list');
        if (!listEl) return;

        if (peers.length === 0) {
            listEl.innerHTML = `<li class="no-devices">暂未发现其他设备...</li>`;
            return;
        }

        listEl.innerHTML = peers.map(peer => `
            <li class="device-item" data-state="${peer.state}">
                <span class="device-status-dot"></span>
                <span class="device-id">${peer.id}</span>
                <span class="device-state">${this.translateState(peer.state)}</span>
            </li>
        `).join('');
    }

    private translateState(state: RTCPeerConnectionState): string {
        const map = {
            'new': '初始',
            'connecting': '连接中...',
            'connected': '已连接',
            'disconnected': '已断开',
            'failed': '连接失败',
            'closed': '已关闭'
        };
        return map[state] || '未知';
    }
}