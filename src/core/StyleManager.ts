export class StyleManager {
    private shadowRoot: ShadowRoot;

    constructor(shadowRoot: ShadowRoot) {
        this.shadowRoot = shadowRoot;
    }

    public injectStyles(): void {
        const styleEl = document.createElement('style');
        styleEl.textContent = this.getStyles();
        this.shadowRoot.appendChild(styleEl);
    }
    
    // CSS 代码，确保与主站完全隔离
    private getStyles(): string {
        return `
        :host { all: initial; }
        
        /* --- 通用动画 --- */
        @keyframes sonar-wave {
            0% { transform: scale(0.5); opacity: 0.5; }
            100% { transform: scale(3); opacity: 0; }
        }
        
        /* --- QR码面板样式 --- */
        .mms-qrcode-pannel {position: fixed; z-index: 99999999; background-color: #ffffff; border-radius: 12px;box-shadow: 0 10px 30px rgba(0,0,0,0.15); padding: 16px; display: flex;flex-direction: column; align-items: center; gap: 12px; opacity: 0;transform: scale(0.95); transition: opacity 0.2s ease-out, transform 0.2s ease-out;pointer-events: none; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;user-select: none;
        }
        .mms-qrcode-pannel.visible { opacity: 1; transform: scale(1); pointer-events: all; }
        .mms-qrcode-pannel:active { cursor: grab; }
        .mms-qrcode-canvas {border-radius: 8px;overflow: hidden;cursor: pointer;transition: transform 0.2s ease;}
        .mms-qrcode-canvas:hover { transform: scale(1.02); }
        .mms-qrcode-pannel footer { display: flex; gap: 8px; width: 100%; }
        .mms-qrcode-pannel button {flex: 1; padding: 8px 12px; border: 1px solid #e0e0e0; background-color: #f5f5f5;color: #333; border-radius: 6px; font-size: 12px; cursor: pointer;transition: background-color 0.2s, border-color 0.2s; display: flex; align-items: center; justify-content: center; gap: 4px;}
        .mms-qrcode-pannel button:hover { background-color: #e9e9e9; border-color: #d0d0d0; }

        /* --- 设置面板样式 --- */
        .mms-settings-overlay {position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;background-color: rgba(0,0,0,0.4); z-index: 99999998; opacity: 0;transition: opacity 0.3s ease; pointer-events: none; display: flex; align-items: center; justify-content: center;}
        .mms-settings-overlay.visible { opacity: 1; pointer-events: all; }
        .mms-settings-panel {
            width: 90%; max-width: 500px; background: #fff; border-radius: 16px;
            box-shadow: 0 15px 40px rgba(0,0,0,0.2); transform: scale(0.95);
            transition: transform 0.3s ease, opacity 0.3s ease; opacity: 0; display: flex;
            flex-direction: column; max-height: 80vh; overflow: hidden;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #333;
        }
        .mms-settings-overlay.visible .mms-settings-panel { transform: scale(1); opacity: 1; }
        .mms-settings-panel h2 {
            margin: 0; padding: 20px; font-size: 18px; font-weight: 600; border-bottom: 1px solid #eee;
        }
        .mms-settings-panel .content { padding: 20px; overflow-y: auto; flex: 1; }
        .mms-settings-panel .form-group { margin-bottom: 20px; display: flex; flex-direction: column; }
        .mms-settings-panel label, .mms-settings-panel .switch-label {
            display: block; font-weight: 500; margin-bottom: 8px; font-size: 14px;
        }
        .mms-settings-panel input[type="text"], 
        .mms-settings-panel input[type="number"], 
        .mms-settings-panel textarea, 
        .mms-settings-panel select {
            width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 6px;
            box-sizing: border-box; font-size: 14px; background-color: #fff;
        }
        .mms-settings-panel textarea { min-height: 80px; resize: vertical; }
        .mms-settings-panel .switch {
            display: flex; align-items: center; justify-content: space-between; margin-bottom: 0;
        }
        .mms-settings-panel .switch-label { margin-bottom: 0; }
        .mms-settings-panel .switch-control { cursor: pointer; }
        .mms-settings-panel .switch input { display: none; }
        .mms-settings-panel .switch .slider {
            display: inline-block; width: 40px; height: 22px; background: #ccc; border-radius: 11px;
            position: relative; transition: background 0.2s ease; vertical-align: middle;
        }
        .mms-settings-panel .switch .slider::before {
            content: ''; position: absolute; width: 18px; height: 18px; background: #fff;
            border-radius: 50%; top: 2px; left: 2px; transition: transform 0.2s ease;
            box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        }
        .mms-settings-panel .switch input:checked + .slider { background: #4CAF50; }
        .mms-settings-panel .switch input:checked + .slider::before { transform: translateX(18px); }
        .mms-settings-panel .footer {
            padding: 15px 20px; border-top: 1px solid #eee; text-align: right; background-color: #f9f9f9;
        }
        .mms-settings-panel .action-button, .mms-settings-panel button.save {
            padding: 10px 20px; border: none; background-color: #007bff; color: white;
            border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500;
            transition: background-color 0.2s ease, transform 0.1s ease;
        }
        .mms-settings-panel .action-button:hover, .mms-settings-panel button.save:hover { background-color: #0056b3; }
        .mms-settings-panel .action-button:active, .mms-settings-panel button.save:active { transform: scale(0.98); }

        /* --- 局域网设备面板样式 --- */
        .mms-lan-panel .header {
            display: flex; justify-content: space-between; align-items: center; padding: 0 20px;
            height: 65px; border-bottom: 1px solid #eee; flex-shrink: 0;
        }
        .mms-lan-panel h2 { border-bottom: none; padding: 0; }
        .mms-lan-panel .status { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #666; }
        .mms-lan-panel .status .dot {
            width: 10px; height: 10px; border-radius: 50%; background-color: #ccc;
            transition: background-color 0.3s ease;
        }
        .mms-lan-panel .status .dot.connecting { background-color: #f39c12; }
        .mms-lan-panel .status .dot.connected { background-color: #2ecc71; }
        .mms-lan-panel .status .dot.disconnected { background-color: #e74c3c; }
        .mms-lan-panel .content { padding: 0; }
        
        .mms-lan-scanner {
            position: relative; height: 200px; background: radial-gradient(circle, #f5faff 0%, #e6f2ff 100%);
            display: flex; align-items: center; justify-content: center; overflow: hidden; border-bottom: 1px solid #eee;
        }
        .mms-lan-scanner .mms-scan-wave {
            position: absolute; width: 100px; height: 100px; border-radius: 50%;
            border: 2px solid rgba(0, 123, 255, 0.5); background: transparent;
            opacity: 0; pointer-events: none;
        }
        .mms-lan-scanner.active .mms-scan-wave { animation: sonar-wave 2s infinite ease-out; }
        .mms-lan-scanner.active .mms-scan-wave:nth-child(2) { animation-delay: 0.5s; }
        .mms-lan-scanner.active .mms-scan-wave:nth-child(3) { animation-delay: 1s; }

        .mms-device-icon {
            z-index: 1; text-align: center; color: #007bff;
        }
        .mms-device-icon svg { width: 48px; height: 48px; fill: currentColor; }
        .mms-device-icon span { display: block; font-size: 12px; font-weight: 500; margin-top: 4px; }
        
        .mms-device-list-container { padding: 15px 20px; }
        .mms-device-list-container h3 { margin: 0 0 10px; font-size: 14px; color: #333; }
        .mms-device-list { list-style: none; padding: 0; margin: 0; }
        .mms-device-list .no-devices { color: #888; text-align: center; padding: 20px; font-size: 14px; }
        .mms-device-list .device-item {
            display: flex; align-items: center; padding: 12px 0; border-bottom: 1px solid #f0f0f0;
            gap: 12px; transition: background-color 0.2s;
        }
        .mms-device-list .device-item:last-child { border-bottom: none; }
        .mms-device-list .device-status-dot {
            width: 8px; height: 8px; border-radius: 50%; background-color: #ccc; flex-shrink: 0;
        }
        .device-item[data-state="connecting"] .device-status-dot { background-color: #f39c12; }
        .device-item[data-state="connected"] .device-status-dot { background-color: #2ecc71; }
        .device-item[data-state="failed"] .device-status-dot { background-color: #e74c3c; }
        
        .mms-device-list .device-id { flex-grow: 1; font-size: 14px; font-family: monospace; }
        .mms-device-list .device-state { font-size: 12px; color: #666; }
        /* --- Toast 提示样式 --- */
        .mms-toast-container{position:fixed;top:20px;left:50%;transform:translateX(-50%);z-index:999999999;pointer-events:none;display:flex;flex-direction:column;gap:10px;align-items:center}
        .mms-toast{background:#fff;border-radius:8px;padding:12px 20px;box-shadow:0 4px 12px rgba(0,0,0,0.15);display:flex;align-items:center;gap:10px;min-width:200px;max-width:400px;opacity:0;transform:translateY(-20px);transition:all .3s ease;pointer-events:all;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:14px;line-height:1.5}
        .mms-toast.visible{opacity:1;transform:translateY(0)}
        .mms-toast-icon{display:flex;align-items:center;justify-content:center;width:20px;height:20px;flex-shrink:0}
        .mms-toast-icon svg{width:100%;height:100%;fill:currentColor}
        .mms-toast-success{background:#f0f9ff;border:1px solid #bae6fd;color:#0369a1}
        .mms-toast-success .mms-toast-icon{color:#10b981}
        .mms-toast-error{background:#fef2f2;border:1px solid #fecaca;color:#991b1b}
        .mms-toast-error .mms-toast-icon{color:#ef4444}
        .mms-toast-info{background:#f0f9ff;border:1px solid #bfdbfe;color:#1e40af}
        .mms-toast-info .mms-toast-icon{color:#3b82f6}
        .mms-toast-message{flex:1;word-break:break-word}
        `;
    }
}