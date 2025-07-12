import {promises as fs} from 'fs';

class CompileFile {
    private readonly raw: string
    private data: string

    constructor(raw: string) {
        this.raw = raw
        this.data = raw
    }

    replaceAll(find: string, replace: string) {
        this.data = this.data.split(find).join(replace)
    }

    deleteAll(find: string) {
        this.replaceAll(find, '')
    }

    save() {
        return Promise.all([
            fs.writeFile('./lib/generated/raw.js', this.raw),
            fs.writeFile('./lib/generated/xash.js', this.data),
        ])
    }
}

async function main() {
    const raw = await fs.readFile('./dist/raw.js', 'utf8');
    const f = new CompileFile(raw)

    // fix CJS export to EJS
    f.replaceAll(`if (typeof exports === 'object' && typeof module === 'object') {
  module.exports = Xash3D;
  // This default export looks redundant, but it allows TS to import this
  // commonjs style module.
  module.exports.default = Xash3D;
} else if (typeof define === 'function' && define['amd'])
  define([], () => Xash3D);`, 'export default Xash3D;')

    // add on start async FS callback
    f.deleteAll('preInit();')
    f.deleteAll('run();')

    // replace filenames to custom paths
    f.replaceAll('filename = PATH.normalize(filename);', 'filename = PATH.normalize(filename); filename = moduleArg?.filesMap?.[filename] ?? filename;')

    // return engine funcs instead of runtime promise
    f.replaceAll('return moduleRtn;', `
        return {
            Module,
            FS,
            HEAP32,
            HEAP16,
            HEAP8,
            HEAPU8,
            addFunction,
            removeFunction,
            start: () => {
                preInit();
                run();
            },
        };
    `)

    // customize main wasm path
    f.replaceAll("'xash.wasm'", 'moduleArg.mainWasmPath')

    await f.save()
}

main()
