/*
* Asset from: https://kenney.nl/assets/pixel-platformer
*
*/
import ASSETS from '../assets.js';
import ANIMATION from '../animation.js';
import Player from '../gameObjects/Player.js';
import PlayerBullet from '../gameObjects/PlayerBullet.js';
import EnemyFlying from '../gameObjects/EnemyFlying.js';
import EnemyBullet from '../gameObjects/EnemyBullet.js';
import Explosion from '../gameObjects/Explosion.js';

export class Game extends Phaser.Scene {
    constructor() {
        super('Game');
    }

    init(data) {
        // capture requested restart level when the scene is started with data
        this.requestedRestartLevel = (data && data.restartLevel !== undefined) ? data.restartLevel : null;
    }

    create() {
        this.initVariables();
        this.initGameUi();
        this.initAnimations();
        this.initPlayer();
        this.initInput();
        this.initPhysics();
        this.initMap();
        // launch UI scene on top of Game
        this.scene.launch('UI');

        // when the Game scene is resumed (for example after closing the Shop), handle next-wave start
        this.events.on('resume', () => {
            if (this.waitingForNextWave) {
                this.waitingForNextWave = false;
                this.startNextWave();
            }
        });

        this.waves = [
            {
                spawnInterval: 600,
                enemies: [
                    { type: 0, count: 20, power: 0, health: 0, speed: 0.0000 }
                ]
            },
            {
                spawnInterval: 600,
                enemies: [
                    { type: 0, count: 15, power: 0, health: 1, speed: 0.0003 },
                    { type: 1, count: 10, power: 0, health: 0, speed: 0.0000 }
                ]
            },
            {
                spawnInterval: 600,
                enemies: [
                    { type: 0, count: 15, power: 2, health: 1, speed: 0.001 },
                    { type: 1, count: 20, power: 1, health: 2, speed: 0.0008 }
                ]
            },
            {
                spawnInterval: 500,
                enemies: [
                    { type: 1, count: 20, power: 2, health: 2, speed: 0.0015 },
                    { type: 2, count: 20, power: 1, health: 2, speed: 0.0008 }
                ]
            },
            {
                spawnInterval: 500,
                enemies: [
                    { type: 0, count: 20, power: 2, health: 3, speed: 0.002 },
                    { type: 2, count: 20, power: 2, health: 3, speed: 0.001 },
                    { type: 3, count: 10, power: 3, health: 4, speed: 0.0005 }
                ]
            },
            {
                spawnInterval: 400,
                enemies: [
                    { type: 0, count: 30, power: 3, health: 4, speed: 0.005 },
                    { type: 2, count: 20, power: 2, health: 4, speed: 0.0015 },
                    { type: 3, count: 20, power: 3, health: 4, speed: 0.0005 }
                ]
            }
        ];
    }

    update() {
    this.updateMap();

    if (!this.gameStarted) return;

    this.player.update();
}

