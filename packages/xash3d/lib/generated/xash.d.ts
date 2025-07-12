export type FS = {
    mkdir(path: string): void
    mkdirTree(path: string): void
    writeFile(path: string, data: Uint8Array): void
    chdir(path: string): void
}

export type Module = {
    ccall: (
        ident: string,
        returnType: 'number' | 'string' | null,
        argTypes: Array<'number' | 'string'>,
        args: Array<number | string>
    ) => number | string | void
}

export type Em = {
    Module: Module
    FS: FS
    start: () => void
    HEAP32: Int8Array
    HEAP16: Int8Array
    HEAP8: Int8Array
    HEAPU8: Int8Array
    addFunction: (func: (...params: any[]) => unknown, args: string) => number
    removeFunction: (ptr: number) => void
}

const Xash: (moduleArg?: {
    arguments?: string[]
    filesMap?: Record<string, string>
    mainWasmPath?: string
    canvas?: HTMLCanvasElement
    ctx?: WebGL2RenderingContext | CanvasRenderingContext2D | null
    dynamicLibraries?: string[]
    onRuntimeInitialized?: () => void
}) => Promise<Em>
export default Xash
