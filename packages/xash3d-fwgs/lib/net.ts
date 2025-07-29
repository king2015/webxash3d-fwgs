import {Em, Module} from "./generated/xash";
import {Queue} from "./utils";

export interface Packet {
    data: Int8Array<ArrayBufferLike>
    ip: [number, number, number, number]
    port: number
}

export interface SendtoSender {
    sendto: (data: Packet) => void
}

export class Net {
    public sendto: Module['sendto']
    public recvfrom: Module['recvfrom']

    public sender: SendtoSender

    incoming = new Queue<Packet>()

    em?: Em

    constructor(sender: SendtoSender) {
        this.sender = sender
        this.sendto = (sockfd, packets, sizes, packet_count, seq_num, to, to_len) => {
            const em = this.em!;
            const heapU8 = em.HEAPU8;
            const heap32 = em.HEAP32;
            let totalSize = 0;

            const ipOffset = to + 4;
            const ip: [number, number, number, number] = [
                heapU8[ipOffset],
                heapU8[ipOffset + 1],
                heapU8[ipOffset + 2],
                heapU8[ipOffset + 3]
            ];

            const portOffset = to + 2;
            const port = (heapU8[portOffset] << 8) | heapU8[portOffset + 1];

            for (let i = 0; i < packet_count; ++i) {
                const size = heap32[(sizes >> 2) + i];
                const packetPtr = heap32[(packets >> 2) + i];
                totalSize += size;

                const packetView = heapU8.subarray(packetPtr, packetPtr + size); // zero-copy view
                this.sender.sendto({ data: packetView, ip, port }); // no copy
            }

            return totalSize;
        };
        this.recvfrom = (sockfd, buf, len, flags, src_addr, addrlen) => {
            const packet = this.incoming.dequeue();
            if (!packet) return -1;

            const em = this.em!;
            const data = packet.data;
            const u8 = data instanceof Uint8Array ? data : new Uint8Array(data.buffer || data);
            const copyLen = Math.min(len, u8.length);

            if (copyLen > 0) {
                em.HEAPU8.set(u8.subarray(0, copyLen), buf);
            }

            if (src_addr) {
                const heap8 = em.HEAP8;
                const heap16 = em.HEAP16;
                const base16 = src_addr >> 1;

                const port = packet.port;
                heap16[base16] = 2; // AF_INET

                heap8[src_addr + 2] = (port >> 8) & 0xFF;
                heap8[src_addr + 3] = port & 0xFF;

                heap8[src_addr + 4] = packet.ip[0];
                heap8[src_addr + 5] = packet.ip[1];
                heap8[src_addr + 6] = packet.ip[2];
                heap8[src_addr + 7] = packet.ip[3];
            }

            if (addrlen) {
                em.HEAP32[addrlen >> 2] = 16;
            }

            return copyLen;
        };
    }

    init(em: Em) {
        if (this.em) return

        this.em = em
    }
}