import ASSETS from '../assets.js';

export class Shop extends Phaser.Scene {
    constructor() {
        super('Shop');
    }

    create() {
        const gameScene = this.scene.get('Game');
        const width = this.scale.width;
        const height = this.scale.height;

        // dim background
        this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.5).setDepth(200);

        // panel
        const panelW = Math.min(900, width * 0.8);
        const panelH = Math.min(500, height * 0.7);
        const panelX = width / 2;
        const panelY = height / 2;
        this.add.rectangle(panelX, panelY, panelW, panelH, 0x111827, 0.95).setDepth(201).setStrokeStyle(2, 0xffffff, 0.1);

        // title
        this.add.text(panelX, panelY - panelH / 2 + 40, 'Shop', { fontFamily: 'Arial Black', fontSize: 48, color: '#ffffff' }).setOrigin(0.5).setDepth(202);

        // coins display
        this.coinsText = this.add.text(panelX - panelW / 2 + 40, panelY - panelH / 2 + 100, `Coins: ${gameScene.coins}`, { fontFamily: 'Arial', fontSize: 28, color: '#ffff00' }).setDepth(202);

        const items = [
            { id: 'health', label: 'Health +1', cost: 20 },
            { id: 'speed', label: 'Max Speed +100', cost: 50 },
            { id: 'knives', label: 'Knives (weapon)', cost: 80 }
        ];

        const startY = panelY - panelH / 2 + 150;
        items.forEach((item, idx) => {
            const y = startY + idx * 70;
            const label = this.add.text(panelX - panelW / 2 + 60, y, `${item.label}`, { fontFamily: 'Arial', fontSize: 26, color: '#ffffff' }).setDepth(202);
            const cost = this.add.text(panelX + panelW / 2 - 120, y, `${item.cost}c`, { fontFamily: 'Arial', fontSize: 26, color: '#ffffff' }).setDepth(202);

            const buy = this.add.text(panelX + panelW / 2 - 40, y, 'Buy', { fontFamily: 'Arial Black', fontSize: 26, color: '#00ff00' }).setOrigin(0.5).setDepth(202).setInteractive({ useHandCursor: true });
            buy.on('pointerdown', () => {
                if (gameScene.coins >= item.cost) {
                    // apply effect
                    if (item.id === 'health') {
                        if (gameScene.player && typeof gameScene.player.hit === 'function') {
                            gameScene.player.health = (gameScene.player.health || 1) + 1;
                        }
                    } else if (item.id === 'speed') {
                        if (gameScene.player) {
                            gameScene.player.velocityMax = (gameScene.player.velocityMax || 500) + 100;
                            gameScene.player.setMaxVelocity(gameScene.player.velocityMax);
                        }
                    } else if (item.id === 'knives') {
                        if (gameScene.player) {
                            // equip knives: change player texture, change projectile, and increase power
                            gameScene.player.equipWeapon({
                                name: 'knives',
                                bulletKey: ASSETS.spritesheet.KnifeProjectile.key,
                                power: 3,
                                playerTextureKey: ASSETS.spritesheet.TerryKnives.key,
                                walkAnimKey: 'walk_knives'
                            });
                        }
                    }

                    gameScene.updatecoins(-item.cost);
                    this.coinsText.setText(`Coins: ${gameScene.coins}`);
                    this.showFeedback('Purchase successful');
                } else {
                    this.showFeedback('Not enough coins');
                }
            });
        });

        // continue button
        const continueBtn = this.add.text(panelX, panelY + panelH / 2 - 60, 'Continue', { fontFamily: 'Arial Black', fontSize: 32, color: '#ffffff', backgroundColor: '#0b84ff' }).setOrigin(0.5).setDepth(202).setPadding(10).setInteractive({ useHandCursor: true });
        continueBtn.on('pointerdown', () => {
            // close shop and resume game
            this.scene.stop();
            this.scene.resume('Game');
        });

        // small feedback text
        this.feedback = this.add.text(panelX, panelY + panelH / 2 - 120, '', { fontFamily: 'Arial', fontSize: 20, color: '#ffffff' }).setOrigin(0.5).setDepth(202);
    }

    showFeedback(message) {
        this.feedback.setText(message);
        this.time.addEvent({ delay: 1200, callback: () => this.feedback.setText('') });
    }
}
