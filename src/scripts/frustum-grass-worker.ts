/**
 * This worker emits events indicating where grass blades should be placed.
 * It should receive an initialization event containing:
 *  - The FOV (used to compute the frustum)
 *  - Where blades of grass can be placed (e.g., if there's a lake, grass probably should be spawned there)
 *  - How dense the grass should be
 *  - The grass density falloff
 *  - The camera's current position
 *
 * After initialization, it should receive events whenever the camera moves
 * or rotates around the y-axis so that it can compute the new frustum.
 */

const context: Record<string, any> = {
  blades: {},
};

self.addEventListener("message", (event) => {
  if (event.data.type === "initialize") {
    const data = event.data as IInitProps;
    // Compute an initial frustum
    let {
      camera: { rotation, position },
      vertices,
      fov,
      isTerrainosaurus,
      terrainScale,
      density
    } = data;
    if (isTerrainosaurus) {
      vertices = processTerrainosaurusVertices(vertices, terrainScale, density);
    }
    context.vertices = vertices;
    const frustum = new Frustum(rotation[1], position[0], position[2], fov);
    context.fov = fov;
    context.frustum = frustum;

    // Go over all vertices and check if they're inside the frustum
    vertices.forEach((v, index) => {
      if (frustum.contains(v.pos[0], v.pos[2])) {
        context.blades[index.toString()] = [v.pos[0], v.pos[2]];
        const pos = [
          v.pos[0] - 0.2 + Math.random() * 0.4,
          v.pos[1],
          v.pos[2] - 0.2 + Math.random() * 0.4,
        ];
        postMessage({ type: "addGrass", pos, index });
      }
    });
  } else if (event.data.type === "update") {
    const data = event.data as IUpdateProps;
    const {
      camera: { rotation, position },
    } = data;
    const newFrustum = new Frustum(
      rotation[1],
      position[0],
      position[2],
      context.fov
    );
    const newBladeSet: Record<string, [number, number]> = {};
    // Figure out where to render new blades of grass
    context.vertices.forEach((v: IVertex, index: number) => {
      if (newFrustum.contains(v.pos[0], v.pos[2])) {
        newBladeSet[index.toString()] = [v.pos[0], v.pos[2]];
        // Check if the old frustum already contained the vertex.
        // If it did, there's no need to render the blade.
        // It might be better to check set membership instead, but I'd need to benchmark.
        if (!context.frustum.contains(v.pos[0], v.pos[2], index)) {
          const pos = [
            v.pos[0] - 0.2 + Math.random() * 0.4,
            v.pos[1],
            v.pos[2] - 0.2 + Math.random() * 0.4,
          ];
          postMessage({ type: "addGrass", pos, index });
        }
      }
    });
    Object.entries(context.blades).forEach(([index, blade]) => {
      if (!newBladeSet[index]) {
        postMessage({ type: "removeGrass", index, blade });
      }
    });
    context.blades = newBladeSet;
    context.frustum = newFrustum;
  }
});

function processTerrainosaurusVertices(
  vertices: Array<IVertex>,
  terrainScale: number,
  density: number
): Array<IVertex> {
  const scaledVertices: Array<IVertex> = vertices
    .map((v) => ({
      ...v,
      pos: [
        terrainScale * v.pos[0],
        terrainScale * v.pos[1],
        terrainScale * v.pos[2],
      ],
    }));
  const interpolatedVertices: Array<IVertex> = []
  const edgeLength = Math.abs(vertices[0].pos[0] - vertices[5].pos[0]);
  const interpolatedBlades = density
  for (let i = 0; i < scaledVertices.length; i += 6) {
    for (let j = 0; j < interpolatedBlades; j++) {
      if (!isGreen(scaledVertices[i])) {
        continue
      }
      const randomOffset: position = [
        Math.random() * edgeLength * terrainScale,
        null,
        Math.random() * edgeLength * terrainScale,
      ];
      const corners: Array<any> = [
        scaledVertices[i + 5].pos,
        scaledVertices[i + 3].pos,
        scaledVertices[i + 1].pos,
        scaledVertices[i].pos,
      ];
      const [x, y, z] = interpolate(randomOffset, corners);
      interpolatedVertices.push({ pos: [x, y, z], color: scaledVertices[i].color })
    }
  }
  return interpolatedVertices
}

