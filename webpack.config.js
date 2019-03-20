'use strict';

const path                  = require('path');
// const UglifyJSPlugin        = require('uglifyjs-webpack-plugin');
// const ExtractTextPlugin     = require("extract-text-webpack-plugin");

// process.env.NODE_ENV = (utils.prod ? 'production' : 'development');
// process.env.NODE_ENV = 'production';
process.env.NODE_ENV = 'development';

module.exports = {
    target: 'node',
    mode: process.env.NODE_ENV,
    node: {
        __filename: false, // https://webpack.js.org/configuration/node#node
        __dirname: false, // no polyfill
    },
    entry: {
        index: path.resolve(__dirname, 'dropbox.js')
    },
    output: {
        path: __dirname,
        filename: "dropbox-cli.js"
    },
    devtool: false, // don't eval in bundle
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        cacheDirectory: true,
                        cacheCompression: false,
                        presets: [
                            '@babel/preset-react',
                            '@babel/preset-env',
                        ],
                        plugins: [
                            "@babel/plugin-external-helpers",
                            '@babel/plugin-proposal-object-rest-spread',
                            '@babel/plugin-proposal-export-default-from',
                            '@babel/plugin-proposal-export-namespace-from',
                            '@babel/plugin-proposal-class-properties',
                            '@babel/plugin-proposal-async-generator-functions',
                            '@babel/plugin-transform-async-to-generator', // async await
                            '@babel/plugin-transform-destructuring', // const {a,b,c,...rest} = obj;
                            // '@babel/plugin-proposal-async-generator-functions',
                            // '@babel/plugin-transform-async-to-generator', // async await
                            // '@babel/plugin-transform-destructuring', // const {a,b,c,...rest} = obj;
                        ],
                    }
                },
            },
            // {
            //     // https://webpack.js.org/loaders/style-loader/
            //     test: /\.css$/,
            //     use: ExtractTextPlugin.extract({
            //         fallback: {
            //             loader: 'style-loader',
            //         },
            //         use: [
            //             {
            //                 loader: 'css-loader',
            //             },
            //             {
            //                 loader: 'postcss-loader',
            //                 options: {
            //                     // Necessary for external CSS imports to work
            //                     // https://github.com/facebookincubator/create-react-app/issues/2677
            //                     ident: 'postcss',
            //                     plugins: () => [
            //                         require('postcss-flexbugs-fixes'),
            //                         require('autoprefixer')({
            //                             browsers: [
            //                                 '>1%',
            //                                 'last 4 versions',
            //                                 'Firefox ESR',
            //                                 'not ie < 9', // React doesn't support IE8 anyway
            //                             ],
            //                             flexbox: 'no-2009',
            //                         }),
            //                     ],
            //                 },
            //             },
            //             // { // https://webpack.js.org/contribute/writing-a-loader/#complex-usage
            //             //     loader: path.resolve(__dirname, './loaders/test_loader.js'),
            //             //     options: {
            //             //         sufix: '_two' // executed second
            //             //     }
            //             // },
            //             // {
            //             //     loader: path.resolve(__dirname, './loaders/test_loader.js'),
            //             //     options: {
            //             //         sufix: '_one' // executed first
            //             //     }
            //             // },
            //         ]
            //     }),
            // },
        ]
    },
    plugins: [
        // new ExtractTextPlugin("es5.css"),
        // new UglifyJSPlugin({
        //     sourceMap: false,
        //     parallel: true
        // })
    ]
};
