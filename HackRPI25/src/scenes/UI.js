export class UI extends Phaser.Scene {
    constructor() {
        super('UI');
    }

    create() {
        const gameScene = this.scene.get('Game');

        // Create coins text in fixed screen space (not affected by camera)
        this.coinsText = this.add.text(20, 20, `coins: ${gameScene.coins}`, {
            fontFamily: 'Arial Black', fontSize: 28, color: '#ffffff',
            stroke: '#000000', strokeThickness: 8,
        })
            .setDepth(200)
            .setScrollFactor(0); // fix to screen, ignore camera

        // Create wave counter text
        const currentWave = (gameScene.currentWaveIndex >= 0) ? (gameScene.currentWaveIndex + 1) : 0;
        const totalWaves = (gameScene.waves && gameScene.waves.length) ? gameScene.waves.length : 0;
        this.waveText = this.add.text(this.scale.width - 20, 20, `Wave ${currentWave} / ${totalWaves}`, {
            fontFamily: 'Arial Black', fontSize: 28, color: '#ffff00',
            stroke: '#000000', strokeThickness: 8,
        })
            .setOrigin(1, 0)
            .setDepth(200)
            .setScrollFactor(0); // fix to screen

        // Listen to Game scene's coin updates
        gameScene.events.on('coinsUpdated', (newCoins) => {
            this.coinsText.setText(`coins: ${newCoins}`);
        });

        // Listen to wave start/progression
        gameScene.events.on('waveStarted', (waveIndex, totalWaves) => {
            this.waveText.setText(`Wave ${waveIndex + 1} / ${totalWaves}`);
        });

        // Health icons
        this.healthIcons = [];
        const initialHealth = (gameScene.player && typeof gameScene.player.health === 'number') ? gameScene.player.health : 0;
        this.updateHealthIcons(initialHealth);

        // Listen for health updates
        gameScene.events.on('healthUpdated', (newHealth) => {
            this.updateHealthIcons(newHealth);
        });
    }

    updateHealthIcons(hp) {
        // remove existing icons
        this.healthIcons.forEach(icon => icon.destroy());
        this.healthIcons = [];

        const startX = 20;
        const startY = 64; // below coins
        const spacing = 36;

        for (let i = 0; i < Math.max(0, hp); i++) {
            const icon = this.add.image(startX + i * spacing, startY, 'HealthIcon').setOrigin(0, 0).setDepth(200).setScrollFactor(0);
            // optional scale to fit UI
            icon.setScale(0.6);
            this.healthIcons.push(icon);
        }
    }
}
