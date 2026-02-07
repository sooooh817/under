/**
 * はっぱカッター - 追加スキル
 * ブーメランのように飛び、戻ってくる
 */
class LeafCutter extends Skill {
    constructor() {
        super({
            name: 'はっぱカッター',
            description: 'ブーメランのように戻ってくる葉っぱ',
            icon: '🍃',
            color: '#44ff44',
            damage: 10,
            cooldown: 2.0,
            pierce: 99, // 無限貫通
            projectileCount: 1,
            projectileSpeed: 350,
            size: 12
        });

        this.maxDistance = 200;
    }

    fire(player, game) {
        super.fire(player, game);

        for (let i = 0; i < this.projectileCount; i++) {
            // 最も近い敵を探す
            let target = null;
            let minDist = Infinity;

            for (const enemy of game.enemies) {
                if (!enemy.active) continue;
                const dist = player.position.distanceTo(enemy.position);
                if (dist < minDist) {
                    minDist = dist;
                    target = enemy;
                }
            }

            let direction;
            if (target && minDist < 400) { // 射程内なら狙う
                direction = target.position.subtract(player.position).normalized;
                // 複数の葉っぱがある場合、少しだけばらけさせる
                if (this.projectileCount > 1) {
                    const spread = (Math.random() - 0.5) * 0.5; // +/- 0.25 rad
                    const angle = Math.atan2(direction.y, direction.x) + spread;
                    direction = new Vector2(Math.cos(angle), Math.sin(angle));
                }
            } else {
                // 敵がいない場合はランダム
                const angle = Math.random() * Math.PI * 2;
                direction = Vector2.fromAngle(angle);
            }

            const projectile = new Projectile(
                player.position.x,
                player.position.y,
                {
                    damage: Math.floor(this.damage * player.damageMultiplier),
                    speed: this.projectileSpeed,
                    direction: direction,
                    pierce: this.pierce,
                    size: this.size,
                    color: '#66ff66',
                    type: 'boomerang',
                    knockback: 80,
                    lifetime: 10,
                    maxDistance: this.maxDistance,
                    owner: player
                }
            );

            game.projectiles.push(projectile);
        }
    }

    applyUpgrade() {
        switch (this.level) {
            case 2:
                this.damage = 15; // 10+5
                break;
            case 3:
                this.projectileCount = 2;
                break;
            case 4:
                this.damage = 20; // 15+5
                this.maxDistance = 250;
                break;
            case 5:
                this.cooldown = 1.5;
                this.projectileCount = 3;
                break;
            case 6:
                this.damage = 27; // 20+7
                this.projectileSpeed = 400;
                break;
            case 7:
                this.projectileCount = 4;
                this.maxDistance = 300;
                break;
            case 8:
                this.damage = 36; // 27+9
                this.cooldown = 1.0;
                this.projectileCount = 5;
                break;
        }
    }

    getUpgradeDescription() {
        if (this.level >= this.maxLevel) return '最大レベル';

        const nextLevel = this.level + 1;
        switch (nextLevel) {
            case 2: return '威力+4';
            case 3: return '発射数+1';
            case 4: return '威力+4, 飛距離UP';
            case 5: return 'CD-0.5秒, 発射数+1';
            case 6: return '威力+6, 弾速UP';
            case 7: return '発射数+1, 飛距離UP';
            case 8: return '威力+8, CD-0.5秒, 発射数+1';
            default: return '';
        }
    }
}
