/**
 * マジカルフレイム - 追加スキル
 * ランダムな位置に炎エリアを設置
 */
class MagicalFlame extends Skill {
    constructor() {
        super({
            name: 'マジカルフレイム',
            description: 'ランダムな位置に炎を設置',
            icon: '🔥',
            color: '#ff6600',
            damage: 5, // per tick
            cooldown: 4.0
        });

        this.duration = 2.0;
        this.tickRate = 0.3;
        this.range = 100; // 50 -> 100 (2倍)
        this.flameCount = 1;
    }

    fire(player, game) {
        super.fire(player, game);

        for (let i = 0; i < this.flameCount; i++) {
            // 画面内のランダムな位置（プレイヤー周辺）
            const offsetX = (Math.random() - 0.5) * 400;
            const offsetY = (Math.random() - 0.5) * 400;

            let x = player.position.x + offsetX;
            let y = player.position.y + offsetY;

            // 画面内に収める
            x = Math.max(this.range, Math.min(game.canvas.width - this.range, x));
            y = Math.max(this.range, Math.min(game.canvas.height - this.range, y));

            game.flames.push({
                x: x,
                y: y,
                damage: Math.floor(this.damage * player.damageMultiplier),
                range: this.range,
                duration: this.duration,
                time: 0,
                tickTimer: 0,
                tickRate: this.tickRate,
                hitEnemies: new Map() // 敵ごとに次にダメージを与えられる時間を記録
            });
        }
    }

    applyUpgrade() {
        switch (this.level) {
            case 2:
                this.damage = 8; // 5+3
                this.duration = 2.5;
                break;
            case 3:
                this.flameCount = 2;
                break;
            case 4:
                this.damage = 12; // 8+4
                this.range = 130; // 65 -> 130
                break;
            case 5:
                this.cooldown = 3.0;
                this.flameCount = 3;
                break;
            case 6:
                this.damage = 17; // 12+5
                this.duration = 3.0;
                break;
            case 7:
                this.flameCount = 4;
                this.range = 160; // 80 -> 160
                break;
            case 8:
                this.damage = 24; // 17+7
                this.cooldown = 2.0;
                this.flameCount = 5;
                break;
        }
    }

    getUpgradeDescription() {
        if (this.level >= this.maxLevel) return '最大レベル';

        const nextLevel = this.level + 1;
        switch (nextLevel) {
            case 2: return '威力+2, 持続+0.5秒';
            case 3: return '設置数+1';
            case 4: return '威力+3, 範囲UP';
            case 5: return 'CD-1秒, 設置数+1';
            case 6: return '威力+4, 持続+0.5秒';
            case 7: return '設置数+1, 範囲UP';
            case 8: return '威力+6, CD-1秒, 設置数+1';
            default: return '';
        }
    }
}
