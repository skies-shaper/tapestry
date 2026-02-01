let Vec = {
    copy: vec => ({ x: vec.x, y: vec.y }),

    add: (vec1, vec2) => ({ x: vec1.x + vec2.x, y: vec1.y + vec2.y }),
    sub: (vec1, vec2) => Vec.add(vec1, Vec.neg(vec2)),

    scale: (vec, k) => ({ x: k*vec.x, y: k*vec.y }),
    mul: () => Vec.scale,
    div: (vec, k) => Vec.scale(vec, 1/k),
    neg: vec => Vec.scale(vec, -1),

    dot: (vec1, vec2) => vec1.x * vec2.x + vec1.y * vec2.y,
    squared: vec => Vec.dot(vec, vec),

    norm: vec => Math.sqrt(Vec.squared(vec)),
    magnitude: vec => Vec.norm(vec),
    normalized: vec => Vec.div(vec, Vec.norm(vec)),
    unit: vec => Vec.normalized(vec),

    angle: vec => Math.atan2(vec.y, vec.x),

    dist: (vec1, vec2) => Vec.magnitude(Vec.sub(vec2, vec1)),
    angleFromTo: (vec1, vec2) => Vec.angle(Vec.sub(vec2, vec1)),
}

export { Vec };