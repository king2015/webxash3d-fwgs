Module.onRuntimeInitialized = () => {
    window.Cmd_ExecuteString = Module.cwrap('Cmd_ExecuteString', null, ['string']);
    window.Sys_Quit = Module.cwrap('Sys_Quit', null, []);
}

async function fsInit() {
    const res = await fetch('/public/valve.zip')
    const zip = await JSZip.loadAsync(await res.arrayBuffer());
    for (const [filename, file] of Object.entries(zip.files)) {
        if (file.dir) continue;

        const path = '/rodir/' + filename;
        const dir = path.split('/').slice(0, -1).join('/');

        await FS.mkdirTree(dir);
        await FS.writeFile(path, await file.async("uint8array"));
    }

    await FS.chdir('/rodir')
}

async function start() {
    await fsInit();

    preInit();
    run();
}

start()