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

    init(em: Em) {
        if (this.em) return

        this.em = em
        this.registerRecvfromCallback()
        if (this.sendtoCb) {
            const cb = this.sendtoCb
            this.sendtoCb = undefined
            this.registerSendtoCallback(cb)
        }
    }

    clearCallback(name: string, pointer?: number) {
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
            const view = this?.em?.HEAPU8?.subarray(message, message + length);
            if (!view) return
            cb({
                data: view,
            })
        }
        this.clearSendtoCallback()
        this.sendtoPointer = this.em.addFunction(callback, 'viii')
        this.em.Module.ccall('retgister_sendto_callback', null, ['number'], [this.sendtoPointer]);
    }

    clearSendtoCallback() {
        if (this.clearCallback('retgister_sendto_callback', this.sendtoPointer)) {
            this.sendtoPointer = undefined
        }
        this.sendtoCb = undefined
    }

    private registerRecvfromCallback() {
        if (!this.em || this.recvfromPointer) return
        const recvfromCallback = (sockfd: number, buf: number, len: number, flags: number, src_addr: number, addrlen: number) => {
            const packet = this.incoming.dequeue()
            if (!packet) {
                return -1
            }
            const dataView = new Uint8Array(packet.data);
            const copyLen = Math.min(len, dataView.length);
            this.em!.HEAPU8.set(dataView.subarray(0, copyLen), buf);

            if (src_addr) {
                this.em!.HEAP16[src_addr >> 1] = 2;
                this.em!.HEAP8[(src_addr + 2)] = 0x1F;
                this.em!.HEAP8[(src_addr + 3)] = 0x90;
                this.em!.HEAP8[(src_addr + 4)] = 127;
                this.em!.HEAP8[(src_addr + 5)] = 0;
                this.em!.HEAP8[(src_addr + 6)] = 0;
                this.em!.HEAP8[(src_addr + 7)] = 1;
            }

            if (addrlen) {
                this.em!.HEAP32[addrlen >> 2] = 16;
            }

            return copyLen;
        }
        this.recvfromPointer = this.em.addFunction(recvfromCallback, 'iiiiiii')
        this.em.Module.ccall('retgister_recvfrom_callback', null, ['number'], [this.recvfromPointer]);
    }

    clearRecvfromCallback() {
        if (this.clearCallback('retgister_recvfrom_callback', this.recvfromPointer)) {
            this.recvfromPointer = undefined
        }
    }

    clear() {
        this.clearSendtoCallback()
        this.clearRecvfromCallback()
    }
}