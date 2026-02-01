let Vec = {
    copy: vec => ({ x: vec.x, y: vec.y }),
    add: (vec1, vec2) => ({ x: vec1.x + vec2.x, y: vec1.y + vec2.y }),
    scale: (vec, k) => ({ x: k*vec.x, y: k*vec.y }),

    mul: () => Vec.scale,
    div: (vec, k) => Vec.scale(vec, 1/k),

    neg: vec => Vec.scale(vec, -1),

    dot: (vec1, vec2) => vec1.x * vec2.x + vec1.y * vec2.y,

    sub: (vec1, vec2) => Vec.add(vec1, Vec.neg(vec2))
}

export { Vec };