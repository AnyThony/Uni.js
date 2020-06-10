# About
Uni is a lightweight Javascript framework for building UI

- Hierarchy state management
- Components
- In-line scripting

#### Refer to the more in-depth documentation [here](https://anythony.github.io/uni-docs/)

# Setup

Uni is available to install as an npm package:
```npm install -g uni-cmd```
        
A new project can then be created with the init command:
```uni init Project_Name```

Inside a project directory, a dev environment with hot reload can be started:
```npm run dev```

# In-line Scripting

Using Uni you can write inline-scripts that run with under a DOM element as context:

Note: Uni assigns the method find as an alias for querySelector
```js
<div>
  {
    this.find("#foo").innerText += "Polo!";
  }
  <span id="foo">Marco</span>
</div>
```

# Initialization Events

Uni runs scripts in the order of an execution tree

Every DOM element runs itself first then recurses on its children.

The following are events that can be assigned upon initialization:

### onFullLoad
```js
<div>
  {
    this.onFullLoad = () => {
      // called after every descendant has loaded
    }
  }
  ...
</div>
``` 
Assigning a callback to onFullLoad will call it once every descendent's script is ran.

### onChildLoad
```js
<div>
  {
    this.onChildLoad = (child) => {
      console.log(child + " has loaded");
      // called when a descendant loads
    }
  }
  ...
</div>
```
Assigning a callback to onChildLoad will call it everytime a descendant's script is ran passing the descendant itself.

# Components

You can split views into components

Component files are automatically registered in the directory src/components.
The file name must be the desired component name. (In this case it's navbar.uni)
```js        
<template>
  <div class="navbar">
    {
      // blah
    }
    ...
  </div>
</template>
```
To use a component this.imports must be declared with its name inside the parent element.

You can then declare a regular HTML element with its tagname:
```js
<body>
  {
    this.imports = ["navbar"];
  }
  <navbar></navbar>
</body>
```

# State Management
Uni respects the DOM tree's hierarchy when processing state management

Declaring an initial state must be done on this.state:
```js        
<div>
  {
    this.state = {foo: 2}
  }
</div>
```
      
### bindState(callback)
```js
<div>
  {
    this.state = {foo: 2}
    this.bindState(newState => {
      console.log("foo is " + newState.foo);
    });
  }
  ...
</div>
```
      
The callback passed to bindState will be called once initially then upon any state changes from setState thereafter.

### setState(object)
```js        
<div>
  {
    this.state = {foo: 2}
    this.bindState(newState => {
      console.log("foo is " + newState.foo);
    });
    this.setState({foo: 3});
  }
  ...
</div>
```
      
The callback passed to bindState will be called once initially then upon any state changes from setState.
