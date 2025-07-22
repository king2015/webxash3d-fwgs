import {Em} from "./generated/xash";
import {Queue} from "./utils";

export type Packet = {
    data: Int8Array<ArrayBufferLike>
}

export type SendtoCallback = (data: Packet) => void

export class Net {
    private sendtoCb?: SendtoCallback
    private sendtoPointer?: number
    private recvfromPointer?: number

    incoming = new Queue<Packet>()

    em?: Em

    run(em: Em) {
        if (this.em) return

        this.em = em
        this.registerRecvfromCallback()
        if (this.sendtoCb) {
            const cb = this.sendtoCb
            this.sendtoCb = undefined
            this.registerSendtoCallback(cb)
        }
    }

    private clearCallback(name: string, pointer?: number) {
        if (!pointer || !this.em) return false
        this.em.Module.ccall(name, null, ['number'], [0]);
        this.em.removeFunction(pointer)
        return true
    }

    registerSendtoCallback(cb: SendtoCallback) {
        if (!this.em) {
            this.sendtoCb = cb
            return
        }
        const callback = (message: number, length: number, flags: number) => {
            const em = this.em;
            if (!em) return;

            const heap = em.HEAPU8;
            const end = message + length;

            if (!heap || length <= 0 || message < 0 || end > heap.length) return;

            const view = heap.subarray(message, end);
            cb({ data: view });
        }
        this.clearSendtoCallback()
        this.sendtoPointer = this.em.addFunction(callback, 'viii')
        this.em.Module.ccall('register_sendto_callback', null, ['number'], [this.sendtoPointer]);
    }

    clearSendtoCallback() {
        if (this.clearCallback('register_sendto_callback', this.sendtoPointer)) {
            this.sendtoPointer = undefined
        }
        this.sendtoCb = undefined
    }

    private registerRecvfromCallback() {
        if (!this.em || this.recvfromPointer) return
        const recvfromCallback = (sockfd: number, buf: number, len: number, flags: number, src_addr: number, addrlen: number) => {
            const packet = this.incoming.dequeue();
            if (!packet) return -1;

            const em = this.em!;
            const data = packet.data instanceof Uint8Array ? packet.data : new Uint8Array(packet.data);
            const copyLen = Math.min(len, data.length);
            if (copyLen > 0) {
                em.HEAPU8.set(data.subarray(0, copyLen), buf);
            }

            if (src_addr) {
                const base8 = src_addr;
                const base16 = src_addr >> 1;
                const heap8 = em.HEAP8;
                em.HEAP16[base16] = 2;
                heap8[base8 + 2] = 0x1F;
                heap8[base8 + 3] = 0x90;
                heap8[base8 + 4] = 127;
                heap8[base8 + 5] = 0;
                heap8[base8 + 6] = 0;
                heap8[base8 + 7] = 1;
            }

            if (addrlen) {
                em.HEAP32[addrlen >> 2] = 16;
            }

            return copyLen;
        }
        this.recvfromPointer = this.em.addFunction(recvfromCallback, 'iiiiiii')
        this.em.Module.ccall('register_recvfrom_callback', null, ['number'], [this.recvfromPointer]);
    }

    clearRecvfromCallback() {
        if (this.clearCallback('register_recvfrom_callback', this.recvfromPointer)) {
            this.recvfromPointer = undefined
        }
    }

    clear() {
        this.clearSendtoCallback()
        this.clearRecvfromCallback()
    }
}