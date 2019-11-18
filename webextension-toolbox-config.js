var WebpackClearConsole = require("webpack-clear-console").WebpackClearConsole;

module.exports = {
    webpack: (config, {dev}) => {
        // Perform customizations to webpack config

        if (!dev) {
            config.plugins.unshift(new WebpackClearConsole());
        }

        // Important: return the modified config
        return config
    }
}
