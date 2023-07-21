// @ts-ignore
import { registerTerrainosaurusComponent } from "terrainosaurus"

import "./frustum-grass"

const grassWorkerUrl = new URL("./frustum-grass-worker", import.meta.url)
grassWorkerUrl.searchParams.append("isFile", "true")
document.querySelector("#frustumGrass").setAttribute("frustum-grass", { workerUrl: grassWorkerUrl })

const vertexWorkerUrl = new URL("terrainosaurus/dist/vertex-worker", import.meta.url)
grassWorkerUrl.searchParams.append("isFile", "true")
registerTerrainosaurusComponent({
  vertexWorkerUrl
}, AFRAME)

setTimeout(() => {
  const terrain = document.querySelector("#terrain")
  terrain.setAttribute("terrainosaurus-terrain", {
    seed: Math.random().toString().replace("0.", ""),
    wrapper: "#scene-content-wrapper"
  })
}, 100)