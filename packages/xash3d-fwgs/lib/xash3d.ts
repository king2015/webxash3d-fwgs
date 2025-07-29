import Xash, {Em, Module} from './generated/xash'
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
    canvas?: HTMLCanvasElement
    renderer?: Xash3DRenderer
    filesMap?: Record<string, string>
    libraries?: LibrariesOptions
    dynamicLibraries?: string[]
    module?: Partial<Module>
}

export class Xash3D {
    opts: Xash3DOptions

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

    private emPromise?: Promise<void>

    constructor(opts: Xash3DOptions = {}) {
        this.opts = opts;
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
        if (!this.emPromise) {
            this.emPromise = this.runEm()
        }
        await this.emPromise
        if (this.exited) {
            this.Sys_Quit()
            return
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

    private locateFile(path: string) {
        return this.opts.filesMap![path] ?? path
    }

    private initRender(canvas?: HTMLCanvasElement, render: Xash3DOptions['renderer'] = 'gles3compat') {
        switch (render) {
            case 'gles3compat':
                if (this.opts?.libraries?.render?.gles3compat) {
                    this.opts.filesMap![DEFAULT_GLES3COMPAT_LIBRARY] = this.opts.libraries.render.gles3compat
                }
                this.opts.dynamicLibraries!.push(DEFAULT_GLES3COMPAT_LIBRARY)
                return canvas?.getContext('webgl2', {
                    alpha: false,
                    depth: true,
                    stencil: true,
                    antialias: true,
                }) ?? null
            default:
                if (this.opts?.libraries?.render?.soft) {
                    this.opts.filesMap![DEFAULT_SOFT_LIBRARY] = this.opts.libraries.render.soft
                }
                this.opts.dynamicLibraries!.push(DEFAULT_SOFT_LIBRARY)
                return null
        }
    }

    initLibrary(library: keyof Omit<LibrariesOptions, 'render'>, defaultPath: string) {
        if (this.opts.libraries?.[library]) {
            this.opts.filesMap![defaultPath] = this.opts.libraries[library]
        }
    }

    private async runEm() {
        if (!this.opts.filesMap) {
            this.opts.filesMap = {}
        }
        if (!this.opts.dynamicLibraries) {
            this.opts.dynamicLibraries = []
        }

        this.initLibrary('filesystem', DEFAULT_FILESYSTEM_LIBRARY)
        this.initLibrary('client', DEFAULT_CLIENT_LIBRARY)
        this.initLibrary('server', DEFAULT_SERVER_LIBRARY)
        this.initLibrary('menu', DEFAULT_MENU_LIBRARY)
        if (this.opts.libraries?.xash) {
            this.opts.filesMap[DEFAULT_XASH_LIBRARY] = this.opts.libraries.xash
        }

        const canvas = this.opts?.canvas;
        const ctx = this.initRender(canvas, this.opts.renderer)
        const dynamicLibraries = [
            DEFAULT_FILESYSTEM_LIBRARY,
            DEFAULT_MENU_LIBRARY,
            DEFAULT_SERVER_LIBRARY,
            DEFAULT_CLIENT_LIBRARY,
            ...this.opts.dynamicLibraries,
        ]
        this.em = await Xash({
            canvas,
            ctx,
            dynamicLibraries,
            sendto: this.net?.sendto,
            recvfrom: this.net?.recvfrom,
            locateFile: path => this.locateFile(path),
            ...(this.opts.module ?? {}),
        })
        if (this.net) {
            this.net.init(this.em)
        }
    }
}