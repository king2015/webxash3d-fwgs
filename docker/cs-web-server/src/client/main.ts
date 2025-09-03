import {loadAsync} from 'jszip'
import filesystemURL from 'xash3d-fwgs/filesystem_stdio.wasm?url'
import xashURL from 'xash3d-fwgs/xash.wasm?url'
import menuURL from 'cs16-client/cl_dll/menu_emscripten_wasm32.wasm?url'
import clientURL from 'cs16-client/cl_dlls/client_emscripten_wasm32.wasm?url'
import serverURL from 'cs16-client/dlls/cs_emscripten_wasm32.so?url'
import gl4esURL from 'xash3d-fwgs/libref_webgl2.wasm?url'
import extrasURL from 'cs16-client/extras.pk3?url'
import {Xash3DWebRTC} from "./webrtc";

let usernamePromiseResolve: (name: string) => void
const usernamePromise = new Promise<string>(resolve => {
    usernamePromiseResolve = resolve
})

async function main() {
    const x = new Xash3DWebRTC({
        canvas: document.getElementById('canvas') as HTMLCanvasElement,
        arguments: ['-windowed', '-game', 'cstrike'],
        libraries: {
            filesystem: filesystemURL,
            xash: xashURL,
            menu: menuURL,
            server: serverURL,
            client: clientURL,
            render: {
                gl4es: gl4esURL,
            }
        },
        dynamicLibraries: ['dlls/cs_emscripten_wasm32.so', '/rwdir/filesystem_stdio.wasm'],
        filesMap: {
            'dlls/cs_emscripten_wasm32.so': serverURL,
            '/rwdir/filesystem_stdio.wasm': filesystemURL,
        },
    });

    const [zip, extras] = await Promise.all([
        (async () => {
            const res = await fetch('valve.zip')
            return await loadAsync(await res.arrayBuffer());
        })(),
        (async () => {
            const res = await fetch(extrasURL)
            return await res.arrayBuffer();
        })(),
        x.init(),
    ])

    await Promise.all(Object.entries(zip.files).map(async ([filename, file]) => {
        if (file.dir) return;

        const path = '/rodir/' + filename;
        const dir = path.split('/').slice(0, -1).join('/');

        x.em.FS.mkdirTree(dir);
        x.em.FS.writeFile(path, await file.async("uint8array"));
    }))

    x.em.FS.writeFile('/rodir/cstrike/extras.pk3', new Uint8Array(extras))
    const isMobile = !window.matchMedia('(hover: hover)').matches

    x.em.FS.chdir('/rodir')

    document.getElementById('logo')!.style.animationName = 'pulsate-end'
    document.getElementById('logo')!.style.animationFillMode = 'forwards'
    document.getElementById('logo')!.style.animationIterationCount = '1'
    document.getElementById('logo')!.style.animationDirection = 'normal'

    const username = await usernamePromise
    x.main()
    x.Cmd_ExecuteString('_vgui_menus 0')
    if (isMobile) {
        x.Cmd_ExecuteString('touch_enable 1')
    }
    x.Cmd_ExecuteString(`name "${username}"`)
    x.Cmd_ExecuteString('connect 127.0.0.1:8080')

    window.addEventListener('beforeunload', (event) => {
        event.preventDefault();
        event.returnValue = '';
        return '';
    });
}

const username = localStorage.getItem('username')
if (username) {
    (document.getElementById('username') as HTMLInputElement).value = username
}

(document.getElementById('form') as HTMLFormElement).addEventListener('submit', (e) => {
    e.preventDefault()
    const username = (document.getElementById('username') as HTMLInputElement).value
    localStorage.setItem('username', username);
    (document.getElementById('form') as HTMLFormElement).style.display = 'none'
    usernamePromiseResolve(username)
})

main()