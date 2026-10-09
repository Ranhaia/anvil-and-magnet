export class Camera {
  constructor(viewportW = 960, viewportH = 540) {
    this.x = 0;
    this.y = 0;
    this.viewportW = viewportW;
    this.viewportH = viewportH;
    this.shakeIntensity = 0;
    this.shakeDuration = 0;
  }

  shake(intensity = 5, duration = 0.15) {
    this.shakeIntensity = intensity;
    this.shakeDuration = duration;
  }

  update(targetX, targetY, dt) {
    // Smooth Lerp tracking
    const targetCamX = targetX - this.viewportW / 2;
    const targetCamY = targetY - this.viewportH / 2 - 40;

    this.x += (targetCamX - this.x) * (dt * 5.0);
    this.y += (targetCamY - this.y) * (dt * 4.0);

    // Apply Screenshake decay
    if (this.shakeDuration > 0) {
      this.shakeDuration -= dt;
      const offsetX = (Math.random() - 0.5) * this.shakeIntensity * 2;
      const offsetY = (Math.random() - 0.5) * this.shakeIntensity * 2;
      this.x += offsetX;
      this.y += offsetY;
    }
  }
}