    initVariables() {
        this.coins = 0;
        this.merchantOpened = false;
        this.merchantThreshold = 1000; // configurable threshold for opening merchant
        this.centreX = this.scale.width * 0.5;
        this.centreY = this.scale.height * 0.5;

        // list of tile ids in tiles.png
        // items nearer to the beginning of the array have a higher chance of being randomly chosen when using weighted()
        this.tiles = [50, 50, 50, 50, 50, 50, 50, 50, 50, 110, 110, 110, 110, 110, 50, 50, 50, 50, 50, 50, 50, 50, 50, 110, 110, 110, 110, 110, 36, 48, 60, 72, 84];
        this.tileSize = 32; // width and height of a tile in pixels

        this.mapOffset = 0; // offset (in tiles) to move the map above the top of the screen
        this.mapTop = -this.mapOffset * this.tileSize; // offset (in pixels) to move the map above the top of the screen
        this.mapHeight = Math.ceil(this.scale.height / this.tileSize) + this.mapOffset + 1; // height of the tile map (in tiles)
        this.mapWidth = Math.ceil(this.scale.width / this.tileSize); // width of the tile map (in tiles)
        this.scrollSpeed = 0; // background scrolling speed (in pixels)
        this.scrollMovement = 0; // current scroll amount
        this.spawnEnemyCounter = 0; // timer before spawning next group of enemies

        this.map; // rference to tile map
        this.groundLayer; // reference to ground layer of tile map

        // shop / kill tracking
        this.enemiesKilled = 0; // total enemies killed since level start
        this.nextShopThreshold = 20; // first shop opens after this many kills; increases each time

        // enemy type registry: define base stats and sprite/frame for each enemy type id
        // Add new enemy types here to make them available to waves
        // Example type: { spriteSheet: ASSETS.spritesheet.ships.key, frame: 0, baseHealth:1, basePower:1, baseSpeed:0.0002, projectile:..., projectileScale:1, melee:false, walkAnim:'enemy_walk_0' }
        this.enemyTypes = {
            0: { spriteSheet: ASSETS.spritesheet.PitchforkPilgrim.key, baseHealth: 1, basePower: 1, baseSpeed: 0.0003, chaseRadius: 100, chaseFactor: 0.18, melee: true, walkAnim: 'enemy_walk_0' },
            1: { spriteSheet: ASSETS.spritesheet.MusketPilgrim.key, baseHealth: 1, basePower: 2, baseSpeed: 0.0002, chaseRadius: 150, chaseFactor: 0.18, projectile: ASSETS.spritesheet.Cannonball.key, projectileScale: 0.5, melee: false, walkAnim: 'enemy_walk_1' },
            2: { spriteSheet: ASSETS.spritesheet.MeleePilgrim.key, baseHealth: 2, basePower: 2, baseSpeed: 0.0001, chaseRadius: 100, chaseFactor: 0.18, melee: true, walkAnim: 'enemy_walk_2' },
            3: { spriteSheet: ASSETS.spritesheet.CannonPilgrim.key, baseHealth: 2, basePower: 3, baseSpeed: 0.00005, chaseRadius: 200, chaseFactor: 0.18, projectile: ASSETS.spritesheet.Cannonball.key, projectileScale: 1.0, melee: false, walkAnim: 'enemy_walk_3' }
        };

        // wave system (optional): define waves where each wave describes enemy groups that ADD to base values
        // example format:
        // this.waves = [ { spawnInterval: 300, enemies: [ { type: 2, count: 5, power:1, health:2, path:0, speed:0.0001 }, ... ] }, ... ];
        this.waves = [];
        this.currentWaveIndex = -1;
        this.waitingForNextWave = false;
        this.waveRemainingToSpawn = 0;
        this.waveRemainingAlive = 0;
    }

    initGameUi() {
        // Create tutorial text
        this.tutorialText = this.add.text(this.centreX, this.centreY, 'Tap to shoot!', {
            fontFamily: 'Arial Black', fontSize: 42, color: '#ffffff',
            stroke: '#000000', strokeThickness: 8,
            align: 'center'
        })
            .setOrigin(0.5)
            .setDepth(100);

        // Create game over text
        this.gameOverText = this.add.text(this.scale.width * 0.5, this.scale.height * 0.5, 'Cooked', {
            fontFamily: 'Arial Black', fontSize: 64, color: '#ffffff',
            stroke: '#000000', strokeThickness: 8,
            align: 'center'
        })
            .setOrigin(0.5)
            .setDepth(100)
            .setVisible(false);
    }

