import { Logger } from './Logger';
import { showToast } from '../ui/Toast';
import jsQR from 'jsqr';

interface QRCodeCache {
    data: string;
    timestamp: number;
}

export class QRCodeRecognizer {
    private shadowRoot: ShadowRoot;
    private isScanning: boolean = false;
    private scanTimeout: number | null = null;
    private qrCodeCache: WeakMap<HTMLImageElement | HTMLCanvasElement, QRCodeCache> = new WeakMap();
    private enabled: boolean = false;
    private delay: number = 3000;
    private action: string = 'copyWithToast';
    private mouseOverHandler: ((e: MouseEvent) => void) | null = null;
    private mouseOutHandler: ((e: MouseEvent) => void) | null = null;
    private observing: boolean = false;
    private cacheTimeout: number = 60000; // 缓存有效期60秒
    private currentHoverElement: HTMLElement | null = null;
    private useGMOpenTab: boolean = true; // 默认使用油猴API

    constructor(shadowRoot: ShadowRoot) {
        this.shadowRoot = shadowRoot;
    }

    public start(enabled: boolean, delay: number, action: string, useGMOpenTab: boolean = true): void {
        this.stop(); // 先停止之前的监听
        
        this.enabled = enabled;
        this.delay = delay;
        this.action = action;
        this.useGMOpenTab = useGMOpenTab;
        
        if (!this.enabled) {
            Logger.log('二维码识别已禁用');
            return;
        }
        
        Logger.log('启动二维码识别器');
        this.startObserving();
    }

    public stop(): void {
        if (this.scanTimeout) {
            clearTimeout(this.scanTimeout);
            this.scanTimeout = null;
        }
        
        if (this.observing && this.mouseOverHandler && this.mouseOutHandler) {
            document.removeEventListener('mouseover', this.mouseOverHandler, true);
            document.removeEventListener('mouseout', this.mouseOutHandler, true);
            this.observing = false;
            Logger.log('停止二维码识别器');
        }
    }

    public updateConfig(enabled: boolean, delay: number, action: string, useGMOpenTab: boolean = true): void {
        const needRestart = this.enabled !== enabled || this.delay !== delay || this.action !== action || this.useGMOpenTab !== useGMOpenTab;
        
        if (needRestart) {
            this.start(enabled, delay, action, useGMOpenTab);
        }
    }

    private startObserving(): void {
        if (this.observing) return;
        
        this.mouseOverHandler = (e: MouseEvent) => this.handleMouseOver(e);
        this.mouseOutHandler = (e: MouseEvent) => this.handleMouseOut(e);
        
        document.addEventListener('mouseover', this.mouseOverHandler, true);
        document.addEventListener('mouseout', this.mouseOutHandler, true);
        this.observing = true;
    }

    private handleMouseOver(event: MouseEvent): void {
        if (!this.enabled) return;
        
        // 获取鼠标位置的最上层元素
        const element = this.getTopImageElement(event);
        
        if (!element) {
            return;
        }
        
        // 记录当前悬停的元素
        this.currentHoverElement = element;
        
        // 清除之前的定时器
        if (this.scanTimeout) {
            clearTimeout(this.scanTimeout);
        }
        
        // 设置新的定时器
        this.scanTimeout = window.setTimeout(() => {
            // 确保鼠标仍在同一个元素上
            if (this.currentHoverElement === element) {
                if (element.tagName === 'IMG') {
                    this.scanImage(element as HTMLImageElement);
                } else if (element.tagName === 'CANVAS') {
                    this.scanCanvas(element as HTMLCanvasElement);
                }
            }
        }, this.delay);
    }

    private handleMouseOut(event: MouseEvent): void {
        const element = this.getTopImageElement(event);
        
        // 如果离开了当前悬停的元素
        if (element === this.currentHoverElement) {
            this.currentHoverElement = null;
            if (this.scanTimeout) {
                clearTimeout(this.scanTimeout);
                this.scanTimeout = null;
            }
        }
    }

