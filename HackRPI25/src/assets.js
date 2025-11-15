export default {
    // 'audio': {
    //     score: {
    //         key: 'sound',
    //         args: ['assets/sound.mp3', 'assets/sound.m4a', 'assets/sound.ogg']
    //     },
    // },
    // 'image': {
    //     spikes: {
    //         key: 'spikes',
    //         args: ['assets/spikes.png']
    //     },
    // },
    'spritesheet': {
        ships: {
            key: 'ships',
            args: ['assets/ships.png', {
                frameWidth: 64,
                frameHeight: 64,
            }]
        },
        tiles: {
            key: 'tiles',
            args: ['assets/tiles.png', {
                frameWidth: 32,
                frameHeight: 32
            }]
        },
        TerryWalking: {
            key: 'TerryWalking',
            args: ['assets/TerryWalking.png', {
                frameWidth: 64,
                frameHeight: 64,
            }]
        },
        TerryKnives: {
            key: 'TerryKnives',
            args: ['assets/TerryKnives.png', {
                frameWidth: 64,
                frameHeight: 64,
            }]
        },
        FeatherProjectile: {
            key: 'FeatherProjectile',
            args: ['assets/FeatherProjectile.png', {
                frameWidth: 64,
                frameHeight: 64,
            }]
        }
        ,
        KnifeProjectile: {
            key: 'KnifeProjectile',
            args: ['assets/KnifeProjectile.png', {
                frameWidth: 32,
                frameHeight: 32,
            }]
        }
    }
};