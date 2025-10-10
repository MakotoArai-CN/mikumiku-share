// src/ui/QRCodePannel.ts
import QRious from 'qrious';
import { ConfigManager } from '../core/ConfigManager';
import { IConfig } from '../types';
import { LanSharer } from '../core/LanSharer';
import { showToast } from './Toast';

export class QRCodePannel {
    private element: HTMLElement;
    private canvas: HTMLCanvasElement;
    private currentConfig: IConfig;
    private currentUrl: string | null = null;
    private shadowRoot: ShadowRoot;
    private lanSharer: LanSharer;
    private isMouseOverPanel: boolean = false;
    private isDragging: boolean = false;
    private dragStartX: number = 0;
    private dragStartY: number = 0;
    private elementStartX: number = 0;
    private elementStartY: number = 0;
    private customPosition: { x: number; y: number } | null = null;
    private isEnlarged: boolean = false;
    private originalSize: number = 160;
    private enlargedSize: number = 320;
    private lastClickTime: number = 0;

    constructor(shadowRoot: ShadowRoot, configManager: ConfigManager, lanSharer: LanSharer) {
        this.shadowRoot = shadowRoot;
        this.currentConfig = configManager.get();
        this.lanSharer = lanSharer;
        this.originalSize = this.currentConfig.qrCodeSize;
        this.enlargedSize = this.originalSize * 2;

        this.element = document.createElement('div');
        this.element.className = 'mms-qrcode-pannel';
        shadowRoot.appendChild(this.element);

        this.canvas = document.createElement('canvas');
        this.canvas.className = 'mms-qrcode-canvas';

        this.element.addEventListener('mouseenter', () => {
            this.isMouseOverPanel = true;
        });

        this.element.addEventListener('mouseleave', () => {
            this.isMouseOverPanel = false;
            if (!this.isDragging) {
                this.hide();
            }
        });

        this.element.addEventListener('mousedown', this.handleMouseDown.bind(this));
        document.addEventListener('mousemove', this.handleMouseMove.bind(this));
        document.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.canvas.addEventListener('click', this.handleClick.bind(this));
    }

    public updateConfig(newConfig: IConfig) {
        this.currentConfig = newConfig;
        this.originalSize = newConfig.qrCodeSize;
        this.enlargedSize = this.originalSize * 2;

        if (this.element.classList.contains('visible') && this.currentUrl) {
            this.render();
        }
    }

    public show(url: string, x: number, y: number, originalUrl?: string) {
        this.currentUrl = url;
        this.isEnlarged = false;
        this.render();
        this.updatePosition(x, y);
        this.element.classList.add('visible');
    }

    public hide() {
        this.element.classList.remove('visible');
        this.customPosition = null;
        this.isEnlarged = false;
    }

    public isMouseOver(): boolean {
        return this.isMouseOverPanel;
    }

    private handleMouseDown(e: MouseEvent) {
        if ((e.target as HTMLElement).tagName === 'BUTTON') {
            return;
        }
        this.isDragging = true;
        this.dragStartX = e.clientX;
        this.dragStartY = e.clientY;

        const rect = this.element.getBoundingClientRect();
        this.elementStartX = rect.left;
        this.elementStartY = rect.top;
        this.element.style.cursor = 'grabbing';
        e.preventDefault();
    }

    private handleMouseMove(e: MouseEvent) {
        if (!this.isDragging) return;

        const deltaX = e.clientX - this.dragStartX;
        const deltaY = e.clientY - this.dragStartY;
        const newX = this.elementStartX + deltaX;
        const newY = this.elementStartY + deltaY;

        this.element.style.left = `${newX}px`;
        this.element.style.top = `${newY}px`;
        this.element.style.right = 'auto';
        this.element.style.bottom = 'auto';
        this.customPosition = { x: newX, y: newY };
    }

    private handleMouseUp(e: MouseEvent) {
        if (this.isDragging) {
            this.isDragging = false;
            this.element.style.cursor = '';
        }
    }

    private handleClick(e: MouseEvent) {
        const currentTime = Date.now();
        const timeDiff = currentTime - this.lastClickTime;

        if (timeDiff < 300) {
            e.preventDefault();
            this.toggleEnlarge();
        }

        this.lastClickTime = currentTime;
    }

    private toggleEnlarge() {
        this.isEnlarged = !this.isEnlarged;
        this.render();
    }

    private render() {
        this.element.innerHTML = '';

        const size = this.isEnlarged ? this.enlargedSize : this.originalSize;
        new QRious({
            element: this.canvas,
            value: this.currentUrl || '',
            size: size,
            level: 'H',
            background: '#ffffff',
            foreground: '#000000',
        });

        this.element.appendChild(this.canvas);

        const footer = document.createElement('footer');
        if (this.currentConfig.enableLAN) {
            const lanButton = this.createButton('📡 局域网打开', this.handleLanShare.bind(this));
            footer.appendChild(lanButton);
        }

        if (footer.hasChildNodes()) {
            this.element.appendChild(footer);
        }
    }

    private createButton(text: string, onClick: (e: MouseEvent) => void): HTMLButtonElement {
        const button = document.createElement('button');
        button.textContent = text;
        button.addEventListener('click', onClick);
        return button;
    }

    private handleLanShare() {
        if (!this.currentUrl) return;

        try {
            const connectedCount = this.lanSharer.sendUrlToAll(this.currentUrl);
            if (connectedCount === 0) {
                showToast(this.shadowRoot, '没有已连接的设备', 'info');
            } else {
                showToast(this.shadowRoot, `已发送到 ${connectedCount} 个设备`, 'success');
            }
        } catch (error) {
            showToast(this.shadowRoot, '发送失败', 'error');
        }
    }

    private updatePosition(x: number, y: number) {
        if (this.customPosition) {
            this.element.style.left = `${this.customPosition.x}px`;
            this.element.style.top = `${this.customPosition.y}px`;
            this.element.style.right = 'auto';
            this.element.style.bottom = 'auto';
            return;
        }

        if (this.currentConfig.qrCodePosition === 'fixed') {
            const offset = this.currentConfig.fixedOffset;
            const position = this.currentConfig.fixedPosition;
            this.element.style.left = 'auto';
            this.element.style.right = 'auto';
            this.element.style.top = 'auto';
            this.element.style.bottom = 'auto';

            switch (position) {
                case 'top-left':
                    this.element.style.top = `${offset.y}px`;
                    this.element.style.left = `${offset.x}px`;
                    break;
                case 'top-right':
                    this.element.style.top = `${offset.y}px`;
                    this.element.style.right = `${offset.x}px`;
                    break;
                case 'bottom-left':
                    this.element.style.bottom = `${offset.y}px`;
                    this.element.style.left = `${offset.x}px`;
                    break;
                case 'bottom-right':
                    this.element.style.bottom = `${offset.y}px`;
                    this.element.style.right = `${offset.x}px`;
                    break;
            }
        } else {
            const rect = this.element.getBoundingClientRect();
            const margin = 15;
            let newX = x + margin;
            let newY = y + margin;

            if (newX + rect.width > window.innerWidth) {
                newX = x - rect.width - margin;
            }
            if (newY + rect.height > window.innerHeight) {
                newY = y - rect.height - margin;
            }

            this.element.style.top = `${newY}px`;
            this.element.style.left = `${newX}px`;
            this.element.style.right = 'auto';
            this.element.style.bottom = 'auto';
        }
    }

    public destroy() {
        document.removeEventListener('mousemove', this.handleMouseMove.bind(this));
        document.removeEventListener('mouseup', this.handleMouseUp.bind(this));
    }
}