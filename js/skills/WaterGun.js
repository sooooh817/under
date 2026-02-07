/**
 * みずでっぽう - 遠距離型初期スキル
 * 直線的な貫通弾
 */
class WaterGun extends Skill {
    constructor() {
        super({
            name: 'みずでっぽう',
            description: '敵を貫通する水弾を発射',
            icon: '💧',
            color: '#44aadd',
            damage: 13,
            cooldown: 1.8,
            pierce: 2,
            projectileCount: 1,
            projectileSpeed: 400,
            size: 10,
            knockback: 150
        });
    }

    fire(player, game) {
        super.fire(player, game);

        // 最も近い敵を探す
        let nearestEnemy = null;
        let nearestDist = Infinity;

        for (const enemy of game.enemies) {
            if (!enemy.active) continue;
            const dist = player.position.distanceTo(enemy.position);
            if (dist < nearestDist) {
                nearestDist = dist;
                nearestEnemy = enemy;
            }
        }

        // 発射方向を決定（最も近い敵がいればそちらに、いなければプレイヤーの向き）
        let direction;
        if (nearestEnemy) {
            direction = nearestEnemy.position.subtract(player.position).normalized;
        } else {
            direction = player.facing.clone();
        }

        // 弾を発射
        const angleSpread = 0.15;
        for (let i = 0; i < this.projectileCount; i++) {
            let fireDir = direction;

            if (this.projectileCount > 1) {
                const offset = (i - (this.projectileCount - 1) / 2) * angleSpread;
                const angle = direction.angle + offset;
                fireDir = Vector2.fromAngle(angle);
            }

            const projectile = new Projectile(
                player.position.x,
                player.position.y,
                {
                    damage: Math.floor(this.damage * player.damageMultiplier),
                    speed: this.projectileSpeed,
                    direction: fireDir,
                    pierce: this.pierce,
                    size: this.size,
                    color: '#44ddff',
                    type: 'water',
                    knockback: this.knockback,
                    lifetime: 3
                }
            );

            game.projectiles.push(projectile);
        }
    }

    applyUpgrade() {
        switch (this.level) {
            case 2:
                this.damage = 17; // 13+4
                this.pierce = 3;
                break;
            case 3:
                this.projectileCount = 2;
                this.cooldown = 1.5;
                break;
            case 4:
                this.damage = 24; // 17+7
                this.size = 14;
                break;
            case 5:
                this.pierce = 5;
                this.cooldown = 1.2;
                break;
            case 6:
                this.projectileCount = 3;
                this.damage = 31; // 24+7
                break;
            case 7:
                this.size = 20;
                this.pierce = 8;
                break;
            case 8:
                this.damage = 44; // 31+13
                this.cooldown = 1.0; // 0.8 -> 1.0
                this.pierce = 15; // 99(無限) -> 15 (強力だが制限あり)
                break;
        }
    }

    getUpgradeDescription() {
        if (this.level >= this.maxLevel) return '最大レベル';

        const nextLevel = this.level + 1;
        switch (nextLevel) {
            case 2: return '威力+4, 貫通+1';
            case 3: return '発射数+1, CD-0.3秒';
            case 4: return '威力+6, サイズUP';
            case 5: return '貫通+2, CD-0.3秒';
            case 6: return '発射数+1, 威力+6';
            case 7: return 'サイズUP, 貫通+3';
            case 8: return '威力+12, CD-0.2秒, 貫通超UP';
            default: return '';
        }
    }
}
