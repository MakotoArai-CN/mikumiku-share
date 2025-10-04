export class Toast {
    private shadowRoot: ShadowRoot;
    private container: HTMLElement | null = null;
    private queue: Array<{ message: string; type: 'success' | 'error' | 'info' }> = [];
    private isShowing: boolean = false;

    constructor(shadowRoot: ShadowRoot) {
        this.shadowRoot = shadowRoot;
        this.createContainer();
    }

    private createContainer() {
        this.container = document.createElement('div');
        this.container.className = 'mms-toast-container';
        this.shadowRoot.appendChild(this.container);
    }

    public show(message: string, type: 'success' | 'error' | 'info' = 'info', duration: number = 3000) {
        this.queue.push({ message, type });
        if (!this.isShowing) {
            this.showNext();
        }
    }

    private showNext() {
        if (this.queue.length === 0) {
            this.isShowing = false;
            return;
        }

        this.isShowing = true;
        const { message, type } = this.queue.shift()!;
        
        const toast = document.createElement('div');
        toast.className = `mms-toast mms-toast-${type}`;
        
        // 添加图标
        const icon = this.getIcon(type);
        const iconEl = document.createElement('span');
        iconEl.className = 'mms-toast-icon';
        iconEl.innerHTML = icon;
        
        // 添加消息
        const messageEl = document.createElement('span');
        messageEl.className = 'mms-toast-message';
        messageEl.textContent = message;
        
        toast.appendChild(iconEl);
        toast.appendChild(messageEl);
        
        this.container!.appendChild(toast);
        
        // 触发动画
        requestAnimationFrame(() => {
            toast.classList.add('visible');
        });

        // 自动隐藏
        setTimeout(() => {
            toast.classList.remove('visible');
            setTimeout(() => {
                toast.remove();
                this.showNext();
            }, 300);
        }, 3000);
    }

    private getIcon(type: 'success' | 'error' | 'info'): string {
        const icons = {
            success: '<svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>',
            error: '<svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/></svg>',
            info: '<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>'
        };
        return icons[type];
    }

    // 单例模式
    private static instance: Toast | null = null;
    
    public static getInstance(shadowRoot: ShadowRoot): Toast {
        if (!Toast.instance) {
            Toast.instance = new Toast(shadowRoot);
        }
        return Toast.instance;
    }
}

// 便捷方法
export function showToast(shadowRoot: ShadowRoot, message: string, type: 'success' | 'error' | 'info' = 'info') {
    Toast.getInstance(shadowRoot).show(message, type);
}