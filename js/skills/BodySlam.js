/**
 * のしかかり - タンク型初期スキル
 * 自分の周囲に円形の衝撃波を発生
 */
class BodySlam extends Skill {
    constructor() {
        super({
            name: 'のしかかり',
            description: '周囲の敵に衝撃波ダメージ',
            icon: '💥',
            color: '#22aa88',
            damage: 16,
            cooldown: 2.5,
            knockback: 300,
            size: 80
        });

        this.range = 80;
        this.maxLevel = 4; // MAXレベルを4に制限
    }

    fire(player, game) {
        super.fire(player, game);

        // 衝撃波エフェクトを追加
        game.effects.push({
            type: 'shockwave',
            x: player.position.x,
            y: player.position.y,
            radius: 0,
            maxRadius: this.range,
            color: '#44ffaa',
            duration: 0.3,
            time: 0
        });

        // 範囲内の敵にダメージ
        for (const enemy of game.enemies) {
            if (!enemy.active) continue;

            const dist = player.position.distanceTo(enemy.position);
            if (dist <= this.range + enemy.size) {
                const knockbackDir = enemy.position.subtract(player.position).normalized;
                const damage = Math.floor(this.damage * player.damageMultiplier);

                const killed = enemy.takeDamage(damage, knockbackDir, this.knockback);

                game.showDamage(enemy.position.x, enemy.position.y, damage, false);

                if (killed) {
                    game.onEnemyKilled(enemy);
                }
            }
        }
    }

    applyUpgrade() {
        switch (this.level) {
            case 2:
                this.damage = 21; // 16+5
                this.range = 100;
                break;
            case 3:
                this.cooldown = 2.0;
                this.knockback = 400;
                break;
            case 4:
                this.damage = 30; // 21+9
                this.range = 120;
                this.cooldown = 1.8;
                break;
        }
    }

    getUpgradeDescription() {
        if (this.level >= this.maxLevel) return '最大レベル';

        const nextLevel = this.level + 1;
        switch (nextLevel) {
            case 2: return '威力+5, 範囲+20';
            case 3: return 'CD-0.5秒, ノックバック強化';
            case 4: return '威力+8, 範囲+20, CD-0.2秒';
            default: return '';
        }
    }
}
