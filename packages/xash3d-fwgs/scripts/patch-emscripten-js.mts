import {promises as fs} from 'fs';

class CompileFile {
    private data: string

    constructor(data: string) {
        this.data = data
    }

    replaceAll(find: string, replace: string) {
        this.data = this.data.split(find).join(replace)
    }

    deleteAll(find: string) {
        this.replaceAll(find, '')
    }

    save() {
        return fs.writeFile('./lib/generated/xash.js', this.data)
    }
}

async function main() {
    const raw = await fs.readFile('./dist/raw.js', 'utf8');
    const f = new CompileFile(raw)

    // fix CJS export to EJS
    f.replaceAll(`if(typeof exports==="object"&&typeof module==="object"){module.exports=Xash3D;module.exports.default=Xash3D}else if(typeof define==="function"&&define["amd"])define([],()=>Xash3D);`,
        'export default Xash3D;')

    // add on start async FS callback
    f.deleteAll('preInit();')
    f.deleteAll('run();')

    // hack to call dynamic function inside precompiled function
    f.replaceAll('console.log("sendto")', 'return moduleArg.sendto?.(sockfd, packets, sizes, packet_count, seq_num, to, to_len)')
    f.replaceAll('console.log("recvfrom")', 'return moduleArg.recvfrom?.(sockfd, buf, len, flags, src_addr, addrlen)')

    // return engine funcs instead of runtime promise
    f.replaceAll('return moduleRtn', `
        return {
            Module,
            FS,
            HEAP32,
            HEAP16,
            HEAP8,
            HEAPU8,
            getValue,
            addFunction,
            removeFunction,
            start: () => {
                preInit();
                run();
            },
        };
    `)

    await f.save()
}

main()
