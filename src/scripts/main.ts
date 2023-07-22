// @ts-ignore
import { registerTerrainosaurusComponent } from "terrainosaurus"

import "./frustum-grass"

const vertexWorkerUrl = new URL("terrainosaurus/dist/vertex-worker", import.meta.url)
vertexWorkerUrl.searchParams.append("isFile", "true")
registerTerrainosaurusComponent({
  vertexWorkerUrl
}, AFRAME)

const terrain = document.querySelector("#terrain")
terrain.setAttribute("terrainosaurus-terrain", {
  seed: "921" + Math.random().toString().replace("0.", ""),
  wrapper: "#scene-content-wrapper",
  noCollisionWrapper: "#noCollisionWrapper"
})

terrain.addEventListener("terrainInitialized", (event: CustomEvent) => {
  const grassWorkerUrl = new URL("./frustum-grass-worker", import.meta.url)
  grassWorkerUrl.searchParams.append("isFile", "true")

  const grassWrapper = document.querySelector("#frustumGrass") as any
  grassWrapper.setAttribute("frustum-grass", {
    workerUrl: grassWorkerUrl,
    fov: Math.PI / 1.5,
    density: 32,
    color: "rgb(102, 244, 76)"
  })

  grassWrapper.components["frustum-grass"].setVertices(event.detail.terrainClient.vertices, true)
})
