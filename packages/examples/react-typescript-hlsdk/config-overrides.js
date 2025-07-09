/**
 * @param {import('webpack').Configuration} config
 */
module.exports = function override(config) {
    config.resolve = config.resolve || {};
    config.resolve.fallback = {
        ...(config.resolve.fallback || {}),
        fs: false,
        child_process: false,
        crypto: false,
    };
    config.module.rules.push({
        test: /\.wasm$/,
        type: 'asset/resource', // This will emit the file and return the URL
    });
    config.module.rules.push({
        test: /\.so$/,
        type: 'asset/resource', // This will emit the file and return the URL
    });
    config.module.rules.push({
        test: /\.zip/,
        type: 'asset/resource', // This will emit the file and return the URL
    });
    return config;
};
