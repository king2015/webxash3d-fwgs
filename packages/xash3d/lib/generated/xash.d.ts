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

export type EngineFuncs = {
    Module: Module
    FS: FS
    start: () => void
}

const Xash: (moduleArg?: {
    arguments?: string[]
    filesMap?: Record<string, string>
    mainWasmPath?: string
    canvas?: HTMLCanvasElement
    ctx?: WebGL2RenderingContext | CanvasRenderingContext2D | null
    dynamicLibraries?: string[]
    onRuntimeInitialized?: () => void
}) => Promise<EngineFuncs>
export default Xash
