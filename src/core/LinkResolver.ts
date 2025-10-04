import { Logger } from './Logger';

interface RedirectRule {
    path?: string;
    params?: string[];
}

export class LinkResolver {
    private static redirectMap: Record<string, RedirectRule> = {
        // 常规操作 - 直接从 URL 参数提取
        "link.juejin.cn": { params: ["target"] },
        "link.csdn.net": { params: ["target"] },
        "link.zhihu.com": { params: ["target"] },
        "c.pc.qq.com": { params: ["url"] },
        "hd.nowcoder.com": { params: ["target"] },
        "link.uisdc.com": { params: ["redirect"] },
        "link.gitcode.com": { params: ["target"] },
        "open.work.weixin.qq.com": { params: ["uri"] },

        // 需要判断域名和路径
        "www.jianshu.com": { path: "/go-wild", params: ["url"] },
        "www.douban.com": { path: "/link2", params: ["url"] },
        "steamcommunity.com": { path: "/linkfilter", params: ["url"] },
        "www.tianyancha.com": { path: "/security", params: ["target"] },
        "game.bilibili.com": { path: "/linkfilter", params: ["url"] },
        "www.chinaz.com": { path: "/go.shtml", params: ["url"] },
        "www.youtube.com": { path: "/redirect", params: ["q"] },
        "mail.qq.com": { path: "/cgi-bin/readtemplate", params: ["gourl"] },
        "weibo.cn": { path: "/sinaurl", params: ["u"] },
        "afdian.com": { path: "/link", params: ["target"] },
        "ask.latexstudio.net": { path: "/go/index", params: ["url"] },
        "blzxteam.com": { path: "/gowild", params: ["url"] },
        "cloud.tencent.com": { path: "/developer/tools/blog-entry", params: ["target"] },
        "docs.qq.com": { path: "/scenario/link.html", params: ["url"] },
        "gitee.com": { path: "/link", params: ["target"] },
        "leetcode.cn": { path: "/link", params: ["target"] },
        "sspai.com": { path: "/link", params: ["target"] },
        "t.me": { path: "/iv", params: ["url"] },
        "tieba.baidu.com": { path: "/mo/q/checkurl", params: ["url"] },
        "www.gcores.com": { path: "/link", params: ["target"] },
        "www.kookapp.cn": { path: "/go-wild", params: ["url"] },
        "www.oschina.net": { path: "/action/GoToLink", params: ["url"] },
        "www.qcc.com": { path: "/web/transfer-link", params: ["link"] },
        "www.yuque.com": { path: "/r/goto", params: ["url"] },
        "xie.infoq.cn": { path: "/link", params: ["target"] },
        "www.infoq.cn": { path: "/link", params: ["target"] },
        "www.baike.com": { path: "/redirect_link", params: ["url"] },
        "developers.weixin.qq.com": { path: "/community/middlepage/href", params: ["href"] },
        "developer.aliyun.com": { path: "/redirect", params: ["target"] },
        "www.kdocs.cn": { path: "/office/link", params: ["target"] },
        "dalao.ru": { path: "/link", params: ["target"] },
        "wx.mail.qq.com": { path: "/xmspamcheck/xmsafejump", params: ["url"] },
        "aiqicha.baidu.com": { path: "/safetip", params: ["target"] },
        "forum.mczwlt.net": { path: "/outgoing", params: ["url"] },
    };

    // 默认参数列表
    private static defaultParams = ["target", "url", "q", "gourl", "u", "redirect", "toasturl", "link", "href", "pfurl", "uri"];

    /**
     * 解析重定向链接，返回真实 URL
     */
    public static resolveUrl(url: string): string {
        try {
            const urlObj = new URL(url);
            const hostname = urlObj.hostname;

            // 特殊处理 blog.51cto.com
            if (hostname === "blog.51cto.com" && urlObj.pathname.startsWith("/transfer")) {
                const realUrl = decodeURIComponent(url.replace("https://blog.51cto.com/transfer?", ""));
                if (realUrl && realUrl.startsWith("http")) {
                    Logger.log(`解析重定向链接: ${url} -> ${realUrl}`);
                    return realUrl;
                }
            }

            const rule = this.redirectMap[hostname];

            if (rule) {
                // 检查路径匹配
                if (rule.path && !urlObj.pathname.startsWith(rule.path)) {
                    return url;
                }

                // 尝试从 URL 参数中提取
                const params = rule.params || this.defaultParams;
                for (const param of params) {
                    const target = urlObj.searchParams.get(param);
                    if (target) {
                        try {
                            const decodedTarget = decodeURIComponent(target);
                            // 验证是否为有效 URL
                            if (decodedTarget.startsWith('http://') || decodedTarget.startsWith('https://')) {
                                Logger.log(`解析重定向链接: ${url} -> ${decodedTarget}`);
                                return decodedTarget;
                            }
                        } catch (e) {
                            Logger.warn(`解码URL参数失败: ${param}=${target}`, e);
                        }
                    }
                }
            }

            return url;
        } catch (e) {
            Logger.warn("解析URL失败", e);
            return url;
        }
    }

    /**
     * 判断是否为重定向链接
     */
    public static isRedirectUrl(url: string): boolean {
        try {
            const urlObj = new URL(url);
            return !!this.redirectMap[urlObj.hostname];
        } catch (e) {
            return false;
        }
    }
}