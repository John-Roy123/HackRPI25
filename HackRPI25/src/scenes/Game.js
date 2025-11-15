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
    }

    update() {
    this.updateMap();

    if (!this.gameStarted) return;

    this.player.update();

    // only spawn enemies while under the coin threshold
    if (this.coins < this.merchantThreshold) {
        if (this.spawnEnemyCounter > 0) {
            this.spawnEnemyCounter--;
        } else {
            this.addFlyingGroup();
        }
    }
}

    initVariables() {
        this.coins = 0;
        this.merchantOpened = false;
        this.merchantThreshold = 100; // configurable threshold for opening merchant
        this.centreX = this.scale.width * 0.5;
        this.centreY = this.scale.height * 0.5;

        // list of tile ids in tiles.png
        // items nearer to the beginning of the array have a higher chance of being randomly chosen when using weighted()
        this.tiles = [50, 50, 50, 50, 50, 50, 50, 50, 50, 110, 110, 110, 110, 110, 50, 50, 50, 50, 50, 50, 50, 50, 50, 110, 110, 110, 110, 110, 36, 48, 60, 72, 84];
        this.tileSize = 32; // width and height of a tile in pixels

        this.mapOffset = 10; // offset (in tiles) to move the map above the top of the screen
        this.mapTop = -this.mapOffset * this.tileSize; // offset (in pixels) to move the map above the top of the screen
        this.mapHeight = Math.ceil(this.scale.height / this.tileSize) + this.mapOffset + 1; // height of the tile map (in tiles)
        this.mapWidth = Math.ceil(this.scale.width / this.tileSize); // width of the tile map (in tiles)
        this.scrollSpeed = 0; // background scrolling speed (in pixels)
        this.scrollMovement = 0; // current scroll amount
        this.spawnEnemyCounter = 0; // timer before spawning next group of enemies

        this.map; // rference to tile map
        this.groundLayer; // reference to ground layer of tile map

        this.levels = [
            { enemyCount: 6, spawnInterval: 400, minPower: 1, maxPower: 2, minSpeed: 0.0001, maxSpeed: 0.0005 },
            { enemyCount: 10, spawnInterval: 320, minPower: 1, maxPower: 3, minSpeed: 0.00015, maxSpeed: 0.0008 },
            // add more levels...
        ];
        this.currentLevel = -1;
        this.remainingToSpawn = 0;
        this.remainingAlive = 0;
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

        // Create coins text
        this.coinsText = this.add.text(20, 20, 'coins: 0', {
            fontFamily: 'Arial Black', fontSize: 28, color: '#ffffff',
            stroke: '#000000', strokeThickness: 8,
        })
            .setDepth(100);

        // Create game over text
        this.gameOverText = this.add.text(this.scale.width * 0.5, this.scale.height * 0.5, 'Game Over', {
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

        this.groundLayer.y = this.mapTop + this.scrollMovement; // move one tile up
    }

    startGame() {
        this.gameStarted = true;
        this.tutorialText.setVisible(false);
        // start requested restart level if provided, otherwise start level 0
        if (this.requestedRestartLevel !== null) {
            this.startLevel(this.requestedRestartLevel);
            this.requestedRestartLevel = null; // clear after use
        } else {
            this.startLevel(0);
        }
    }

    fireBullet(x, y) {
        // legacy single-arg fire kept for compatibility (fires upward)
        const bullet = new PlayerBullet(this, x, y, 1, x, y - 100);
        this.playerBulletGroup.add(bullet);
    }

    // new directional fire API
    fireBullet(x, y, targetX, targetY, power = 1) {
        const bullet = new PlayerBullet(this, x, y, power, targetX, targetY);
        this.playerBulletGroup.add(bullet);
    }

    removeBullet(bullet) {
        this.playerBulletGroup.remove(bullet, true, true);
    }

    fireEnemyBullet(x, y, power) {
        const bullet = new EnemyBullet(this, x, y, power);
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

    addEnemy(shipId, pathId, speed, power) {
        const enemy = new EnemyFlying(this, shipId, pathId, speed, power);
        this.enemyGroup.add(enemy);
    }

    removeEnemy(enemy) {
        this.enemyGroup.remove(enemy, true, true);
    }

    addExplosion(x, y) {
        new Explosion(this, x, y);
    }

    hitPlayer(player, obstacle) {
        this.addExplosion(player.x, player.y);
        player.hit(obstacle.getPower());
        obstacle.die();

        this.GameOver('lose');
    }

hitEnemy(bullet, enemy) {
    this.updatecoins(10);
    bullet.remove();
    enemy.hit(bullet.getPower());   // let the enemy explode/die first

    // AFTER all that, check for the coin threshold once
    if (!this.merchantOpened && this.coins >= this.merchantThreshold) {
        console.info(`Merchant opening: coins=${this.coins} (threshold=${this.merchantThreshold})`);
        
    }
}

    updatecoins(points) {
    this.coins += points;
    this.coinsText.setText(`coins: ${this.coins}`);
    // debugging log: track coin changes
    console.debug(`coins updated -> ${this.coins}`);
}



    GameOver(reason = 'lose') {
        // navigate to the GameOver scene and pass current level + reason so it can show the proper ending
        const levelToRestart = (typeof this.currentLevel === 'number' && this.currentLevel >= 0) ? this.currentLevel : 0;
            // for losing, switch to the GameOver scene (full-screen)
            this.scene.start('GameOver', { level: levelToRestart, reason: reason });
        
    }
    // startLevel is a method that begins a fixed-enemy level
    startLevel(levelIndex) {
        const level = this.levels[levelIndex];
        if (!level) {
            // no more levels -> player has completed all levels
            this.GameOver('win');
            return;
        }

        this.currentLevel = levelIndex;
        this.remainingToSpawn = level.enemyCount;
        this.remainingAlive = level.enemyCount;

        // schedule spawns: repeat = enemyCount - 1 because first spawn occurs immediately below
        this.timedEvent = this.time.addEvent({
            delay: level.spawnInterval,
            callback: () => {
                // pick random attributes (you can alter this to be deterministic)
                const randomId = Phaser.Math.RND.between(0, 11);
                const randomPath = Phaser.Math.RND.between(0, 3);
                const randomPower = Phaser.Math.RND.between(level.minPower, level.maxPower);
                const randomSpeed = Phaser.Math.RND.realInRange(level.minSpeed, level.maxSpeed);

                if(this.coins < this.merchantThreshold){
                this.addEnemy(randomId, randomPath, randomSpeed, randomPower);
                this.remainingToSpawn--;
                if (this.remainingToSpawn <= 0) {
                    // all scheduled; stop the timed event
                    if (this.timedEvent) this.timedEvent.remove(false);
                }}
            },
            callbackScope: this,
            repeat: level.enemyCount - 1
        });

        // spawn one immediately for nicer pacing:
        const rId = Phaser.Math.RND.between(0, 11);
        const rPath = Phaser.Math.RND.between(0, 3);
        const rPower = Phaser.Math.RND.between(level.minPower, level.maxPower);
        const rSpeed = Phaser.Math.RND.realInRange(level.minSpeed, level.maxSpeed);
        this.addEnemy(rId, rPath, rSpeed, rPower);
        this.remainingToSpawn--;
    }

}