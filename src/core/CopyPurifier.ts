import { Logger } from './Logger';
import { IConfig } from '../types';

export class CopyPurifier {
    private config: IConfig;
    private allowList = {
        element: ['script', 'style', 'video'],
        id: ['video'],
        className: ['video'],
    };
    private copyEventHandler: ((e: ClipboardEvent) => void) | null = null;
    private observing: boolean = false;
    private mutationObserver: MutationObserver | null = null;

    constructor(config: IConfig) {
        this.config = config;
    }

    public init(): void {
        if (this.config.enableCopyPurify) {
            this.purifyURL();
            this.interceptCopy();
        }
        
        if (this.config.enableSelectionUnlock) {
            this.unlockSelection();
            this.startMutationObserver();
        }
    }

    public destroy(): void {
        // 清理复制事件监听器
        if (this.copyEventHandler) {
            document.removeEventListener('copy', this.copyEventHandler, true);
            this.copyEventHandler = null;
        }
        
        // 清理mutation observer
        if (this.mutationObserver) {
            this.mutationObserver.disconnect();
            this.mutationObserver = null;
        }
        
        this.observing = false;
    }

    private purifyURL(): void {
        const hostname = window.location.hostname;
        
        // 检查是否在净化列表中
        if (!this.config.copyPurifyDomains.includes(hostname)) {
            return;
        }

        // 针对不同网站的URL净化规则
        const purifyRules: Record<string, () => void> = {
            'blog.csdn.net': () => {
                const match = location.href.match(/(https?:\/\/.*?blog\.csdn\.net\/.*?article\/details\/.*?)\?/);
                if (match) {
                    const cleanUrl = match[1];
                    window.history.replaceState({ path: cleanUrl }, '', cleanUrl);
                    Logger.log('CSDN URL已净化');
                }
            },
            'www.zhihu.com': () => {
                const url = new URL(location.href);
                // 移除所有追踪参数
                const trackingParams = [
                    'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
                    'utm_id', 'utm_division', 'utm_oi', 'utm_psn'
                ];
                let hasChanged = false;
                trackingParams.forEach(param => {
                    if (url.searchParams.has(param)) {
                        url.searchParams.delete(param);
                        hasChanged = true;
                    }
                });
                if (hasChanged) {
                    window.history.replaceState(null, '', url.href);
                    Logger.log('知乎 URL已净化');
                }
            },
            'www.bilibili.com': () => {
                const url = new URL(location.href);
                // B站的所有追踪参数（更全面的列表）
                const trackingParams = [
                    // 分享相关
                    'share_source', 'share_medium', 'share_plat', 'share_tag', 
                    'share_times', 'share_from', 'share_session_id',
                    // 来源追踪
                    'spm_id_from', 'from_spmid', 'from', 'seid', 
                    'vd_source', 'from_source', 'msource', 'bsource',
                    'spm_from', 'from_spm_id', 'plat_id',
                    // 用户相关
                    'buvid', 'buvid3', 'buvid4', 'session_id',
                    'refer_from', 'broadcast_type', 'is_story_h5',
                    // 时间戳和其他
                    'timestamp', 'ts', 'unique_k', 'rt',
                    'bbid', 'live_from', 'launch_id',
                    // 推荐相关
                    'hotRank', 'accept_quality', 'current_fnval', 
                    'current_qn', 'network', 'tids', 'simid',
                    // 搜索相关
                    'search_source', 'vd', 'keyword',
                    // App相关
                    'goFrom', 'jumpFrom', 'noTitleBar', 'hasBack',
                    'isHideNavBar', 'navhide', 'share_plat',
                    // 统计相关
                    'p', 't', 'start_progress'
                ];
                
                // 保存原始URL用于比较
                const originalHref = url.href;
                
                // 删除所有追踪参数
                trackingParams.forEach(param => {
                    url.searchParams.delete(param);
                });
                
                // 特殊处理一些复合参数
                const searchParams = Array.from(url.searchParams.keys());
                searchParams.forEach(param => {
                    // 删除所有包含特定关键词的参数
                    if (param.includes('share') || 
                        param.includes('spm') || 
                        param.includes('from') || 
                        param.includes('buvid') ||
                        param.includes('source') ||
                        param.includes('track')) {
                        url.searchParams.delete(param);
                    }
                });
                
                // 如果URL发生了变化，更新浏览器地址栏
                if (url.href !== originalHref) {
                    window.history.replaceState(null, '', url.href);
                    Logger.log('B站 URL已净化，移除了追踪参数');
                }
            },
            'www.cnblogs.com': () => {
                const url = new URL(location.href);
                const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign'];
                let hasChanged = false;
                trackingParams.forEach(param => {
                    if (url.searchParams.has(param)) {
                        url.searchParams.delete(param);
                        hasChanged = true;
                    }
                });
                if (hasChanged) {
                    window.history.replaceState(null, '', url.href);
                    Logger.log('博客园 URL已净化');
                }
            },
            'www.360doc.com': () => {
                const url = new URL(location.href);
                if (url.searchParams.has('from')) {
                    url.searchParams.delete('from');
                    window.history.replaceState(null, '', url.href);
                    Logger.log('360doc URL已净化');
                }
            },
            'blog.51cto.com': () => {
                const url = new URL(location.href);
                const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'];
                let hasChanged = false;
                trackingParams.forEach(param => {
                    if (url.searchParams.has(param)) {
                        url.searchParams.delete(param);
                        hasChanged = true;
                    }
                });
                if (hasChanged) {
                    window.history.replaceState(null, '', url.href);
                    Logger.log('51CTO URL已净化');
                }
            },
            'www.kuwo.cn': () => {
                const url = new URL(location.href);
                const trackingParams = ['from', 'plat'];
                let hasChanged = false;
                trackingParams.forEach(param => {
                    if (url.searchParams.has(param)) {
                        url.searchParams.delete(param);
                        hasChanged = true;
                    }
                });
                if (hasChanged) {
                    window.history.replaceState(null, '', url.href);
                    Logger.log('酷我音乐 URL已净化');
                }
            },
            'read.qidian.com': () => {
                const url = new URL(location.href);
                if (url.searchParams.has('from')) {
                    url.searchParams.delete('from');
                    window.history.replaceState(null, '', url.href);
                    Logger.log('起点中文网 URL已净化');
                }
            }
        };

        // 执行对应网站的净化规则
        const rule = purifyRules[hostname];
        if (rule) {
            rule();
        }
    }

