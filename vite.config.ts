import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';

export default defineConfig({
  build: {
    minify: "terser",
    terserOptions: {
      compress: {
        // 删除 console
        drop_console: true,
        // 删除 debugger
        drop_debugger: true,
        // 删除无用的代码
        dead_code: true,
        // 优化 if 语句
        conditionals: true,
        // 优化布尔运算
        booleans: true,
        // 优化未使用的变量
        unused: true,
        // 优化 if return 语句
        if_return: true,
        // 合并连续的声明
        join_vars: true,
        // 删除不可达代码
        reduce_vars: true,
        // 内联函数
        inline: 2,
        // 优化循环
        loops: true,
        // 移除未引用的函数和变量
        toplevel: true,
        // 计算常量表达式
        evaluate: true,
        // 更激进的压缩
        passes: 3,
        // 不保留函数参数名
        keep_fargs: false,
        // 不保留函数名
        keep_fnames: false,
        // 不保留变量名
        keep_classnames: false,
        // 允许多次压缩
        pure_getters: true,
      },
      mangle: {
        // 混淆变量名
        toplevel: true,
        // 混淆属性名（谨慎使用）
        properties: {
          regex: /^_/ // 只混淆以下划线开头的属性
        },
      },
      format: {
        // 删除所有注释
        comments: false,
        // 不保留引号
        quote_style: 0,
      },
    },
  },
  plugins: [
    monkey({
      entry: 'src/main.ts',
      userscript: {
        "name": "MikuMiku-share - 链接转为二维码",
        "namespace": "http://tampermonkey.net/",
        "version": "1.0",
        "author": "MakotoArai",
        "description": "把鼠标可以点击的链接转为二维码。",
        "match": ["*://*/*"],
        "icon": "https://img.icons8.com/plasticine/100/qr-code.png",
        "grant": [
          "GM_setValue",
          "GM_getValue",
          "GM_addStyle",
          "GM_registerMenuCommand",
          "GM_xmlhttpRequest" // 如果需要进行网络请求
        ],
        "connect": "*" // 允许连接到任何域，用于局域网通信
      },
      build: {
        fileName: 'mikumiku-share.user.js',
        metaFileName: true,
        // minify 选项已移至 defineConfig 根配置中
      },
    }),
  ],
});