# Bundling

When building, the bundler script is ran. 

It is responsible for translating Uni apps into native HTML and Javascript.

Note that only scripts in app.uni are pre-translated, components are stored in tables and are to be handled upon runtime.

![Bundling](https://i.imgur.com/txPkD51.png)

# Runtime Scripts

Two scripts are produced by the bundler that index.html runs.

Note that index.html is identical to app.uni with only its in-line scripts removed as they are pre-translated already.

uniDOM.js loads the uni library

main.js does the following:

1. Runs translated in-line scripts in the app's entry point (app.uni)
2. Any components used via importing will be loaded from a table generated from the bundler
3. Components are outside the app's entry point and are untranslated. During runtime it will be parsed and ran via tools from the uni library. 
