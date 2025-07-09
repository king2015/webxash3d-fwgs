import React, {useRef} from 'react';
import {Xash3D} from "xash3d-fwgs";
import filesystemURL from 'xash3d-fwgs/dist/filesystem_stdio.wasm'
import xashURL from 'xash3d-fwgs/dist/xash.wasm'
import menuURL from 'xash3d-fwgs/dist/cl_dlls/menu_emscripten_wasm32.wasm'
import clientURL from 'hlsdk-portable/dist/cl_dll/client_emscripten_wasm32.wasm'
import serverURL from 'hlsdk-portable/dist/dlls/hl_emscripten_wasm32.so'
import gles3URL from 'xash3d-fwgs/dist/libref_gles3compat.wasm'
import './App.css';


function App() {
    const xashRef = useRef<Xash3D>(null)

    const canvasRef = useRef<HTMLCanvasElement>(null)

    return (
        <>
            <button style={{zIndex: '99', position: 'relative'}} onClick={() => {
                xashRef.current!.run()
            }}>
                start
            </button>
            <input
                className="Input"
                type="file"
                id="folder"
                multiple
                onChange={async (e) => {
                    if (!e.target?.files?.length) return

                    const x = new Xash3D({
                        canvas: canvasRef.current!,
                        libraries: {
                            filesystem: filesystemURL,
                            xash: xashURL,
                            menu: menuURL,
                            client: clientURL,
                            server: serverURL,
                            render: {
                                gles3compat: gles3URL,
                            }
                        },
                        onStart: async (fs) => {
                            await Promise.all(Array.from(e.target.files!).map(async f => {
                                fs.writeFile(`/rodir/${f.webkitRelativePath}`, await f.bytes())
                            }))
                            fs.chdir('/rodir')
                        },
                        args: ['-windowed']
                    })
                }}
            />
            <label htmlFor="folder">
                Game folder
            </label>
            <canvas id="canvas" ref={canvasRef} />
        </>
    );
}

export default App;
