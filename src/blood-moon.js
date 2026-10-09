import { sound } from "./audio.js";

export class BloodMoonSystem {
  constructor() {
    this.timer = 0;
    this.cycleInterval = 85.0; // Seconds between Blood Moons
    this.duration = 22.0;      // Active event duration
    this.isActive = false;
    this.bloodFactor = 0.0;    // 0.0 to 1.0 for rendering transitions
    this.onSurviveCallback = null;
  }

  update(dt) {
    this.timer += dt;

    if (!this.isActive) {
      if (this.timer >= this.cycleInterval) {
        // Start Blood Moon Event!
        this.isActive = true;
        this.timer = 0;
        sound.playBloodMoonAlarm();
      }
    } else {
      // Blood Moon is raging!
      if (this.timer >= this.duration) {
        // Survived the Blood Moon!
        this.isActive = false;
        this.timer = 0;
        sound.playPowerup();
        if (this.onSurviveCallback) {
          this.onSurviveCallback();
        }
      }
    }

    // Smooth transition factor
    const target = this.isActive ? 1.0 : 0.0;
    this.bloodFactor += (target - this.bloodFactor) * (dt * 2.5);
  }
}
