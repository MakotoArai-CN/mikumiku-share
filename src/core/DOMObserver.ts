import { ConfigManager } from './ConfigManager';
import { QRCodePannel } from '../ui/QRCodePannel';
import { IConfig } from '../types';
import { Logger } from './Logger';
import { LanSharer } from './LanSharer';
import { LinkResolver } from './LinkResolver';

export class DOMObserver {
    private shadowRoot: ShadowRoot;
    private configManager: ConfigManager;
    private qrCodePannel: QRCodePannel;
    private currentConfig: IConfig;
    private hoverTimeout: number | null = null;
    private currentTarget: HTMLAnchorElement | null = null;
    private processedLinks: WeakSet<HTMLAnchorElement> = new WeakSet();

    constructor(shadowRoot: ShadowRoot, configManager: ConfigManager, lanSharer: LanSharer) {
        this.shadowRoot = shadowRoot;
        this.configManager = configManager;
        this.currentConfig = this.configManager.get();
        this.qrCodePannel = new QRCodePannel(this.shadowRoot, this.configManager, lanSharer);
        this.configManager.subscribe(newConfig => {
            this.currentConfig = newConfig;
            this.qrCodePannel.updateConfig(newConfig);
        });
    }

    public observe(): void {
        document.addEventListener('mouseover', this.handleMouseOver.bind(this), true);
        document.addEventListener('mouseout', this.handleMouseOut.bind(this), true);
        
        // 处理页面已有的链接
        this.replaceAllLinks();
        
        // 监听新增的链接
        const observer = new MutationObserver(() => {
            this.replaceAllLinks();
        });
        observer.observe(document.body, { childList: true, subtree: true });
        
        Logger.log("DOM 观察器已启动。");
    }

    private replaceAllLinks(): void {
        if (!this.currentConfig.autoResolveRedirect) return;
        
        document.querySelectorAll('a[href]').forEach((link) => {
            const anchor = link as HTMLAnchorElement;
            if (this.processedLinks.has(anchor)) return;
            if (!this.isLinkValid(anchor.href)) return;
            
            const resolvedUrl = LinkResolver.resolveUrl(anchor.href);
            if (resolvedUrl !== anchor.href) {
                anchor.setAttribute('data-original-href', anchor.href);
                anchor.href = resolvedUrl;
                this.processedLinks.add(anchor);
                Logger.log(`链接已替换: ${anchor.getAttribute('data-original-href')} -> ${resolvedUrl}`);
            }
        });
    }

    private handleMouseOver(event: MouseEvent): void {
        if (!this.currentConfig.enabled || !this.currentConfig.showOnHover) {
            return;
        }

        const target = (event.target as HTMLElement).closest('a');
        if (target && target.href && this.isLinkValid(target.href)) {
            if (this.hoverTimeout) {
                clearTimeout(this.hoverTimeout);
            }

            this.currentTarget = target;
            this.hoverTimeout = window.setTimeout(() => {
                if (this.currentTarget) {
                    const originalUrl = this.currentTarget.getAttribute('data-original-href') || this.currentTarget.href;
                    this.qrCodePannel.show(this.currentTarget.href, event.clientX, event.clientY, originalUrl);
                }
            }, this.currentConfig.hoverDelay);
        }
    }

    private handleMouseOut(event: MouseEvent): void {
        if (this.hoverTimeout) {
            clearTimeout(this.hoverTimeout);
            this.hoverTimeout = null;
        }

        const relatedTarget = event.relatedTarget as Node;
        if (!this.shadowRoot.contains(relatedTarget) && !this.qrCodePannel.isMouseOver()) {
            this.qrCodePannel.hide();
        }
    }

    private isLinkValid(href: string): boolean {
        if (!href.startsWith('http://') && !href.startsWith('https://')) {
            return false;
        }

        const { blacklist, whitelist } = this.currentConfig;
        const currentHostname = window.location.hostname;

        if (whitelist.length > 0) {
            return whitelist.some(domain => currentHostname.includes(domain));
        }

        if (blacklist.length > 0) {
            return !blacklist.some(domain => currentHostname.includes(domain));
        }

        return true;
    }
}