# frustum-grass

This is an **unfinished** a-frame component that provides an easy to use/performant grass renderer. You can check it out [here](https://bernardo.lol/frustum-grass/index.html).

- It uses Web Workers to perform spawning and culling calculations in a background thread, which help keep framerate stable.
- It improves rendering performance using instanced meshes via the `aframe-instanced-mesh` package.

There are several things that aren't working that are must-haves before I consider this project complete.

- Grass doesn't sway. I have a custom material with a vertex shader that accomplish this, but to make it work I need to update a uniform every tick, and I cannot figure out how to do this.
- Instanced meshes seem to interfere with vertex shaders. I had a simplified vertex shader that did work but didn't have a good lighting model. However, even this shader stopped working as soon as I started using instanced meshes.

Other things I would like to do.

- Since I am constantly adding and removing objects from the scene, it seems logical to use a-frame's object pooling feature, but I can't get this to work with instanced meshes. I don't know enough about object pooling and/or instanced meshes to say whether this is an optimization worth making.
- Add easy interoperability with Terrainosaurus. I could easily do this, but it doesn't seem worth it for now.
- Dynamically set the fov based on current viewport (and camera height?).
- Spawn grass further away, but make it less dense further away from the camera.
