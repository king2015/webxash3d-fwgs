import Xash, {Em} from './generated/xash'
import {Net} from "./net";
import {
    DEFAULT_CLIENT_LIBRARY,
    DEFAULT_SOFT_LIBRARY,
    DEFAULT_FILESYSTEM_LIBRARY,
    DEFAULT_MENU_LIBRARY,
    DEFAULT_SERVER_LIBRARY,
    DEFAULT_GLES3COMPAT_LIBRARY,
    DEFAULT_XASH_LIBRARY
} from './constants'

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

export type Xash3DRenderer = 'gles3compat' | 'soft'

export type Xash3DOptions = {
    args?: string[]
    canvas?: HTMLCanvasElement
    renderer?: Xash3DRenderer
    onRuntimeInitialized?: () => void
    filesMap?: Record<string, string>
    libraries?: LibrariesOptions
    dynamicLibraries?: string[]
}

export class Xash3D {
    opts?: Xash3DOptions

    net?: Net

    private _exited = false
    public get exited() {
        return this._exited;
    }

    private set exited(value: boolean) {
        this._exited = value;
    }


    private _running = false
    public get running() {
        return this._running;
    }

    private set running(value: boolean) {
        this._running = value;
    }

    em?: Em

    private initPromise?: Promise<Em>

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
        this.em?.Module?.ccall(
            'Cmd_ExecuteString',
            null,
            ['string'],
            [cmd]
        )
    }

    Sys_Quit() {
        this.Cmd_ExecuteString('quit')
    }

    async init() {
        if (!this.initPromise) {
            const canvas = this.opts?.canvas;
            const ctx = canvas && this.opts?.renderer !== 'soft'
                ? canvas.getContext('webgl2', {alpha:false, depth: true, stencil: true, antialias: true})
                : null;
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
             this.initPromise = Xash({
                arguments: this.opts?.args,
                filesMap: this.opts?.filesMap,
                mainWasmPath: this.opts?.libraries?.xash ?? DEFAULT_XASH_LIBRARY,
                canvas,
                ctx,
                dynamicLibraries,
                onRuntimeInitialized: this?.opts?.onRuntimeInitialized
            })
        }
        this.em = await this.initPromise
        if (this.exited) {
            this.Sys_Quit()
            return
        }
        if (this.net) {
            this.net.init(this.em)
        }
    }

    main() {
        if (!this.em || this.running || this.exited) return
        this.running = true
        this.em.start()
    }

    quit() {
        if (this.exited || !this.running) return
        this.exited = true;
        this.running = false;
        this.Sys_Quit()
    }
}