import { Vec } from "./utils.js"

function moveRectCollideMovingRect(pos1, v1, size1, pos2, v2, size2) {
    // returns: 
        // the position of rect 1 after moving, 
        // { whether collision occured on x/y axes }

    // movement of rect 2 will take priority over rect 1
    // ie. rect 2 will push rect 1 out of the way

    const dv = Vec.sub(v1, v2);

    const halfSize1 = Vec.div(size1, 2)
    const halfSize2 = Vec.div(size2, 2)

    const nPos = Vec.add(pos1, v1);
    const collided = { x: false, y: false }

    for (const dir of ['x', 'y']) {
        if (dv[dir] == 0) continue;

        // can only collide if above in other axis; continue if not
        const otherDir = dir == 'x'? 'y' : 'x';
        if (pos1[otherDir] + halfSize1[otherDir] < pos2[otherDir] - halfSize2[otherDir] ||
            pos1[otherDir] - halfSize1[otherDir] > pos2[otherDir] + halfSize2[otherDir])
            continue;

        let edge1, edge2;

        if (dv[dir] > 0) { // rect 1 moving to the right relative to rect 2
            // relevant edges are right edge of rect 1, left edge of rect 2
            edge1 = pos1[dir] + halfSize1[dir];
            edge2 = pos2[dir] - halfSize2[dir];
        } else { // rect 1 moving to the left relative to rect 2
            // relevant edges are left edge of rect 1, right edge of rect 2
            edge1 = pos1[dir] - halfSize1[dir]
            edge2 = pos2[dir] + halfSize2[dir]
        }

        const dist = Math.sign(dv[dir]) * (edge2 - edge1)

        if (dist < 0) continue;

        if (dist < Math.abs(dv[dir])) { // colliding
            collided[dir] = true

            // set position to position of rect 2's edge
            nPos[dir] = edge2 - halfSize1[dir] * Math.sign(dv[dir])
        }
    }

    return [ nPos, collided ];
}   

function rectRectOverlap(pos1, size1, pos2, size2) {
    const halfSize1 = Vec.div(size1, 2)
    const halfSize2 = Vec.div(size2, 2)

    return (
        pos1.x + halfSize1.x >= pos2.x - halfSize2.x &&  // rect1 right edge past rect2 left
        pos1.x - halfSize1.x <= pos2.x + halfSize2.x &&  // rect1 left edge past rect2 right
        pos1.y + halfSize1.y >= pos2.y - halfSize2.y &&  // rect1 top edge past rect2 bottom
        pos1.y - halfSize1.y <= pos2.y + halfSize2.y     // rect1 bottom edge past rect2 top
    )
}

export { moveRectCollideMovingRect, rectRectOverlap }