// var WebpackClearConsole = require("webpack-clear-console").WebpackClearConsole;
const TerserPlugin = require('terser-webpack-plugin');


module.exports = {
    webpack: (config, {dev}) => {
        // Perform customizations to webpack config

        if (!dev) {
            config.optimization.minimizer = [
                new TerserPlugin({
                    sourceMap: true, // Must be set to true if using source-maps in production
                    terserOptions: {
                        compress: {
                            drop_console: true,
                        },
                    },
                }),
            ];
        }

        console.log(config.optimization);

        // Important: return the modified config
        return config
    }
}
