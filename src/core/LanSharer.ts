import { Logger } from './Logger';
import { IConfig } from '../types';

// 使用一个公开的WebSocket服务作为信令服务器进行设备发现
const SIGNALING_SERVER_URL = 'wss://websockets.chilvers.io/';

// 定义信令消息的类型
interface SignalingMessage {
    type: 'user-joined' | 'offer' | 'answer' | 'ice-candidate' | 'user-left' | 'error';
    from: string;
    to?: string;
    payload?: any;
}

export type Peer = {
    id: string;
    state: RTCPeerConnectionState;
};

export class LanSharer {
    private ws: WebSocket | null = null;
    private peerConnections: Map<string, RTCPeerConnection> = new Map();
    private dataChannels: Map<string, RTCDataChannel> = new Map();
    private localId: string;
    private networkId: string = 'miku-share-default-network'; // 默认房间号

    // --- 事件回调，用于更新UI ---
    public onSignalingStateChange: ((state: 'connecting' | 'connected' | 'disconnected') => void) | null = null;
    public onPeersUpdate: ((peers: Peer[]) => void) | null = null;

    constructor(config: IConfig) {
        this.localId = config.deviceId;
    }

    // --- 公共方法 ---

    public connect(networkId: string) {
        this.networkId = networkId || this.networkId;
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            Logger.log('已连接到信令服务器。');
            return;
        }

        this.onSignalingStateChange?.('connecting');
        this.ws = new WebSocket(SIGNALING_SERVER_URL);

        this.ws.onopen = () => {
            Logger.log('成功连接到信令服务器。正在加入网络...');
            this.onSignalingStateChange?.('connected');
            // 发送加入房间的信令
            this.sendMessage({
                type: 'user-joined',
                from: this.localId,
                payload: { networkId: this.networkId }
            });
        };

        this.ws.onmessage = (event) => {
            const message: SignalingMessage = JSON.parse(event.data);
            if (message.from === this.localId || (message.to && message.to !== this.localId)) {
                return; // 忽略自己或发给别人的消息
            }
            this.handleSignalingMessage(message);
        };

        this.ws.onclose = () => {
            Logger.warn('与信令服务器的连接已断开。');
            this.onSignalingStateChange?.('disconnected');
            this.disconnectAllPeers();
        };

        this.ws.onerror = (error) => {
            Logger.error('信令服务器连接错误:', error);
            this.onSignalingStateChange?.('disconnected');
        };
    }

    public disconnect() {
        this.ws?.close();
        this.disconnectAllPeers();
    }

    public sendUrlToAll(url: string): number {
        let sentCount = 0;
        this.dataChannels.forEach((channel, peerId) => {
            if (channel.readyState === 'open') {
                channel.send(JSON.stringify({ type: 'url', payload: url }));
                sentCount++;
                Logger.log(`已将链接发送到设备 ${peerId}`);
            }
        });
        return sentCount; // 返回发送数量
    }

    // --- 私有方法 ---

    private handleSignalingMessage(message: SignalingMessage) {
        Logger.log('收到信令:', message);
        switch (message.type) {
            case 'user-joined':
                this.createOffer(message.from);
                break;
            case 'offer':
                this.createAnswer(message.from, message.payload);
                break;
            case 'answer':
                this.handleAnswer(message.from, message.payload);
                break;
            case 'ice-candidate':
                this.handleIceCandidate(message.from, message.payload);
                break;
            case 'user-left':
                this.disconnectPeer(message.from);
                break;
        }
    }

    private createPeerConnection(peerId: string): RTCPeerConnection {
        if (this.peerConnections.has(peerId)) {
            return this.peerConnections.get(peerId)!;
        }

        const pc = new RTCPeerConnection({
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        });

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                this.sendMessage({
                    type: 'ice-candidate',
                    from: this.localId,
                    to: peerId,
                    payload: event.candidate,
                });
            }
        };

        pc.onconnectionstatechange = () => {
            this.updatePeersStatus();
        };

        pc.ondatachannel = (event) => {
            const channel = event.channel;
            this.dataChannels.set(peerId, channel);
            channel.onopen = () => Logger.log(`与 ${peerId} 的数据通道已打开。`);
            channel.onmessage = (ev) => {
                const data = JSON.parse(ev.data);
                if (data.type === 'url' && data.payload) {
                    window.open(data.payload, '_blank');
                }
            };
        };

        this.peerConnections.set(peerId, pc);
        this.updatePeersStatus();
        return pc;
    }

    private async createOffer(peerId: string) {
        const pc = this.createPeerConnection(peerId);
        const dataChannel = pc.createDataChannel('url-channel');
        this.dataChannels.set(peerId, dataChannel);

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        this.sendMessage({
            type: 'offer',
            from: this.localId,
            to: peerId,
            payload: pc.localDescription,
        });
    }

    private async createAnswer(peerId: string, offer: RTCSessionDescriptionInit) {
        const pc = this.createPeerConnection(peerId);
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        this.sendMessage({
            type: 'answer',
            from: this.localId,
            to: peerId,
            payload: pc.localDescription,
        });
    }

    private async handleAnswer(peerId: string, answer: RTCSessionDescriptionInit) {
        const pc = this.peerConnections.get(peerId);
        if (pc) {
            await pc.setRemoteDescription(new RTCSessionDescription(answer));
        }
    }

    private async handleIceCandidate(peerId: string, candidate: RTCIceCandidateInit) {
        const pc = this.peerConnections.get(peerId);
        if (pc) {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
    }

    private disconnectPeer(peerId: string) {
        this.peerConnections.get(peerId)?.close();
        this.peerConnections.delete(peerId);
        this.dataChannels.delete(peerId);
        this.updatePeersStatus();
    }

    private disconnectAllPeers() {
        this.peerConnections.forEach(pc => pc.close());
        this.peerConnections.clear();
        this.dataChannels.clear();
        this.updatePeersStatus();
    }

    private sendMessage(message: SignalingMessage) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            const msgWithNetwork = { ...message, payload: { ...message.payload, networkId: this.networkId } };
            this.ws.send(JSON.stringify(msgWithNetwork));
        }
    }

    private updatePeersStatus() {
        const peers: Peer[] = Array.from(this.peerConnections.entries()).map(([id, pc]) => ({
            id,
            state: pc.connectionState,
        }));
        this.onPeersUpdate?.(peers);
    }
}