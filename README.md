# frustum-grass

This is an **incomplete** a-frame component that provides an easy to use/performant grass renderer. You can check it out [here](https://bernardo.lol/frustum-grass/index.html).

## What it does

You give `frustum-grass` a set of vertices representing your scene, and it adds a bunch of grass to your scene. It has a couple tricks to keep your framerate high.

- It uses Web Workers to perform spawning and culling calculations in a background thread, which help keep framerate stable.
- It improves rendering performance using instanced meshes via the `aframe-instanced-mesh` package.

## How to use it

Since `frustum-grass` uses Web Workers, you'll have to make sure the `frustum-grass-worker.js` file isn't bundled in with everything else.

I'm using webpack in my projects, so I always add something like this to my `webpack.config.js`:

```js
{
  module: {
    rules: [
      {
        test: /frustum-grass-worker/,
        generator: {
          // You'll have to change your publicPath and outputPath
          // values to suit your exact desired output structure.
          publicPath: "assets/scripts/",
          outputPath: "assets/scripts",
          filename: "frustum-grass-worker.js"
        }
      },
    ]
  }
}
```

Once the Web Worker script is in its own file, you'll have to pass its location to the component.

```js
  const grassWorkerUrl = new URL("frustum-grass/frustum-grass-worker", import.meta.url)
  grassWorkerUrl.searchParams.append("isFile", "true")

  const grassWrapper = document.querySelector("#frustumGrass") as any
  grassWrapper.setAttribute("frustum-grass", {
    workerUrl: grassWorkerUrl,
    fov: Math.PI / 1.5,
    density: 32,
    color: "rgb(102, 244, 76)"
  })
```

Finally, you'll have to give your grass component some vertices so it can start spawning terrain. I built `frustum-grass` to be used with [Terrainosaurus](https://www.npmjs.com/package/terrainosaurus), my procedural terrain generator. You can pass the vertices generated by Terrainosaurus to `frustum-grass`, and it'll figure out everything from there.

```js
terrain.addEventListener("terrainInitialized", (event: CustomEvent) => {
  const { detail: { terrainClient: { vertices } } } = event
  const isTerrainosaurus = true
  const grassWrapper = document.querySelector("#frustumGrass") as any
  grassWrapper.components["frustum-grass"].setVertices(vertices, isTerrainosaurus)
})
```

## What needs improvement

There are several things that aren't working that are must-haves before I consider this project truly complete.

- Grass doesn't sway. I have a custom material with a vertex shader that accomplish this, but to make it work I need to update a uniform every tick, and I cannot figure out how to do this.
- Instanced meshes seem to interfere with vertex shaders. I had a simplified vertex shader that did work but didn't have a good lighting model. However, even this shader stopped working as soon as I started using instanced meshes.

Other things I would like to do.

- Since I am constantly adding and removing objects from the scene, it seems logical to use a-frame's object pooling feature, but I can't get this to work with instanced meshes. I don't know enough about object pooling and/or instanced meshes to say whether this is an optimization worth making.
- Dynamically set the fov based on current viewport (and camera height?).