    private interceptCopy(): void {
        const hostname = window.location.hostname;
        
        if (!this.config.copyPurifyDomains.includes(hostname)) {
            return;
        }

        // 移除旧的监听器
        if (this.copyEventHandler) {
            document.removeEventListener('copy', this.copyEventHandler, true);
        }

        // 创建新的监听器
        this.copyEventHandler = (e: ClipboardEvent) => {
            const selection = window.getSelection();
            if (!selection || selection.rangeCount === 0) return;

            const text = selection.toString();
            if (!text) return;

            // 净化复制的文本
            let cleanText = text;
            
            // 移除常见的版权声明后缀（更全面的规则）
            const copyrightPatterns = [
                // 通用版权模式
                /————————————————\s*版权声明.*$/s,
                /-----*\s*版权声明.*$/s,
                /作者：.*?\s+链接：.*?\s+来源：.*?\s+著作权归.*?$/s,
                /本文为.*?原创文章.*$/s,
                /转载请注明出处.*$/s,
                /-----*\s*作者.*$/s,
                
                // CSDN特有模式
                /————————————————\s*版权声明：本文为.*?原创文章.*?$/s,
                /版权声明：本文为博主原创文章.*?$/s,
                
                // 知乎特有模式
                /编辑于\s*\d{4}-\d{2}-\d{2}.*?$/s,
                /发布于\s*\d{4}-\d{2}-\d{2}.*?$/s,
                
                // 简书特有模式
                /作者：.*?\s+链接：https:\/\/www\.jianshu\.com.*?$/s,
                
                // 博客园特有模式
                /本文转载自：.*?$/s,
                /原文链接：.*?$/s,
                
                // 微信公众号
                /阅读原文.*?$/s,
                /点击上方.*?关注.*?$/s,
                
                // 360doc
                /KATEX_INLINE_OPEN本文来自：.*?KATEX_INLINE_CLOSE$/s,
                
                // 通用尾部信息
                /【.*?版权.*?】.*?$/s,
                /```math.*?版权.*?```.*?$/s,
                /©.*?版权所有.*?$/s,
                /Copyright.*?$/si,
                /All Rights Reserved.*?$/si
            ];

            let textModified = false;
            copyrightPatterns.forEach(pattern => {
                const newText = cleanText.replace(pattern, '');
                if (newText !== cleanText) {
                    cleanText = newText;
                    textModified = true;
                }
            });

            // 移除多余的空白行
            cleanText = cleanText.replace(/\n{3,}/g, '\n\n').trim();

            // 如果文本被修改了，阻止默认行为并设置净化后的文本
            if (textModified) {
                e.preventDefault();
                e.clipboardData?.setData('text/plain', cleanText);
                Logger.log('复制内容已净化');
            }
        };

        // 拦截复制事件（捕获阶段）
        document.addEventListener('copy', this.copyEventHandler, true);
    }

