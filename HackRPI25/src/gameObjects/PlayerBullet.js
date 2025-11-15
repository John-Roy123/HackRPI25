import ASSETS from '../assets.js';

export default class PlayerBullet extends Phaser.Physics.Arcade.Sprite {
    power = 1;
    moveVelocity = 800;

    constructor(scene, x, y, power, targetX, targetY) {
        super(scene, x, y, ASSETS.spritesheet.tiles.key, power-1);

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setSize(12, 12); // resize hitbox to better fit bullet
        this.setDepth(10);
        this.scene = scene;
        this.power = power;

        // calculate velocity towards target
        if (typeof targetX === 'number' && typeof targetY === 'number') {
            const dx = targetX - x;
            const dy = targetY - y;
            const len = Math.sqrt(dx * dx + dy * dy) || 1;
            const vx = (dx / len) * this.moveVelocity;
            const vy = (dy / len) * this.moveVelocity;
            this.body.velocity.x = vx;
            this.body.velocity.y = vy;
        } else {
            this.setVelocityY(-this.moveVelocity);
        }
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);

        this.checkWorldBounds();
    }

    getPower() {
        return this.power;
    }

    // is this bullet above the screen?
    checkWorldBounds() {
        const cam = this.scene.cameras.main;
        const left = cam.worldView.x - 100;
        const right = cam.worldView.x + cam.worldView.width + 100;
        const top = cam.worldView.y - 100;
        const bottom = cam.worldView.y + cam.worldView.height + 100;

        if (this.x < left || this.x > right || this.y < top || this.y > bottom) {
            this.remove();
        }
    }

    remove() {
        this.scene.removeBullet(this);
    }
}