    initAnimations() {
        this.anims.create({
            key: ANIMATION.explosion.key,
            frames: this.anims.generateFrameNumbers(ANIMATION.explosion.texture, ANIMATION.explosion.config),
            frameRate: ANIMATION.explosion.frameRate,
            repeat: ANIMATION.explosion.repeat
        });

        this.anims.create({
            key: 'walk',
            frames: this.anims.generateFrameNumbers('TerryWalking', { start: 0, end: 3}),
            frameRate: 12,
            repeat: -1
        });
        // walking animation for the knives player sprite
        this.anims.create({
            key: 'walk_knives',
            frames: this.anims.generateFrameNumbers('TerryKnives', { start: 0, end: 3}),
            frameRate: 12,
            repeat: -1
        });
        // walking animation for the musket player sprite
        this.anims.create({
            key: 'walk_musket',
            frames: this.anims.generateFrameNumbers('TerryMusket', { start: 0, end: 3}),
            frameRate: 12,
            repeat: -1
        });

        // Enemy walk animations (one per enemy type)
        this.anims.create({
            key: 'enemy_walk_0',
            frames: this.anims.generateFrameNumbers('PitchforkPilgrim', { start: 0, end: 3}),
            frameRate: 10,
            repeat: -1
        });
        this.anims.create({
            key: 'enemy_walk_1',
            frames: this.anims.generateFrameNumbers('MusketPilgrim', { start: 0, end: 3}),
            frameRate: 10,
            repeat: -1
        });
        this.anims.create({
            key: 'enemy_walk_2',
            frames: this.anims.generateFrameNumbers('MeleePilgrim', { start: 0, end: 2}),
            frameRate: 10,
            repeat: -1
        });
        this.anims.create({
            key: 'enemy_walk_3',
            frames: this.anims.generateFrameNumbers('CannonPilgrim', { start: 0, end: 4}),
            frameRate: 10,
            repeat: -1
        });
    }

    initPhysics() {
        this.enemyGroup = this.add.group();
        this.enemyBulletGroup = this.add.group();
        this.playerBulletGroup = this.add.group();

        this.physics.add.overlap(this.player, this.enemyBulletGroup, this.hitPlayer, null, this);
        this.physics.add.overlap(this.playerBulletGroup, this.enemyGroup, this.hitEnemy, null, this);
        this.physics.add.overlap(this.player, this.enemyGroup, this.hitPlayer, null, this);
    }

    initPlayer() {
        // place player near centre so they can run around
        this.player = new Player(this, this.centreX, this.centreY, 8);
    }

    initInput() {
        this.cursors = this.input.keyboard.createCursorKeys();

        // check for spacebar press only once
        this.cursors.space.once('down', (key, event) => {
            this.startGame();
        });
        // also start game when player first taps/clicks
        this.input.once('pointerdown', (pointer) => {
            this.startGame();
        });
    }

    // create tile map data
    initMap() {
        const mapData = [];

        for (let y = 0; y < this.mapHeight; y++) {
            const row = [];

            for (let x = 0; x < this.mapWidth; x++) {
                // randomly choose a tile id from this.tiles
                // weightedPick favours items earlier in the array
                const tileIndex = Phaser.Math.RND.weightedPick(this.tiles);

                row.push(tileIndex);
            }

            mapData.push(row);
        }
        this.map = this.make.tilemap({ data: mapData, tileWidth: this.tileSize, tileHeight: this.tileSize });
        const tileset = this.map.addTilesetImage(ASSETS.spritesheet.tiles.key);
        this.groundLayer = this.map.createLayer(0, tileset, 0, this.mapTop);

        // set physics world and camera bounds to map size so camera can follow player
        const worldWidth = this.mapWidth * this.tileSize;
        const worldHeight = this.mapHeight * this.tileSize;
        this.physics.world.setBounds(0, this.mapTop, worldWidth, worldHeight);
        this.cameras.main.setBounds(0, this.mapTop, worldWidth, worldHeight);

        // if player already exists, start following
        if (this.player) {
            this.cameras.main.startFollow(this.player);
        }
    }

    // scroll the tile map
    updateMap() {
        this.scrollMovement += this.scrollSpeed;

        if (this.scrollMovement >= this.tileSize) {
            //  Create new row on top
            let tile;
            let prev;

            // loop through map from bottom to top row
            for (let y = this.mapHeight - 2; y > 0; y--) {
                // loop through map from left to right column
                for (let x = 0; x < this.mapWidth; x++) {
                    tile = this.map.getTileAt(x, y - 1);
                    prev = this.map.getTileAt(x, y);

                    prev.index = tile.index;

                    if (y === 1) { // if top row
                        // randomly choose a tile id from this.tiles
                        // weightedPick favours items earlier in the array
                        tile.index = Phaser.Math.RND.weightedPick(this.tiles);
                    }
                }
            }

            this.scrollMovement -= this.tileSize; // reset to 0
        }

        if (this.player.health <= 0) {
            this.GameOver('lose');
        }

        this.groundLayer.y = this.mapTop + this.scrollMovement; // move one tile up
    }

