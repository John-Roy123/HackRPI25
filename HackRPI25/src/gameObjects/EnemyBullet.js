import ASSETS from '../assets.js';

export default class EnemyBullet extends Phaser.Physics.Arcade.Sprite {
    power = 1;
    moveVelocity = 200;

    // optional targetX, targetY for directional bullets; if not provided, fires downward
    // textureKey and textureScale allow custom projectile appearance
    constructor(scene, x, y, power, targetX, targetY, textureKey, textureScale) {
        const key = textureKey || ASSETS.spritesheet.tiles.key;
        const frame = textureKey ? 0 : (11 + power);
        super(scene, x, y, key, frame);

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.power = power;
        this.setDepth(10);
        this.scene = scene;

        // scale the projectile if specified
        if (typeof textureScale === 'number' && textureScale !== 1) {
            this.setScale(textureScale);
        }

        this.setSize(16, 24); // resize hitbox to correctly fit image instead of using the entire tile size

        // directional firing: calculate velocity toward target
        if (typeof targetX === 'number' && typeof targetY === 'number') {
            const dx = targetX - x;
            const dy = targetY - y;
            const len = Math.sqrt(dx * dx + dy * dy) || 1;
            const vx = (dx / len) * this.moveVelocity;
            const vy = (dy / len) * this.moveVelocity;
            this.body.velocity.x = vx;
            this.body.velocity.y = vy;
            // rotate sprite so top points toward target
            this.setRotation(Math.atan2(vx, -vy));
        } else {
            // default: fire downward
            this.setFlipY(true); // flip image vertically to point downwards
            this.setVelocityY(this.moveVelocity * power * 0.5); // bullet vertical speed
        }
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);

        this.checkWorldBounds();
    }

    getPower() {
        return this.power;
    }

    // is this bullet below the screen?
    checkWorldBounds() {
        if (this.y > this.scene.scale.height) {
            this.die();
        }
    }

    die() {
        this.scene.removeEnemyBullet(this);
    }
}