type position = [number, number, number];
function interpolate(offset: position, [tl, tr, bl, br]: Array<position>) {
  const leftEdgeSlope = (bl[1] - tl[1]) / (bl[2] - tl[2]);
  const rightEdgeSlope = (br[1] - tr[1]) / (br[2] - tr[2]);

  const leftY = tl[1] + leftEdgeSlope * offset[2];
  const rightY = tr[1] + rightEdgeSlope * offset[2];

  const interpolatedSlope = (rightY - leftY) / (br[0] - bl[0]);
  const interpolatedY = leftY + interpolatedSlope * offset[0];

  return [tl[0] + offset[0], interpolatedY, tl[2] + offset[2]];
}

function isGreen(vertex: IVertex) {
  if (vertex.color) {
    const [r, g, b] = vertex.color
    return g > 1.2 * r && g > 1.2 * b
  }
  return false
}

class Frustum {
  conditions: Array<(x: number, y: number) => boolean>;
  origin: { x: number; y: number };
  frustum1: (x: number) => number;
  frustum2: (x: number) => number;

  contains(x: number, y: number) {
    return (
      this.conditions[0](x, y) &&
      this.conditions[1](x, y) &&
      this.conditions[2](x, y)
    );
  }

  constructor(
    angle: number,
    x: number,
    y: number,
    fov: number = Math.PI / 1.5
  ) {
    // camera y-rotations in a-frame are shifted 90 degrees from the cartesian coordinate system.
    // In other words, and angle of 0 in a-frame terms is considered to be a rotation of 90 degrees
    // angle += Math.PI
    while (angle < 0) {
      angle += 2 * Math.PI;
    }
    while (angle > 2 * Math.PI) {
      angle -= 2 * Math.PI;
    }
    this.conditions = [];
    this.origin = { x, y };
    if (fov <= 0) {
      throw new Error("FOV must be a positive number");
    }
    // Compute the slopes of the frustum lines
    const angle1 = getAngle(angle - fov / 2);
    const angle2 = getAngle(angle + fov / 2);
    let m1 = Math.tan(angle1);
    let m2 = Math.tan(angle2);

    // compute the intercepts
    const b1 = y - m1 * x;
    const b2 = y - m2 * x;

    this.frustum1 = (x) => m1 * x + b1;
    this.frustum2 = (x) => m2 * x + b2;

    // Find a point that's guaranteed to be inside the frustum.
    // It's okay to ignore the x, y arguments because we only care about the relative values.
    let testY = Math.sin(getAngle(angle));

    // Find some sample points along the frustums
    const f1Y = Math.sin(angle1);
    const f2Y = Math.sin(angle2);

    // Check what conditions are true of the test point.
    // They will be true of all points inside the frustum.
    if (angle <= Math.PI) {
      if (f1Y < testY) {
        this.conditions.push((x, y) => this.frustum1(x) >= y);
      } else {
        this.conditions.push((x, y) => this.frustum1(x) <= y);
      }

      if (f2Y < testY) {
        this.conditions.push((x, y) => this.frustum2(x) >= y);
      } else {
        this.conditions.push((x, y) => this.frustum2(x) <= y);
      }
    } else {
      if (f1Y < testY) {
        this.conditions.push((x, y) => this.frustum1(x) <= y);
      } else {
        this.conditions.push((x, y) => this.frustum1(x) >= y);
      }

      if (f2Y < testY) {
        this.conditions.push((x, y) => this.frustum2(x) <= y);
      } else {
        this.conditions.push((x, y) => this.frustum2(x) >= y);
      }
    }

    // A distance condition - anything further than 10m away will be considered out of frustum
    this.conditions.push((x, y) => {
      return (x - this.origin.x) ** 2 + (y - this.origin.y) ** 2 <= 180;
    });
  }
}

function getAngle(angle: number) {
  while (angle < 0) {
    angle += 2 * Math.PI;
  }
  while (angle > 2 * Math.PI) {
    angle -= 2 * Math.PI;
  }
  // The equation for the slope of the line depends on the quadrant it's in.
  // I'm sure there's some unifying equation for it, but I'll write it out
  // this way for now and try to make it better later.
  if (angle >= 0 && angle <= Math.PI / 2) {
    return Math.PI / 2 - angle;
  }
  if (angle <= Math.PI) {
    return Math.PI / 2 - angle;
  }
  if (angle <= (3 * Math.PI) / 2) {
    return (3 * Math.PI) / 2 - angle;
  }
  return (3 * Math.PI) / 2 - angle;
}
