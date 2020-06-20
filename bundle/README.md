# Bundling

When building, the bundler script is ran. 

It is responsible for translating Uni apps into HTML and Javascript.

app.uni and each component are assigned their own execution tree that runs upon load

![Bundling](https://i.imgur.com/txPkD51.png)

# Runtime Scripts

Two scripts are produced by the bundler that index.html runs.

index.html is generated from app.uni

uniDOM.js loads the uni library

main.js contains and evaluates execution trees upon runtime.