    private getTopImageElement(event: MouseEvent): HTMLElement | null {
        const x = event.clientX;
        const y = event.clientY;
        
        // 获取鼠标位置的所有元素
        const elements = document.elementsFromPoint(x, y);
        
        // 查找最上层的图片或canvas元素
        for (const element of elements) {
            // 跳过我们自己的Shadow DOM
            if (element.id === 'miku-share-host') {
                continue;
            }
            
            if (element.tagName === 'IMG' || element.tagName === 'CANVAS') {
                // 检查元素是否可见
                const style = window.getComputedStyle(element);
                if (style.display !== 'none' && 
                    style.visibility !== 'hidden' && 
                    parseFloat(style.opacity) > 0) {
                    return element as HTMLElement;
                }
            }
            
            // 检查背景图片
            if (element instanceof HTMLElement) {
                const bgImage = window.getComputedStyle(element).backgroundImage;
                if (bgImage && bgImage !== 'none' && bgImage.includes('url(')) {
                    // 如果元素有背景图片，尝试查找其中的img子元素
                    const imgChild = element.querySelector('img');
                    if (imgChild) {
                        return imgChild as HTMLImageElement;
                    }
                }
            }
        }
        
        return null;
    }

    private getCachedResult(element: HTMLImageElement | HTMLCanvasElement): string | null {
        const cached = this.qrCodeCache.get(element);
        if (cached) {
            const now = Date.now();
            if (now - cached.timestamp < this.cacheTimeout) {
                return cached.data;
            } else {
                // 缓存过期，删除
                this.qrCodeCache.delete(element);
            }
        }
        return null;
    }

    private setCachedResult(element: HTMLImageElement | HTMLCanvasElement, data: string): void {
        this.qrCodeCache.set(element, {
            data: data,
            timestamp: Date.now()
        });
    }

    private async scanImage(img: HTMLImageElement): Promise<void> {
        // 先检查缓存
        const cachedResult = this.getCachedResult(img);
        if (cachedResult !== null) {
            if (cachedResult) {
                Logger.log('使用缓存的二维码识别结果:', cachedResult);
                this.handleQRCodeResult(cachedResult);
                this.showVisualFeedback(img);
            }
            return;
        }

        if (this.isScanning) return;
        
        this.isScanning = true;
        
        try {
            // 等待图片加载完成
            if (!img.complete) {
                await new Promise((resolve, reject) => {
                    img.onload = resolve;
                    img.onerror = reject;
                    setTimeout(reject, 5000); // 5秒超时
                });
            }
            
            // 创建canvas并绘制图片
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            if (!ctx) {
                throw new Error('无法创建canvas上下文');
            }
            
            // 设置canvas尺寸
            const width = img.naturalWidth || img.width;
            const height = img.naturalHeight || img.height;
            
            if (width === 0 || height === 0) {
                throw new Error('图片尺寸无效');
            }
            
            canvas.width = width;
            canvas.height = height;
            
            // 绘制图片
            ctx.drawImage(img, 0, 0, width, height);
            
            // 获取图片数据
            const imageData = ctx.getImageData(0, 0, width, height);
            
            // 使用jsQR识别二维码（尝试多种模式）
            let code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: 'attemptBoth',
            });
            