    startGame() {
        this.gameStarted = true;
        this.tutorialText.setVisible(false);
        // start first wave
        if (this.waves && this.waves.length > 0) {
            this.startWave(0);
        }
    }

    // unified fire API - supports legacy single-arg and directional fire
    fireBullet(x, y, targetX, targetY, power = 1) {
        // determine weapon info from player if available
        const weapon = (this.player && this.player.currentWeapon) ? this.player.currentWeapon : { bulletKey: ASSETS.spritesheet.FeatherProjectile.key, power: 1 };

        if (typeof targetX !== 'number' || typeof targetY !== 'number') {
            // legacy: fire upwards
            const bullet = new PlayerBullet(this, x, y, weapon.power || power, x, y - 100, weapon.bulletKey);
            this.playerBulletGroup.add(bullet);
            return;
        }

        const bullet = new PlayerBullet(this, x, y, weapon.power || power, targetX, targetY, weapon.bulletKey);
        this.playerBulletGroup.add(bullet);
    }

    removeBullet(bullet) {
        this.playerBulletGroup.remove(bullet, true, true);
    }

    // fireEnemyBullet: optional targetX, targetY for directional bullets; textureKey and textureScale for custom projectile
    fireEnemyBullet(x, y, power, targetX, targetY, textureKey, textureScale) {
        const bullet = new EnemyBullet(this, x, y, power, targetX, targetY, textureKey, textureScale);
        this.enemyBulletGroup.add(bullet);
    }

    removeEnemyBullet(bullet) {
        this.enemyBulletGroup.remove(bullet, true, true);
    }

    // add a group of flying enemies
    addFlyingGroup() {
        this.spawnEnemyCounter = Phaser.Math.RND.between(5, 8) * 60; // spawn next group after x seconds
        const randomId = Phaser.Math.RND.between(0, 11); // id to choose image in tiles.png
        const randomCount = Phaser.Math.RND.between(5, 15); // number of enemies to spawn
        const randomInterval = Phaser.Math.RND.between(8, 12) * 100; // delay between spawning of each enemy
        const randomPath = Phaser.Math.RND.between(0, 3); // choose a path, a group follows the same path
        const randomPower = Phaser.Math.RND.between(1, 4); // strength of the enemy to determine damage to inflict and selecting bullet image
        const randomSpeed = Phaser.Math.RND.realInRange(0.0001, 0.001); // increment of pathSpeed in enemy

        this.timedEvent = this.time.addEvent(
            {
                delay: randomInterval,
                callback: this.addEnemy,
                args: [randomId, randomPath, randomSpeed, randomPower], // parameters passed to addEnemy()
                callbackScope: this,
                repeat: randomCount
            }
        );
    }

    addEnemy(shipId, pathId, speed, power, health) {
        const enemy = new EnemyFlying(this, shipId, pathId, speed, power, health);
        this.enemyGroup.add(enemy);
    }

    removeEnemy(enemy) {
        this.enemyGroup.remove(enemy, true, true);
        // if wave system active, decrement counters and check for wave completion
        if (typeof this.waveRemainingAlive === 'number' && this.currentWaveIndex >= 0) {
            this.waveRemainingAlive--;
            if (this.waveRemainingAlive <= 0 && this.waveRemainingToSpawn <= 0) {
                // wave complete -> open shop and wait for resume to start next wave
                this.openShop();
            }
        }
    }

    addExplosion(x, y) {
        new Explosion(this, x, y);
    }

    hitPlayer(player, obstacle) {
        this.addExplosion(player.x, player.y);
        player.hit(obstacle.getPower());
        obstacle.die();
    }

hitEnemy(bullet, enemy) {
    this.updatecoins(10);
    bullet.remove();
    enemy.hit(bullet.getPower());   // let the enemy explode/die first

    // track kills and open shop when cumulative threshold reached
    this.enemiesKilled++;
}

