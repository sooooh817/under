/**
 * でんきショック - スピード型初期スキル
 * 最も近い敵への自動追尾弾
 */
class ElectricShock extends Skill {
    constructor() {
        super({
            name: 'でんきショック',
            description: '最も近い敵を追尾する電撃弾（1秒痺れ）',
            icon: '⚡',
            color: '#ffcc00',
            damage: 8,  // 7->8
            cooldown: 1.0,
            pierce: 0,
            projectileCount: 1,
            projectileSpeed: 600
        });

        this.stunDuration = 0.2; // 1秒 -> 0.2秒 (ハメ防止)
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

        // 発射方向を決定
        let direction;
        if (nearestEnemy) {
            direction = nearestEnemy.position.subtract(player.position).normalized;
        } else {
            direction = player.facing.clone();
        }

        // 弾を発射
        const angleSpread = 0.2; // 複数弾の角度差
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
                    color: '#ffff00',
                    type: 'electric',
                    homing: true,
                    homingStrength: 3,
                    target: nearestEnemy,
                    knockback: this.knockback,
                    lifetime: 0.8, // 2s -> 0.8s (射程を短く)
                    stunDuration: this.stunDuration // スタン効果
                }
            );

            game.projectiles.push(projectile);
        }
    }

    applyUpgrade() {
        switch (this.level) {
            case 2:
                this.damage = 12; // 8+4
                this.cooldown = 0.9;
                break;
            case 3:
                this.projectileCount = 2;
                break;
            case 4:
                this.damage = 17; // 12+5
                this.cooldown = 0.75;
                break;
            case 5:
                this.projectileCount = 3; // 貫通削除、弾数3まで
                break;
            case 6:
                this.damage = 22; // 17+5
                this.cooldown = 0.5;
                break;
            case 7:
                this.cooldown = 0.4; // 弾数増加削除、CD短縮に変更
                break;
            case 8:
                // 威力調整（29->25）
                this.damage = 25;
                this.cooldown = 0.35;
                this.projectileSpeed = 700;
                break;
        }
    }

    getUpgradeDescription() {
        if (this.level >= this.maxLevel) return '最大レベル';

        const nextLevel = this.level + 1;
        switch (nextLevel) {
            case 2: return '威力+2, CD-0.1秒';
            case 3: return '発射数+1';
            case 4: return '威力+4, CD-0.15秒';
            case 5: return '発射数+1';
            case 6: return '威力+4, CD-0.25秒';
            case 7: return 'CD-0.1秒';
            case 8: return '威力+3, 弾速UP, CD-0.05秒';
            default: return '';
        }
    }
}
