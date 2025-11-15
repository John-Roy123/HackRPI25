export class GameOver extends Phaser.Scene {
    constructor() {
        super('GameOver');
    }

    init(data) {
        this.level = (data && data.level !== undefined) ? data.level : 0;
        this.reason = (data && data.reason) ? data.reason : 'lose'; // 'lose' or 'win'
    }

    create() {
        if (this.reason === 'win') {
            this.add.text(this.scale.width * 0.5, this.scale.height * 0.45, 'You Win!', {
                fontFamily: 'Arial Black', fontSize: 64, color: '#ffff66',
                stroke: '#000000', strokeThickness: 16,
                align: 'center'
            }).setOrigin(0.5);

            this.add.text(this.scale.width * 0.5, this.scale.height * 0.62, 'Press SPACE to play again', {
                fontFamily: 'Arial', fontSize: 28, color: '#ffffff'
            }).setOrigin(0.5);

            // restart whole game from level 0 on spacebar
            this.input.keyboard.once('keydown-SPACE', () => {
                this.scene.start('Game', { restartLevel: 0 });
            });

            // also restart on pointer/tap
            this.input.once('pointerdown', () => {
                this.scene.start('Game', { restartLevel: 0 });
            });
        } else {
            // lose screen -- add background to obscure game
            this.background1 = this.add.image(0, 0, 'background').setOrigin(0);

            this.add.text(this.scale.width * 0.5, this.scale.height * 0.45, 'Game Over', {
                fontFamily: 'Arial Black', fontSize: 64, color: '#ffffff',
                stroke: '#000000', strokeThickness: 8,
                align: 'center'
            }).setOrigin(0.5);

            this.add.text(this.scale.width * 0.5, this.scale.height * 0.62, 'Press SPACE to restart level', {
                fontFamily: 'Arial', fontSize: 28, color: '#ffffff'
            }).setOrigin(0.5);

            // restart on spacebar
            this.input.keyboard.once('keydown-SPACE', () => {
                this.scene.start('Game', { restartLevel: this.level });
            });

            // also restart on pointer/tap
            this.input.once('pointerdown', () => {
                this.scene.start('Game', { restartLevel: this.level });
            });
        }
    }
}