    updatecoins(points) {
    this.coins += points;
    // emit event so UI scene can update
    this.events.emit('coinsUpdated', this.coins);
    // debugging log: track coin changes
    console.debug(`coins updated -> ${this.coins}`);
}



    GameOver(reason = 'lose') {
        // navigate to the GameOver scene with the reason
        this.scene.start('GameOver', { reason: reason });
    }

    // Wave system: start a configured wave (wave index)
    startWave(waveIndex) {
        const wave = this.waves[waveIndex];
        if (!wave) return;

        this.currentWaveIndex = waveIndex;
        this.waitingForNextWave = false;

        // emit wave started event for UI
        this.events.emit('waveStarted', waveIndex, this.waves.length);

        // build spawn queue from wave definition -- wave values are ADDED to base enemy values
        this._waveSpawnQueue = [];
        for (const group of wave.enemies) {
            const typeId = group.type;
            const count = group.count || 1;
            const base = this.enemyTypes[typeId] || {};

            // compute final stats by adding wave modifiers to base values
            const finalPower = (base.basePower || 1) + (group.power || 0);
            const finalHealth = (typeof base.baseHealth === 'number' ? base.baseHealth : 1) + (group.health || 0);
            const finalSpeed = (typeof base.baseSpeed === 'number' ? base.baseSpeed : 0.0002) + (group.speed || 0);
            const path = (typeof group.path === 'number') ? group.path : null;

            for (let i = 0; i < count; i++) {
                this._waveSpawnQueue.push({ shipId: typeId, pathId: path, speed: finalSpeed, power: finalPower, health: finalHealth });
            }
        }

        this.waveRemainingToSpawn = this._waveSpawnQueue.length;
        this.waveRemainingAlive = this._waveSpawnQueue.length;

        if (this.waveRemainingAlive <= 0) {
            // nothing to spawn, open the shop immediately
            this.openShop();
            return;
        }

        const interval = wave.spawnInterval || 400;

        // schedule spawns
        this._waveTimer = this.time.addEvent({
            delay: interval,
            callback: () => {
                const next = this._waveSpawnQueue.shift();
                if (next) {
                    const pickPath = (typeof next.pathId === 'number') ? next.pathId : Phaser.Math.RND.between(0, 3);
                    const pickSpeed = (typeof next.speed === 'number') ? next.speed : Phaser.Math.RND.realInRange(0.0001, 0.001);
                    this.addEnemy(next.shipId, pickPath, pickSpeed, next.power, next.health);
                    this.waveRemainingToSpawn--;
                }
                if (this.waveRemainingToSpawn <= 0) {
                    if (this._waveTimer) this._waveTimer.remove(false);
                }
            },
            callbackScope: this,
            repeat: this._waveSpawnQueue.length - 1
        });

        // spawn one immediately for pacing
        const first = this._waveSpawnQueue.shift();
        if (first) {
            const pickPath = (typeof first.pathId === 'number') ? first.pathId : Phaser.Math.RND.between(0, 3);
            const pickSpeed = (typeof first.speed === 'number') ? first.speed : Phaser.Math.RND.realInRange(0.0001, 0.001);
            this.addEnemy(first.shipId, pickPath, pickSpeed, first.power, first.health);
            this.waveRemainingToSpawn--;
        }
    }

    startNextWave() {
        const nextIndex = this.currentWaveIndex + 1;
        if (nextIndex >= 0 && nextIndex < this.waves.length) {
            this.startWave(nextIndex);
        } else {
            // all waves completed
            this.GameOver('win');
        }
    }

    openShop() {
        this.waitingForNextWave = true;
        // Pause the game scene and launch the shop overlay
        this.scene.pause(); // pause this Game scene
        this.scene.launch('Shop'); // launch shop as an overlay scene
        // increase the next threshold (20 -> 40 -> 60 ...)
        this.nextShopThreshold += 20;
    }

}