            if (code && code.data) {
                Logger.log('识别到二维码:', code.data);
                this.setCachedResult(img, code.data);
                this.handleQRCodeResult(code.data);
                this.showVisualFeedback(img);
            } else {
                // 缓存空结果，避免重复扫描
                this.setCachedResult(img, '');
                Logger.log('未识别到二维码');
            }
            
        } catch (error) {
            Logger.error('扫描图片二维码失败:', error);
        } finally {
            this.isScanning = false;
        }
    }

    private async scanCanvas(canvas: HTMLCanvasElement): Promise<void> {
        // 先检查缓存
        const cachedResult = this.getCachedResult(canvas);
        if (cachedResult !== null) {
            if (cachedResult) {
                Logger.log('使用缓存的Canvas二维码识别结果:', cachedResult);
                this.handleQRCodeResult(cachedResult);
                this.showVisualFeedback(canvas);
            }
            return;
        }

        if (this.isScanning) return;
        
        this.isScanning = true;
        
        try {
            const ctx = canvas.getContext('2d');
            
            if (!ctx) {
                throw new Error('无法获取canvas上下文');
            }
            
            const width = canvas.width;
            const height = canvas.height;
            
            if (width === 0 || height === 0) {
                throw new Error('Canvas尺寸无效');
            }
            
            // 获取canvas数据
            const imageData = ctx.getImageData(0, 0, width, height);
            
            // 使用jsQR识别二维码
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: 'attemptBoth',
            });
            
            if (code && code.data) {
                Logger.log('从Canvas识别到二维码:', code.data);
                this.setCachedResult(canvas, code.data);
                this.handleQRCodeResult(code.data);
                this.showVisualFeedback(canvas);
            } else {
                // 缓存空结果
                this.setCachedResult(canvas, '');
            }
            
        } catch (error) {
            Logger.error('扫描Canvas二维码失败:', error);
        } finally {
            this.isScanning = false;
        }
    }

    private showVisualFeedback(element: HTMLElement): void {
        const originalBorder = element.style.border;
        const originalBoxShadow = element.style.boxShadow;
        
        element.style.border = '3px solid #4CAF50';
        element.style.boxShadow = '0 0 10px rgba(76, 175, 80, 0.5)';
        
        setTimeout(() => {
            element.style.border = originalBorder;
            element.style.boxShadow = originalBoxShadow;
        }, 2000);
    }

    private openUrl(url: string): void {
        if (this.useGMOpenTab && typeof GM_openInTab !== 'undefined') {
            // 使用油猴API打开链接
            try {
                GM_openInTab(url, {
                    active: true,
                    insert: true,
                    setParent: true
                });
                Logger.log('使用GM_openInTab打开链接:', url);
            } catch (error) {
                Logger.error('GM_openInTab失败，降级使用window.open:', error);
                window.open(url, '_blank');
            }
        } else {
            // 使用原生API
            window.open(url, '_blank');
            Logger.log('使用window.open打开链接:', url);
        }
    }

    private handleQRCodeResult(data: string): void {
        if (!data) return;
        
        // 复制到剪贴板的函数
        const copyToClipboard = async (text: string): Promise<boolean> => {
            try {
                // 尝试使用新API
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    await navigator.clipboard.writeText(text);
                    return true;
                }
                
                // 降级方案
                const textArea = document.createElement('textarea');
                textArea.value = text;
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                textArea.style.top = '-999999px';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                
                let success = false;
                try {
                    success = document.execCommand('copy');
                } catch (err) {
                    Logger.error('复制失败:', err);
                }
                
                document.body.removeChild(textArea);
                return success;
                
            } catch (err) {
                Logger.error('复制到剪贴板失败:', err);
                return false;
            }
        };

        // 检查是否为URL
        const isURL = (str: string): boolean => {
            try {
                const url = new URL(str);
                return url.protocol === 'http:' || url.protocol === 'https:';
            } catch {
                // 尝试检查常见的URL模式
                return /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?/.test(str);
            }
        };

        // 根据配置的动作处理结果
        switch (this.action) {
            case 'copy':
                // 仅复制，不提示
                copyToClipboard(data);
                Logger.log('已复制到剪贴板（静默）:', data);
                break;
                
            case 'copyWithToast':
                // 复制并提示
                copyToClipboard(data).then(success => {
                    if (success) {
                        const displayText = data.length > 50 ? data.substring(0, 50) + '...' : data;
                        showToast(this.shadowRoot, `已复制: ${displayText}`, 'success');
                    } else {
                        showToast(this.shadowRoot, '复制失败，请手动复制', 'error');
                    }
                });
                break;
                
            case 'copyAndOpen':
                // 复制并打开（如果是链接）
                copyToClipboard(data).then(success => {
                    if (success) {
                        const displayText = data.length > 50 ? data.substring(0, 50) + '...' : data;
                        showToast(this.shadowRoot, `已复制: ${displayText}`, 'success');
                        
                        if (isURL(data)) {
                            setTimeout(() => {
                                this.openUrl(data);
                                showToast(this.shadowRoot, '正在打开链接...', 'info');
                            }, 500);
                        }
                    } else {
                        showToast(this.shadowRoot, '复制失败', 'error');
                    }
                });
                break;
                
            case 'silentOpen':
                // 直接打开（如果是链接），不复制
                if (isURL(data)) {
                    this.openUrl(data);
                    Logger.log('直接打开链接:', data);
                } else {
                    // 如果不是链接，还是复制一下
                    copyToClipboard(data).then(success => {
                        if (success) {
                            showToast(this.shadowRoot, '不是有效链接，已复制内容', 'info');
                        }
                    });
                }
                break;
                
            default:
                Logger.warn('未知的动作类型:', this.action);
                break;
        }
    }

    public destroy(): void {
        this.stop();
        this.qrCodeCache = new WeakMap();
        this.currentHoverElement = null;
    }
}