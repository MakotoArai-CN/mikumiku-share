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
    private autoHideTimeout: number | null = null;
    private isLinkHovered: boolean = false;
    private mouseMoveHandler: ((e: MouseEvent) => void) | null = null;
    private mouseUpHandler: ((e: MouseEvent) => void) | null = null;

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
            // 鼠标进入时取消自动隐藏
            if (this.autoHideTimeout) {
                clearTimeout(this.autoHideTimeout);
                this.autoHideTimeout = null;
            }
        });

        this.element.addEventListener('mouseleave', () => {
            this.isMouseOverPanel = false;
            if (!this.isDragging) {
                // 鼠标离开面板时重新设置自动隐藏
                this.setupAutoHide();
            }
        });

        // 初始化拖拽事件处理器
        this.mouseMoveHandler = this.handleMouseMove.bind(this);
        this.mouseUpHandler = this.handleMouseUp.bind(this);
        
        // 初始化拖拽功能
        this.setupDragging();
        
        this.canvas.addEventListener('click', this.handleClick.bind(this));
    }

    private setupDragging(): void {
        if (this.currentConfig.enableDragging) {
            this.element.addEventListener('mousedown', this.handleMouseDown.bind(this));
            // 事件监听器绑定到 document 上，而不是 shadowRoot
            if (this.mouseMoveHandler && this.mouseUpHandler) {
                document.addEventListener('mousemove', this.mouseMoveHandler);
                document.addEventListener('mouseup', this.mouseUpHandler);
            }
        } else {
            this.element.removeEventListener('mousedown', this.handleMouseDown.bind(this));
            if (this.mouseMoveHandler && this.mouseUpHandler) {
                document.removeEventListener('mousemove', this.mouseMoveHandler);
                document.removeEventListener('mouseup', this.mouseUpHandler);
            }
        }
    }

    public updateConfig(newConfig: IConfig) {
        const oldConfig = this.currentConfig;
        this.currentConfig = newConfig;
        this.originalSize = newConfig.qrCodeSize;
        this.enlargedSize = this.originalSize * 2;

        // 更新拖拽功能
        if (oldConfig.enableDragging !== newConfig.enableDragging) {
            this.isDragging = false;
            this.element.style.cursor = '';
            this.setupDragging();
        }

        if (this.element.classList.contains('visible') && this.currentUrl) {
            this.render();
        }
    }

    public setLinkHoverState(isHovered: boolean): void {
        this.isLinkHovered = isHovered;
    }

    public startAutoHideTimer(): void {
        // 直接开始计时，不管鼠标在哪
        this.setupAutoHide();
    }

    public show(url: string, x: number, y: number, originalUrl?: string) {
        this.currentUrl = url;
        this.isEnlarged = false;
        this.render();
        this.updatePosition(x, y);
        this.element.classList.add('visible');
        
        // 设置自动隐藏
        if (this.currentConfig.qrCodeHideTrigger === 'global') {
            this.setupAutoHide();
        }
        // 注意：onLinkLeave 模式的计时器现在由 DOMObserver 控制
    }

    public hide() {
        this.element.classList.remove('visible');
        this.customPosition = null;
        this.isEnlarged = false;
        
        // 清除自动隐藏定时器
        if (this.autoHideTimeout) {
            clearTimeout(this.autoHideTimeout);
            this.autoHideTimeout = null;
        }
    }

    public isMouseOver(): boolean {
        return this.isMouseOverPanel;
    }

    private setupAutoHide(): void {
        // 清除之前的定时器
        if (this.autoHideTimeout) {
            clearTimeout(this.autoHideTimeout);
            this.autoHideTimeout = null;
        }

        // 如果启用了自动隐藏且设置了延迟时间
        if (this.currentConfig.qrCodeAutoHide && this.currentConfig.qrCodeHideDelay > 0) {
            this.autoHideTimeout = window.setTimeout(() => {
                // 如果鼠标不在面板上且不在拖拽，则隐藏
                if (!this.isMouseOverPanel && !this.isDragging) {
                    this.hide();
                }
            }, this.currentConfig.qrCodeHideDelay);
        }
    }

    private handleMouseDown(e: MouseEvent) {
        if (!this.currentConfig.enableDragging) return;
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
        if (!this.isDragging || !this.currentConfig.enableDragging) return;

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
            // 拖拽结束后重新设置自动隐藏
            this.setupAutoHide();
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

    private getQRCodeColors(): { background: string; foreground: string } {
        const style = this.currentConfig.qrCodeStyle;
        
        if (style.mode === 'custom') {
            return {
                background: style.background,
                foreground: style.foreground
            };
        }
        
        // 检测系统主题
        const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        if (style.mode === 'auto') {
            return isDarkMode ? 
                { background: '#1a1a1a', foreground: '#ffffff' } :
                { background: '#ffffff', foreground: '#000000' };
        } else if (style.mode === 'dark') {
            return { background: '#1a1a1a', foreground: '#ffffff' };
        } else {
            return { background: '#ffffff', foreground: '#000000' };
        }
    }

    private render() {
        this.element.innerHTML = '';

        const size = this.isEnlarged ? this.enlargedSize : this.originalSize;
        const colors = this.getQRCodeColors();
        
        new QRious({
            element: this.canvas,
            value: this.currentUrl || '',
            size: size,
            level: 'H',
            background: colors.background,
            backgroundAlpha: this.currentConfig.qrCodeStyle.backgroundAlpha,
            foreground: colors.foreground,
            foregroundAlpha: this.currentConfig.qrCodeStyle.foregroundAlpha,
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
        if (this.mouseMoveHandler && this.mouseUpHandler) {
            document.removeEventListener('mousemove', this.mouseMoveHandler);
            document.removeEventListener('mouseup', this.mouseUpHandler);
        }
        if (this.autoHideTimeout) {
            clearTimeout(this.autoHideTimeout);
        }
    }
}