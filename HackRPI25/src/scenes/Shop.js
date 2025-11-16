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
        this.coinsText = this.add.text(panelX - panelW / 2 + 40, panelY - panelH / 2 + 40, `Coins: ${gameScene.coins}`, { fontFamily: 'Arial', fontSize: 28, color: '#ffff00' }).setDepth(202);

        // split panel: left column = WiseTurkey (info), right column = shop items
        const leftW = Math.floor(panelW * 0.38);
        const leftX = panelX - panelW / 2 + leftW / 2 + 10;
        const rightStartX = panelX - panelW / 2 + leftW + 30;

        // WiseTurkey: interactive sprite that sells information
        // Editable scale: change this.wiseScale to adjust visual size
        this.wiseScale = 3.0; // make the turkey much larger by default
        const turkeyX = panelX - panelW / 2 + Math.floor(leftW / 2) + 20;
        const turkeyY = panelY - 20;
        this.wiseCost = 15; // cost to buy a piece of information

        // Wisdom sign above the turkey: use asset if available, otherwise show text sign
        const sign = this.add.image(turkeyX, turkeyY - 90, ASSETS.image.WisdomSign.key).setDepth(202).setOrigin(0.5);
        sign.setScale(1.4);

        this.wise = this.add.image(turkeyX, turkeyY, ASSETS.image.WiseTurkey.key).setDepth(202).setInteractive({ useHandCursor: true });
        this.wise.setScale(this.wiseScale);
        this.wise.on('pointerdown', () => {
            if (gameScene.coins >= this.wiseCost) {
                gameScene.updatecoins(-this.wiseCost);
                this.coinsText.setText(`Coins: ${gameScene.coins}`);
                this.showInfo();
            } else {
                this.showFeedback('Too poor for wisdom');
            }
        });

        // info text area under wise turkey
        this.infoText = this.add.text(turkeyX - leftW / 2 + 12, turkeyY + 80, '', { fontFamily: 'Arial', fontSize: 18, color: '#ffffff', wordWrap: { width: leftW - 24 } }).setDepth(202);

        // Items list -- keep references so items can be removed or replaced when purchased
        const items = [
            { id: 'health', label: 'Health +1', cost: 75 },
            { id: 'speed', label: 'Max Speed +100', cost: 50 },
            { id: 'knives', label: 'Knives (weapon)', cost: 200 }
        ];

        this.shopItems = {}; // store UI refs by item id

        const startY = panelY - panelH / 2 + 150;
        items.forEach((item, idx) => {
            const y = startY + idx * 70;
            const label = this.add.text(rightStartX + 20, y, `${item.label}`, { fontFamily: 'Arial', fontSize: 26, color: '#ffffff' }).setDepth(202);
            const cost = this.add.text(panelX + panelW / 2 - 120, y, `${item.cost}c`, { fontFamily: 'Arial', fontSize: 26, color: '#ffffff' }).setDepth(202);

            const buy = this.add.text(panelX + panelW / 2 - 40, y, 'Buy', { fontFamily: 'Arial Black', fontSize: 26, color: '#00ff00' }).setOrigin(0.5).setDepth(202).setInteractive({ useHandCursor: true });

            // store refs
            this.shopItems[item.id] = { label, cost, buy, meta: item };

            buy.on('pointerdown', () => {
                if (gameScene.coins >= item.cost) {
                    // apply effect
                    if (item.id === 'health') {
                        if (gameScene.player && typeof gameScene.player.hit === 'function') {
                            gameScene.player.health = (gameScene.player.health || 1) + 1;
                            // notify UI of health change
                            gameScene.events.emit('healthUpdated', gameScene.player.health);
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

                            // after purchase, remove/replace this shop item with a placeholder
                            const ui = this.shopItems['knives'];
                            if (ui) {
                                ui.label.setText('New Weapon (coming soon)');
                                ui.cost.setText('--');
                                ui.buy.setText('Sold').setStyle({ color: '#888888' });
                                ui.buy.disableInteractive();
                            }
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

    showInfo() {
        const infoLines = [
            'Not all turkeys look the same you know...',
            'Tip: Shooting while strafing conserves position.',
            'Tip: Knives do more damage at close range.',
            'Tip: Turkey inflation only affects the poor.',
            'Tip: Enemies tend to shoot at you — keep moving!',
            'Tip: If you get every upgrade, you win (you dont I lied).',
            'Tip: Turkeys will rule the world one day.',
            'I wonder what happens if you get the health bar off the screen?'
        ];
        const idx = Phaser.Math.RND.between(0, infoLines.length - 1);
        this.infoText.setText(infoLines[idx]);
        this.time.addEvent({ delay: 5000, callback: () => this.infoText.setText('') });
    }

    showFeedback(message) {
        this.feedback.setText(message);
        this.time.addEvent({ delay: 1200, callback: () => this.feedback.setText('') });
    }
}
