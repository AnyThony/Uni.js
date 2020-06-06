# Fuse

Fuse is a lightweight Javascript framework for building UI

- Hierarchy state management
- Components
- In-line scripting, the fuse way

# Details

Fuse utilizes it's own in-line scripting that runs in the context of corresponding DOM elements:

```js
<div id="container">
  {
    this.find("#foo").innerText += "Polo!";
  }
  <span id="foo">Marco</span>
</div>
```
or
```js
<div id="container">
  <span id="foo">
    {
      this.innerText += "Polo!";
    }
    Marco
  </span>
</div>
```
# Components
```js
<template>
  <div class="timer">
    <span>
      {
        var count = 0;
        setInterval(() => {
          count++;
          this.innerText = count;
        }, 1000)
      }
      0
    </span>
  </div>
</template>
```
