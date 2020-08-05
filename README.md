# About
Uni is a lightweight Javascript framework for building UI

- State management
- Components
- Parent-based In-line scripting

#### Refer to the documentation [here](https://anythony.github.io/uni-docs/)

# Setup

Uni is available to install as an npm package:
```npm install -g uni-cmd```
        
A new project can then be created with the init command:
```uni init Project_Name```

Inside a project directory, a dev environment with live reload can be started:
```npm run dev```

# In-line Scripting

## Inline Javascript code can be written in two ways:

### Inside a "uni" named Script tag:

```html
<div class="myClass">
  <script name="uni">
    console.log(this.className) // myClass
  </script>
</div>
```

### Or inside curly braces:

```js
<div class="myClass">
  {
    console.log(this.className) // myClass
  }
</div>
```

## Inline-scripts use it's parent DOM element as context:

```html
<div class="myClass">
  <script name="uni">
    console.log(this.className); // myClass
    this.children[0].innerText += "Polo!";
     
    this.querySelector("#x").innerText = "y";
  </script>
  <span>Marco</span>
  <span id="x"></span>
</div>
```

# Initialization Events

Scripts run in the order of an execution tree

Every DOM element runs itself first then recurses on its children.

The following are events that can be assigned upon initialization:

### onFullLoad
```html
<div>
  <script name="uni">
    this.onFullLoad = () => {
      // called after every descendant has loaded
    }
  </script>
  ...
</div>
``` 
Assigning a callback to onFullLoad will call it once every descendent's script is ran.

### onChildLoad
```html
<div>
  <script name="uni">
    this.onChildLoad = (child) => {
      console.log(child + " has loaded");
      // called when a descendant loads
    }
  </script>
  ...
</div>
```
Assigning a callback to onChildLoad will call it everytime a child's script is ran.

# Components

You can split views into components

Component files are automatically registered in the directory src/components.
The file name must be the desired component name. (In this case it's navbar.uni)
```html      
<template>
  <div class="navbar">
    <script name="uni">
      // blah
    </script>
    ...
  </div>
</template>
```
To use a component, this.imports must be declared with its name inside the parent element.

You can then declare a regular HTML element with its tagname:
```html
<body>
  <script name="uni">
    this.imports = ["navbar"];
  </script>
  <navbar></navbar>
</body>
```
      
Components can be added dynamically with this.addComponent(name):

### addComponent(name)
```html       
<body>
  <script name="uni">
    this.imports = ["navbar"];
    this.addComponent("navbar");
  </script>
</body>
```

addComponent appends a new component as a child into the script context.

# Props
Data known as props can be passed to reusable components upon initialization.

For components initialized statically, props can be given through regular html attribute:

        
```html
<body>
  <script name="uni">
    this.imports = ["navbar"];
  </script>
  <navbar title="foo"></navbar>
</body>
```

      
For components initialized dynamically, props can be given as an object through addComponent's second optional parameter.

        
```html
<body>
  <script name="uni">
    this.imports = ["navbar"];
    this.addComponent("navbar", {title: "foo"});
  </script>
</body>
```

      
And finally, accessing props from the component end is done with this.props:

        
```html
<template>
  <div class="navbar">
    <script name="uni">
      console.log("My title:", this.props.title);
  </script>
  </div>
</template>
```

# State Management

Declaring an initial state must be done on this.state:
```html        
<div>
  <script name="uni">
    this.state = {foo: 2}
  </script>
</div>
```
      
### bindState(callback)
```html
<div>
  <script name="uni">
    this.state = {foo: 2}
    this.bindState(newState => {
      console.log("foo is " + newState.foo);
    });
  </script>
  ...
</div>
```
      
The callback passed to bindState will be called once initially then upon any state changes from setState thereafter.

### setState(object)
```html        
<div>
  <script name="uni">
    this.state = {foo: 2}
    this.bindState(newState => {
      console.log("foo is " + newState.foo);
    });
    this.setState({foo: 3});
  </script>
  ...
</div>
```
      
The callback passed to bindState will be called once initially then upon any state changes from setState.

## State methods within descendants
Descendants that have ancestor(s) with a defined initial state can also use these methods:

```html
<div>
  <script name="uni">
    this.state = {foo: 2}
    this.bindState(newState => {
      console.log("foo is " + newState.foo);
    });
  </script>
  <div id="child">
    <script name="uni">
      this.setState({foo: 3})
    </script>
  </div>
</div>
```
      
Descendants can setState to multiple ancestors with differing state attributes:

```html
<div id="ancestor">
  <script name="uni">
    this.state = {foo: 2}
    this.bindState(newState => {
      console.log("foo is " + newState.foo);
    });
  </script>
  <div id="child">
    <script name="uni">
      this.state = {bar: 3}
      this.bindState(newState => {
        console.log("bar is " + newState.bar);
      }); 
    </script>
    <div id="descendant">
      <script name="uni">
        this.setState({foo: 3, bar: 4});
      </script>
    </div>
  </div>
</div>
```
