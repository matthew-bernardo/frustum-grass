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
  seed: Math.random().toString().replace("0.", ""),
  wrapper: "#scene-content-wrapper",
  noCollisionWrapper: "#noCollisionWrapper"
})

terrain.addEventListener("terrainInitialized", (event: CustomEvent) => {
  const grassWorkerUrl = new URL("./frustum-grass-worker", import.meta.url)
  grassWorkerUrl.searchParams.append("isFile", "true")

  const grassWrapper = document.querySelector("#frustumGrass") as any
  grassWrapper.setAttribute("frustum-grass", {
    workerUrl: grassWorkerUrl,
    color: "rgb(102, 244, 76)"
  })

  grassWrapper.components["frustum-grass"].setVertices(event.detail.terrainClient.vertices, true)
})
