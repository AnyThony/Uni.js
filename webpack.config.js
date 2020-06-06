// webpack.config.js
const HtmlWebPackPlugin = require( 'html-webpack-plugin' );
const path = require( 'path' );
module.exports = {
   context: __dirname,
   entry: './index.html',
   output: {
      path: path.resolve( __dirname),
      filename: 'index.html',
   },

   plugins: [
      new HtmlWebPackPlugin()
   ],
  module: {
    rules: [
      {
        test: /\.html$/i,
        loader: 'html-loader',
      },
    ],
  },
};