    private startMutationObserver(): void {
        if (this.observing) return;
        
        const hostname = window.location.hostname;
        if (!this.config.copyPurifyDomains.includes(hostname)) {
            return;
        }

        this.mutationObserver = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            this.unlockElement(node as HTMLElement);
                            // 递归处理子元素
                            (node as HTMLElement).querySelectorAll('*').forEach(el => {
                                this.unlockElement(el as HTMLElement);
                            });
                        }
                    });
                }
            }
        });

        this.mutationObserver.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        this.observing = true;
    }

    private unlockSelection(): void {
        const hostname = window.location.hostname;
        
        // 只在配置的域名上启用
        if (!this.config.copyPurifyDomains.includes(hostname)) {
            return;
        }

        // 添加全局解锁样式
        const style = document.createElement('style');
        style.textContent = `
            * {
                -webkit-user-select: text !important;
                -moz-user-select: text !important;
                -ms-user-select: text !important;
                user-select: text !important;
            }
            
            /* 针对伪元素的选择样式 */
            *::selection {
                background-color: #007BFF !important;
                color: white !important;
            }
            
            *::-moz-selection {
                background-color: #007BFF !important;
                color: white !important;
            }
            
            /* 深色模式下的选择样式 */
            @media (prefers-color-scheme: dark) {
                *::selection {
                    background-color: #5DACDD !important;
                    color: black !important;
                }
                
                *::-moz-selection {
                    background-color: #5DACDD !important;
                    color: black !important;
                }
            }
        `;
        style.id = 'miku-share-unlock-style';
        
        // 如果已经存在就先移除
        const existingStyle = document.getElementById('miku-share-unlock-style');
        if (existingStyle) {
            existingStyle.remove();
        }
        
        document.head.appendChild(style);

        // 解锁所有元素
        this.unlockAllElements();
    }

    private unlockAllElements(): void {
        document.querySelectorAll('*').forEach(el => {
            this.unlockElement(el as HTMLElement);
        });
    }

    private unlockElement(el: HTMLElement): void {
        // 跳过 Shadow DOM 内的元素
        if (el.getRootNode() instanceof ShadowRoot) {
            return;
        }

        // 跳过脚本的宿主元素
        if (el.id === 'miku-share-host') {
            return;
        }

        // 检查白名单
        const nodeName = el.nodeName.toLowerCase();
        const id = el.id?.toLowerCase();
        const className = el.className?.toString().toLowerCase();

        if (
            this.allowList.element.includes(nodeName) ||
            this.allowList.id.some(item => id?.includes(item)) ||
            this.allowList.className.some(item => className?.includes(item))
        ) {
            return;
        }

        // 强制设置选择样式
        const userSelectProps = [
            'user-select', 
            '-webkit-user-select', 
            '-moz-user-select', 
            '-ms-user-select', 
            '-khtml-user-select'
        ];
        
        userSelectProps.forEach(prop => {
            const currentStyle = window.getComputedStyle(el)[prop as any];
            if (currentStyle && currentStyle !== 'auto' && currentStyle !== 'text') {
                el.style.setProperty(prop, 'text', 'important');
            }
        });

        // 移除或重写限制性事件
        const restrictiveEvents = [
            'selectstart', 'selectionchange',
            'copy', 'beforecopy',
            'paste', 'beforepaste', 
            'cut', 'beforecut',
            'contextmenu'
        ];
        
        restrictiveEvents.forEach(eventName => {
            // 移除内联事件处理器
            el.removeAttribute(`on${eventName}`);
            
            // 重写事件处理器为空函数
            (el as any)[`on${eventName}`] = (e: Event) => {
                e.stopImmediatePropagation();
            };
        });

        // 处理鼠标事件（仅对文本元素）
        const textElements = ['P', 'DIV', 'SPAN', 'A', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LI', 'TD', 'TH'];
        if (textElements.includes(el.nodeName)) {
            ['mousedown', 'mouseup', 'mouseover', 'mouseout', 'mouseleave', 'mouseenter'].forEach(eventName => {
                (el as any)[`on${eventName}`] = (e: MouseEvent) => {
                    if (e.button === 0) { // 左键
                        e.stopImmediatePropagation();
                    }
                };
            });
        }

        // 处理键盘事件（Ctrl+C 和 F12）
        ['keypress', 'keyup', 'keydown'].forEach(eventName => {
            (el as any)[`on${eventName}`] = (e: KeyboardEvent) => {
                const keyCode = e.keyCode || e.which || (e as any).charCode;
                const ctrlKey = e.ctrlKey || e.metaKey;
                if ((ctrlKey && keyCode === 67) || keyCode === 123) {
                    e.stopImmediatePropagation();
                }
            };
        });
    }

    public updateConfig(newConfig: IConfig): void {
        const oldConfig = this.config;
        this.config = newConfig;

        // 如果复制净化状态改变，重新初始化
        if (oldConfig.enableCopyPurify !== newConfig.enableCopyPurify) {
            this.destroy();
            if (newConfig.enableCopyPurify) {
                this.purifyURL();
                this.interceptCopy();
            }
        }

        // 如果选择解锁状态改变，重新应用
        if (oldConfig.enableSelectionUnlock !== newConfig.enableSelectionUnlock) {
            if (newConfig.enableSelectionUnlock) {
                this.unlockSelection();
                this.startMutationObserver();
            } else {
                // 移除解锁样式
                const style = document.getElementById('miku-share-unlock-style');
                if (style) {
                    style.remove();
                }
                // 停止观察器
                if (this.mutationObserver) {
                    this.mutationObserver.disconnect();
                    this.mutationObserver = null;
                }
                this.observing = false;
            }
        }
    }
}