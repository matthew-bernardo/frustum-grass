import { BufferGeometry, Float32BufferAttribute, Vector3 } from "three";
import "aframe-instanced-mesh/src/instanced-mesh"
import "./shader/GrassMaterialShader"

function updateFrustum() {
  if (this.workerInitialized) {
    this.camera.object3D.getWorldPosition(this.cameraWorldPos)
    const { rotation } = this.camera.object3D;
    const position = this.cameraWorldPos
    const update: IUpdateProps = {
      type: "update",
      camera: {
        position: [position.x, position.y, position.z],
        rotation: [rotation.x, rotation.y, rotation.z]
      }
    }
    this.grassWorker.postMessage(update)
  }
}

AFRAME.registerComponent("frustum-grass", {
  schema: {
    workerUrl: { type: "string" },
    fov: { type: "number", default: Math.PI }
  },
  init() {
    this.totalBlades = 0
    this.cameraWorldPos = new Vector3()
    this.camera = document.querySelector("[camera]")
    this.blades = {}
    // Create grass geometry
    AFRAME.registerGeometry("frustum-grass", {
      init() {
        const geometry = getGrassGeometry();
        geometry.computeBoundingSphere();
        geometry.computeVertexNormals();
        this.geometry = geometry;
      },
    })

    // Create grass instanced mesh
    const meshInstance = document.createElement("a-entity")
    meshInstance.setAttribute("geometry", {
      primitive: "frustum-grass"
    })
    meshInstance.setAttribute("material", {
      color: "green",
      side: "double",
      // shader: "grass",
    })
    meshInstance.setAttribute("instanced-mesh", {
      capacity: 5000
    })
    meshInstance.setAttribute("id", "grassMesh")
    this.el.appendChild(meshInstance)

    // Create object pool - we're adding and removing a lot of grass, so pooling is good for performance
    // this.scene = document.querySelector("a-scene")
    // this.scene.setAttribute("pool__grass", {
    //   mixin: "grassMixin",
    //   dynamic: true,
    //   size: 8000,
    //   container: "[frustum-grass]"
    // })

    this.initializeWorker()
    this.tick = AFRAME.utils.throttleTick(updateFrustum.bind(this), 100)
  },
  update() {
    this.initializeWorker()
  },
  initializeWorker() {
    if (!this.workerInitialized && this.data.workerUrl) {
      this.grassWorker = new Worker(this.data.workerUrl, { type: "module" });
      this.grassWorker.onmessage = ({ data }: any) => {
        if (data.type === "addGrass") {
          this.totalBlades++
          this.addGrass(data)
        }
        if (data.type === "removeGrass") {
          this.totalBlades--
          this.removeGrass(data.index)
        }
      }
      this.workerInitialized = true
      this.camera.object3D.getWorldPosition(this.cameraWorldPos)
      const { rotation } = this.camera.object3D;
      const position = this.cameraWorldPos
      const initEvent: IInitProps = {
        type: "initialize",
        vertices: getDummyVertices() as Array<IVertex>,
        camera: {
          position: [position.x, position.y, position.z],
          rotation: [rotation.x, rotation.y, rotation.z]
        },
        fov: this.data.fov
      }
      this.grassWorker.postMessage(initEvent)
    }
  },
  addGrass(event: { pos: [number, number, number], index: number }) {
    // const grass = this.scene.components.pool__grass.requestEntity()
    const grass = document.createElement("a-entity")
    grass.setAttribute("instanced-mesh-member", { mesh: "#grassMesh" })
    // grass.setAttribute("geometry", { primitive: "frustum-grass" })
    // grass.setAttribute("material", { side: "double", shader: "grass", color: "#8e8" })
    grass.object3D.scale.set(7, 7, 7)
    grass.object3D.rotation.y = Math.PI * Math.random() * 0.5
    grass.object3D.scale.y *= 0.8 + Math.random() * 0.4
    grass.object3D.position.set(...event.pos)
    this.el.appendChild(grass)
    this.blades[event.index] = grass
  },
  removeGrass(index: number) {
    try {
      if (this.blades[index]) {
        this.blades[index].remove()
        // this.scene.components.pool__grass.returnEntity(this.blades[index])
      }
    } catch(err) {
      console.warn("Error while releasing blade of grass from pool", err)
    }
  }
})

function getDummyVertices() {
  const vertices = []
  for (let i = -50; i < 50; i += 0.25) {
    for (let j = -50; j < 50; j += 0.25) {
      vertices.push({ pos: [i, 0, j] })
    }
  }
  return vertices
}

export function getGrassGeometry() {
  const grassGeometry = new BufferGeometry();
  const positionNumComponents = 3;
  const normalNumComponents = 3;
  const uvNumComponents = 2;
  const colorNumComponents = 3;
  const WIDTH = 0.012;
  const MIDPOINT = 0.04;
  const HEIGHT = 0.16;
  grassGeometry.setAttribute(
    "position",
    new Float32BufferAttribute(
      [
        -WIDTH,
        MIDPOINT,
        0, // bottom left, mapped to left middle
        0.0,
        0,
        0, // bottom right, mapped to bottom middle
        WIDTH,
        MIDPOINT,
        0, // top right, mapped to right middle

        WIDTH,
        MIDPOINT,
        0, // top right, mapped to right middle
        0,
        HEIGHT,
        0, // top left, mapped to top middle
        -WIDTH,
        MIDPOINT,
        0, // bottom left, mapped to left middle
      ],
      positionNumComponents
    )
  );
  grassGeometry.setAttribute(
    "normal",
    new Float32BufferAttribute([
      0, 1, 0,
      0, 1, 0,
      0, 1, 0,
      0, 1, 0,
      0, 1, 0,
      0, 1, 0,
    ], normalNumComponents)
  )
  grassGeometry.setAttribute(
    "uv",
    new Float32BufferAttribute([
      -1, MIDPOINT, // left middle
      0, 0, // bottom middle
      1, MIDPOINT, // right middle
      1, MIDPOINT, // right middle
      0, HEIGHT, // top middle
      -1, MIDPOINT// left middle
    ], uvNumComponents)
  )
  grassGeometry.setAttribute(
    "color",
    new Float32BufferAttribute(
      new Float32Array([
        0.4, 0.9, 0.4, 0.4, 0.9, 0.4, 0.4, 0.9, 0.4, 0.4, 0.9, 0.4, 0.4, 0.9,
        0.4, 0.4, 0.9, 0.4,
      ]),
      colorNumComponents
    )
  );
  return grassGeometry;
}