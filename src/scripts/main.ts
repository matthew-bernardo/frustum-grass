import "./frustum-grass"

const workerUrl = new URL("./frustum-grass-worker", import.meta.url)
workerUrl.searchParams.append("isFile", "true")
document.querySelector("#frustumGrass").setAttribute("frustum-grass", { workerUrl })