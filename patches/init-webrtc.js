let channel = null
let pc = null

class Queue {
    enqueue(value) {
        const node = {value}
        if (this.tail) this.tail.next = node;
        else this.head = node;
        this.tail = node;
    }

    dequeue() {
        if (!this.head) return null;
        const value = this.head.value;
        this.head = this.head.next;
        if (!this.head) this.tail = null;
        return value;
    }
}

const incoming = new Queue()

class Media {
    initConnection(stream) {
        if (this.peer) return

        this.peer = new RTCPeerConnection()
        this.peer.onicecandidate = e => {
            if (!e.candidate) {
                return
            }
            this.ws.send(JSON.stringify({
                event: 'candidate',
                data: JSON.stringify(e.candidate.toJSON())
            }))
        }
        stream?.getTracks()?.forEach(t => {
            this.peer.addTrack(t, stream)
        })
        this.peer.ondatachannel = (e) => {
            e.channel.onmessage = (ee) => {
                if (ee.data.arrayBuffer) {
                    ee.data.arrayBuffer().then(data => incoming.enqueue(data))
                }else {
                    incoming.enqueue(ee.data)
                }
            }
            e.channel.onopen = () => {
                channel = e.channel
                this.resolve()
            }
        }
    }

    connect(stream) {
        return new Promise(resolve => {
            this.resolve = resolve;
            this.ws = new WebSocket("ws://localhost:27016/websocket")
            const handler = async (e) => {
                this.initConnection(stream)
                const parsed = JSON.parse(e.data)
                if (parsed.event === 'offer') {
                    await this.peer.setRemoteDescription(JSON.parse(parsed.data))
                    const answer = await this.peer.createAnswer()
                    await this.peer.setLocalDescription(answer)
                    this.ws.send(JSON.stringify({
                        event: 'answer',
                        data: JSON.stringify(answer)
                    }))
                }
                if (parsed.event === 'candidate') {
                    await this.peer.addIceCandidate(JSON.parse(parsed.data))
                }
            }
            this.ws.addEventListener('message', handler)
        })
    }
}

const media = new Media()

async function connect() {
    const stream = await navigator.mediaDevices.getUserMedia({audio: true})
    await media.connect(stream)
}

Module.onRuntimeInitialized = () => {
    window.Cmd_ExecuteString = Module.cwrap('Cmd_ExecuteString', null, ['string']);
    window.Sys_Quit = Module.cwrap('Sys_Quit', null, []);
    setTimeout(() => {
        const supportsHover = window.matchMedia('(hover: hover)').matches;
        if (!supportsHover) {
            window.Cmd_ExecuteString('touch_enable 1')
        }
    }, 5000)

    const sendtoCallback = (message, length, flags) => {
        const view = HEAPU8.subarray(message, message + length);

        if (channel) {
            channel.send(view)
        }
    }
    const sendtoFuncPtr = addFunction(sendtoCallback, 'viii');
    Module.ccall('retgister_sendto_callback', null, ['number'], [sendtoFuncPtr]);

    const recvfromCallback = (sockfd, buf, len, flags, src_addr, addrlen) => {
        const data = incoming.dequeue()
        if (!data) {
            return -1
        }
        const dataView = new Uint8Array(data);
        const copyLen = Math.min(len, dataView.length);
        HEAPU8.set(dataView.subarray(0, copyLen), buf);

        if (src_addr) {
            HEAP16[src_addr >> 1] = 2;
            HEAP8[(src_addr + 2)] = 0x1F;
            HEAP8[(src_addr + 3)] = 0x90;
            HEAP8[(src_addr + 4)] = 127;
            HEAP8[(src_addr + 5)] = 0;
            HEAP8[(src_addr + 6)] = 0;
            HEAP8[(src_addr + 7)] = 1;
        }

        if (addrlen) {
            HEAP32[addrlen >> 2] = 16;
        }

        return copyLen;
    }
    const recvfromFuncPtr = addFunction(recvfromCallback, 'iiiiiii');
    Module.ccall('retgister_recvfrom_callback', null, ['number'], [recvfromFuncPtr]);
}

async function fsInit() {
    const res = await fetch('/public/valve.zip')
    const zip = await JSZip.loadAsync(await res.arrayBuffer());
    for (const [filename, file] of Object.entries(zip.files)) {
        if (file.dir) continue;

        const path = '/rodir/' + filename;
        const dir = path.split('/').slice(0, -1).join('/');

        await FS.mkdirTree(dir);
        await FS.writeFile(path, await file.async("uint8array"));
    }

    await FS.chdir('/rodir')
}

async function start() {
    await Promise.all([fsInit(), connect()]);

    preInit();
    run();
}

start()