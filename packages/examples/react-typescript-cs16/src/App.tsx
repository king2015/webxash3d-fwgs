import React, {FC, useEffect, useRef} from 'react';
import {Xash3D} from "xash3d-fwgs";
import filesystemURL from 'xash3d-fwgs/dist/filesystem_stdio.wasm'
import xashURL from 'xash3d-fwgs/dist/xash.wasm'
import menuURL from 'cs16-client/dist/cl_dlls/menu_emscripten_wasm32.wasm'
import clientURL from 'cs16-client/dist/cl_dlls/client_emscripten_wasm32.wasm'
import serverURL from 'cs16-client/dist/dlls/cs_emscripten_wasm32.so'
import gles3URL from 'xash3d-fwgs/dist/libref_gles3compat.wasm'
import {loadAsync} from 'jszip'
import './App.css';

const App: FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        const x = new Xash3D({
            canvas: canvasRef.current!,
            args: ['-windowed', '-game', 'cstrike', '+_vgui_menus', '0'],
            libraries: {
                filesystem: filesystemURL,
                xash: xashURL,
                menu: menuURL,
                server: serverURL,
                client: clientURL,
                render: {
                    gles3compat: gles3URL,
                }
            },
            filesMap: {
                'dlls/cs_emscripten_wasm32.so': serverURL,
                '/rwdir/filesystem_stdio.so': filesystemURL,
            },

            onStart: async FS => {
                const res = await fetch('valve.zip')
                const zip = await loadAsync(await res.arrayBuffer());
                for (const [filename, file] of Object.entries(zip.files)) {
                    if (file.dir) continue;

                    const path = '/rodir/' + filename;
                    const dir = path.split('/').slice(0, -1).join('/');

                    FS.mkdirTree(dir);
                    FS.writeFile(path, await file.async("uint8array"));
                }

                FS.chdir('/rodir')
            }
        })

        x.run()

        return () => {
            x.quit()
        }
    }, []);

    return (
        <>
            <canvas id="canvas" ref={canvasRef}/>
        </>
    );
}

export default App;
