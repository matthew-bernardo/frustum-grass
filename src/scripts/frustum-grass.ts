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
    fov: { type: "number", default: Math.PI },
    color: { type: "color", default: "#8e8" }
  },
  init() {
    this.cameraWorldPos = new Vector3()
    this.camera = document.querySelector("[camera]")
    this.blades = {}
    this.totalBlades = 0
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
      color: this.data.color,
      side: "double",
      // shader: "grass",
    })
    meshInstance.setAttribute("instanced-mesh", {
      capacity: 5000
    })
    meshInstance.setAttribute("id", "grassMesh")
    this.el.appendChild(meshInstance)

    this.registerWorker()
    this.tick = AFRAME.utils.throttleTick(updateFrustum.bind(this), 100)
  },
  update() {
    this.registerWorker()
  },
  registerWorker() {
    if (!this.workerRegistered && this.data.workerUrl) {
      this.grassWorker = new Worker(this.data.workerUrl, { type: "module" });
      this.grassWorker.onmessage = ({ data }: any) => {
        if (data.type === "addGrass") {
          this.addGrass(data)
        }
        if (data.type === "removeGrass") {
          this.removeGrass(data.index)
        }
      }
      this.workerRegistered = true
    }
  },
  setVertices(vertices: Array<IVertex>, isTerrainosaurus: boolean) {
    this.camera.object3D.getWorldPosition(this.cameraWorldPos)
    const { rotation } = this.camera.object3D;
    const position = this.cameraWorldPos
    const initEvent: IInitProps = {
      type: "initialize",
      vertices,
      isTerrainosaurus,
      density: 24,
      terrainScale: 8,
      camera: {
        position: [position.x, position.y, position.z],
        rotation: [rotation.x, rotation.y, rotation.z]
      },
      fov: this.data.fov
    }
    this.grassWorker.postMessage(initEvent)
    this.workerInitialized = true
  },
  addGrass(event: { pos: [number, number, number], index: number }) {
    const grass = document.createElement("a-entity")
    grass.setAttribute("instanced-mesh-member", { mesh: "#grassMesh" })
    grass.object3D.scale.set(7, 7, 7)
    grass.object3D.rotation.y = Math.PI * Math.random() * 0.5
    grass.object3D.rotation.x = Math.random() * 0.4 - 0.2
    grass.object3D.scale.y *= 0.8 + Math.random() * 0.5
    grass.object3D.position.set(...event.pos)
    this.el.appendChild(grass)
    this.blades[event.index] = grass
  },
  removeGrass(index: number) {
    try {
      if (this.blades[index]) {
        this.blades[index].remove()
      }
    } catch(err) {
      console.warn("Error while releasing blade of grass from pool", err)
    }
  }
})

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