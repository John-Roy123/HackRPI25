import ASSETS from '../assets.js';

export default class Player extends Phaser.Physics.Arcade.Sprite {
    velocityIncrement = 25;
    velocityMax = 250;
    drag = 1000;
    fireRate = 10;
    fireCounter = 0;
    health = 3;

    constructor(scene, x, y, shipId) {
        super(scene, x, y, ASSETS.spritesheet.TerryWalking.key, shipId);

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setScale(1.5);
        // this.setSize(this.displayWidth, this.displayHeight); // update physics hitbox to match
        this.body.setOffset((this.width - this.body.width) * 0.5, (this.height - this.body.height) * 0.5);
        this.setCollideWorldBounds(true); // prevent ship from leaving the screen
        this.setDepth(100); // make ship appear on top of other game objects
        this.scene = scene;
        this.setMaxVelocity(this.velocityMax); // limit maximum speed of ship
        this.setDrag(this.drag);

        // default weapon
        this.currentWeapon = {
            name: 'feather',
            bulletKey: ASSETS.spritesheet.FeatherProjectile.key,
            power: 1,
            walkAnimKey: 'walk'
        };
        this.walkAnimKey = this.currentWeapon.walkAnimKey;
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);

        if (this.fireCounter > 0) this.fireCounter--;

        this.checkInput();
    }

    checkInput() {
        const cursors = this.scene.cursors; // get cursors object from Game scene
        const aKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A).isDown;
        const dKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D).isDown;
        const wKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W).isDown;
        const sKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S).isDown;
        const spaceKey = cursors.space.isDown;
        const pointerDown = this.scene.input.activePointer.isDown;

        const moveDirection = { x: 0, y: 0 }; // default move direction

        if (aKey) moveDirection.x--;
        if (dKey) moveDirection.x++;
        if (wKey) moveDirection.y--;
        if (sKey) moveDirection.y++;
        if (spaceKey || pointerDown) this.fire();

        this.body.velocity.x += moveDirection.x * this.velocityIncrement; // increase horizontal velocity
        this.body.velocity.y += moveDirection.y * this.velocityIncrement; // increase vertical velocity

        // play walking animation when moving, stop when idle
        const isMoving = (moveDirection.x !== 0) || (moveDirection.y !== 0);
        if (isMoving) {
            if (!this.anims.isPlaying || this.anims.currentAnim.key !== this.walkAnimKey) {
                this.play(this.walkAnimKey);
            }
            // flip sprite horizontally when moving left/right for nicer feedback
            if (moveDirection.x < 0) this.setFlipX(true);
            else if (moveDirection.x > 0) this.setFlipX(false);
        } else {
            if (this.anims.isPlaying) this.stop();
            // set to first frame (idle) when not moving
            this.setFrame(0);
        }
    }

    equipWeapon(weapon) {
        // weapon: { name, bulletKey, power, playerTextureKey, walkAnimKey }
        if (!weapon) return;
        this.currentWeapon.name = weapon.name || this.currentWeapon.name;
        this.currentWeapon.bulletKey = weapon.bulletKey || this.currentWeapon.bulletKey;
        this.currentWeapon.power = weapon.power || this.currentWeapon.power;
        if (weapon.walkAnimKey) this.currentWeapon.walkAnimKey = weapon.walkAnimKey;
        this.walkAnimKey = this.currentWeapon.walkAnimKey;

        if (weapon.playerTextureKey) {
            this.setTexture(weapon.playerTextureKey);
            this.setFrame(0);
            // ensure physics body matches new visual size
            this.setSize(this.displayWidth, this.displayHeight);
            if (this.body && this.body.setOffset) {
                this.body.setOffset((this.width - this.body.width) * 0.5, (this.height - this.body.height) * 0.5);
            }
        }
    }

    fire() {
        if (this.fireCounter > 0) return;

        this.fireCounter = this.fireRate;

        // fire towards pointer (mouse / touch). If no pointer available, fire upwards
        const pointer = this.scene.input.activePointer;
        const targetX = pointer ? pointer.worldX : this.x;
        const targetY = pointer ? pointer.worldY : this.y - 100;

        this.scene.fireBullet(this.x, this.y, targetX, targetY);
    }

    hit(damage) {
        this.health -= damage;

        // notify UI of health change
        if (this.scene && this.scene.events) this.scene.events.emit('healthUpdated', this.health);

        if (this.health <= 0) this.die();
    }

    die() {
        this.scene.addExplosion(this.x, this.y);
        this.destroy(); // destroy sprite so it is no longer updated
    }
}