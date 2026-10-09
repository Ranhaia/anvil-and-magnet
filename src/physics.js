// Physics 2D Utilities (AABB Collisions, Raycasts and Shield Occlusion)
export class Physics {
  static checkAABB(r1, r2) {
    return (
      r1.x < r2.x + r2.w &&
      r1.x + r1.w > r2.x &&
      r1.y < r2.y + r2.h &&
      r1.y + r1.h > r2.y
    );
  }

  static clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
  }

  static distance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // Segment to AABB intersection (used to test if Anvil shields Player from Gas Tank explosion)
  static segmentIntersectsBox(p1, p2, box) {
    // Check if line segment from p1 to p2 intersects box (x, y, w, h)
    const minX = Math.min(p1.x, p2.x);
    const maxX = Math.max(p1.x, p2.x);
    const minY = Math.min(p1.y, p2.y);
    const maxY = Math.max(p1.y, p2.y);

    if (maxX < box.x || minX > box.x + box.w || maxY < box.y || minY > box.y + box.h) {
      return false;
    }

    // Liang-Barsky line clipping algorithm
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;

    const p = [-dx, dx, -dy, dy];
    const q = [
      p1.x - box.x,
      box.x + box.w - p1.x,
      p1.y - box.y,
      box.y + box.h - p1.y
    ];

    let u1 = 0;
    let u2 = 1;

    for (let i = 0; i < 4; i++) {
      if (p[i] === 0) {
        if (q[i] < 0) return false;
      } else {
        const t = q[i] / p[i];
        if (p[i] < 0) {
          if (t > u2) return false;
          if (t > u1) u1 = t;
        } else {
          if (t < u1) return false;
          if (t < u2) u2 = t;
        }
      }
    }

    return u1 <= u2;
  }
}
