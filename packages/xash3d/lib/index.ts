import Xash from './xash'

export type FS = {
    mkdir(path: string): void
    mkdirTree(path: string): void
    writeFile(path: string, data: Uint8Array<ArrayBufferLike>): void
    chdir(path: string): void
}

export type RenderLibrariesOptions = {
    soft?: string
    gles3compat?: string
}

export type LibrariesOptions = {
    filesystem?: string
    server?: string
    menu?: string
    client?: string
    xash?: string
    render?: RenderLibrariesOptions
}

export const DEFAULT_XASH_LIBRARY = "xash.wasm"
export const DEFAULT_FILESYSTEM_LIBRARY = "filesystem_stdio.wasm"
export const DEFAULT_GLES3COMPAT_LIBRARY = "libref_gles3compat.wasm"
export const DEFAULT_SOFT_LIBRARY = "libref_soft.wasm"
export const DEFAULT_MENU_LIBRARY = "cl_dlls/menu_emscripten_wasm32.wasm"
export const DEFAULT_CLIENT_LIBRARY = "cl_dlls/client_emscripten_wasm32.wasm"
export const DEFAULT_SERVER_LIBRARY = "dlls/hl_emscripten_wasm32.so"

export type Xash3DRenderer = 'gles3compat' | 'soft'

export type Xash3DOptions = {
    args?: string[]
    canvas?: HTMLCanvasElement
    renderer?: Xash3DRenderer
    onRuntimeInitialized?: () => void
    filesMap?: Record<string, string>
    libraries?: LibrariesOptions
    dynamicLibraries?: string[]
    onStart?: (FS: FS) => Promise<void>
}

export class Xash3D {
    opts?: Xash3DOptions

    private exited = false
    private running = false

    private funcs?: {Cmd_ExecuteString: (cmd: string) => void}

    constructor(opts: Xash3DOptions = {}) {
        this.opts = opts;

        if (!this.opts.filesMap) {
            this.opts.filesMap = {}
        }
        if (opts?.libraries?.filesystem) {
            this.opts.filesMap[DEFAULT_FILESYSTEM_LIBRARY] = opts.libraries.filesystem
        }
        if (opts?.libraries?.client) {
            this.opts.filesMap[DEFAULT_CLIENT_LIBRARY] = opts.libraries.client
        }
        if (opts?.libraries?.server) {
            this.opts.filesMap[DEFAULT_SERVER_LIBRARY] = opts.libraries.server
        }
        if (opts?.libraries?.menu) {
            this.opts.filesMap[DEFAULT_MENU_LIBRARY] = opts.libraries.menu
        }
        switch (opts?.renderer) {
            case 'soft':
                if (opts?.libraries?.render?.soft) {
                    this.opts.filesMap[DEFAULT_SOFT_LIBRARY] = opts.libraries.render.soft
                }
                break
            default:
                if (opts?.libraries?.render?.gles3compat) {
                    this.opts.filesMap[DEFAULT_GLES3COMPAT_LIBRARY] = opts.libraries.render.gles3compat
                }
                break
        }
    }

    Cmd_ExecuteString(cmd: string) {
        this.funcs?.Cmd_ExecuteString?.(cmd)
    }

    Sys_Quit() {
        this.Cmd_ExecuteString('quit')
    }

    async run() {
        if (this.running) return
        this.running = true;
        const canvas = this.opts?.canvas;
        const ctx = canvas && this.opts?.renderer !== 'soft'
            ? canvas.getContext('webgl2', {alpha:false, depth: true, stencil: true, antialias: true})
            : undefined;
        const dynamicLibraries = [
            this.opts?.libraries?.filesystem ?? DEFAULT_FILESYSTEM_LIBRARY,
            this.opts?.renderer !== 'soft'
                ? (this.opts?.libraries?.render?.gles3compat ?? DEFAULT_GLES3COMPAT_LIBRARY)
                : (this.opts?.libraries?.render?.soft ??  DEFAULT_SOFT_LIBRARY),
            this.opts?.libraries?.menu ?? DEFAULT_MENU_LIBRARY,
            this.opts?.libraries?.server ?? DEFAULT_SERVER_LIBRARY,
            this.opts?.libraries?.client ?? DEFAULT_CLIENT_LIBRARY,
            ...(this.opts?.dynamicLibraries ?? [])
        ]
        this.funcs = await Xash({
            arguments: this.opts?.args,
            filesMap: this.opts?.filesMap,
            mainWasmPath: this.opts?.libraries?.xash ?? DEFAULT_XASH_LIBRARY,
            canvas,
            ctx,
            dynamicLibraries,
            onStart: this.opts?.onStart,
            onRuntimeInitialized: this?.opts?.onRuntimeInitialized
        })
        if (this.exited) {
            this.Sys_Quit()
        }
    }

    exit() {
        if (this.exited || !this.running) return
        this.exited = true;
        this.running = false;
        this.Sys_Quit()
    }
}