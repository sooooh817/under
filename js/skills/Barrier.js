/**
 * まもる（バリア） - 追加スキル
 * プレイヤーの周囲を回転する光の玉
 */
class Barrier extends Skill {
    constructor() {
        super({
            name: 'まもる',
            description: 'プレイヤーの周りを回転するバリア',
            icon: '🛡️',
            color: '#aaddff',
            damage: 5,
            cooldown: 0 // 常時発動
        });

        this.orbCount = 1;
        this.orbitRadius = 60;
        this.rotationSpeed = 2;
        this.orbSize = 10;
        this.knockback = 80;

        // 各オーブのヒット状態
        this.orbHitTimers = [];
        this.hitCooldown = 0.3;
    }

    update(deltaTime, cooldownMultiplier) {
        // バリアはクールダウンなし
        // ヒットタイマーの更新
        for (let i = 0; i < this.orbHitTimers.length; i++) {
            if (this.orbHitTimers[i] > 0) {
                this.orbHitTimers[i] -= deltaTime;
            }
        }
    }

    canFire() {
        return false; // fireは使わない、代わりにupdateOrbsを使う
    }

    /**
     * オーブの位置を取得
     */
    getOrbPositions(player, time) {
        const positions = [];
        for (let i = 0; i < this.orbCount; i++) {
            const angle = time * this.rotationSpeed + (i * Math.PI * 2 / this.orbCount);
            const x = player.position.x + Math.cos(angle) * this.orbitRadius;
            const y = player.position.y + Math.sin(angle) * this.orbitRadius;
            positions.push({ x, y, index: i });
        }
        return positions;
    }

    /**
     * オーブと敵の当たり判定
     */
    checkCollisions(player, game, time) {
        // オーブ数が変わった場合にタイマー配列を調整
        while (this.orbHitTimers.length < this.orbCount) {
            this.orbHitTimers.push(0);
        }

        const positions = this.getOrbPositions(player, time);

        for (const pos of positions) {
            if (this.orbHitTimers[pos.index] > 0) continue;

            for (const enemy of game.enemies) {
                if (!enemy.active) continue;

                const dist = Math.sqrt(
                    Math.pow(pos.x - enemy.position.x, 2) +
                    Math.pow(pos.y - enemy.position.y, 2)
                );

                if (dist <= this.orbSize + enemy.size) {
                    const knockbackDir = new Vector2(
                        enemy.position.x - pos.x,
                        enemy.position.y - pos.y
                    ).normalized;

                    const damage = Math.floor(this.damage * player.damageMultiplier);
                    const killed = enemy.takeDamage(damage, knockbackDir, this.knockback);

                    game.showDamage(enemy.position.x, enemy.position.y, damage, false);

                    if (killed) {
                        game.onEnemyKilled(enemy);
                    }

                    this.orbHitTimers[pos.index] = this.hitCooldown;
                    break;
                }
            }
        }
    }

    /**
     * オーブを描画
     */
    drawOrbs(ctx, player, time) {
        const positions = this.getOrbPositions(player, time);

        ctx.save();

        for (const pos of positions) {
            // グロー効果
            ctx.shadowColor = '#88ddff';
            ctx.shadowBlur = 15;

            // オーブ本体
            const gradient = ctx.createRadialGradient(
                pos.x - 2, pos.y - 2, 0,
                pos.x, pos.y, this.orbSize
            );
            gradient.addColorStop(0, '#ffffff');
            gradient.addColorStop(0.5, '#aaddff');
            gradient.addColorStop(1, '#6699cc');

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, this.orbSize, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    applyUpgrade() {
        switch (this.level) {
            case 2:
                this.damage = 9; // 5+4
                this.orbSize = 12;
                break;
            case 3:
                this.orbCount = 2;
                break;
            case 4:
                this.damage = 14; // 9+5
                this.rotationSpeed = 2.5;
                break;
            case 5:
                this.orbCount = 3;
                this.orbitRadius = 70;
                break;
            case 6:
                this.damage = 21; // 14+7
                this.orbSize = 15;
                break;
            case 7:
                this.orbCount = 4;
                this.knockback = 120;
                break;
            case 8:
                this.damage = 29; // 21+8
                this.orbCount = 5;
                this.rotationSpeed = 3;
                break;
        }
    }

    getUpgradeDescription() {
        if (this.level >= this.maxLevel) return '最大レベル';

        const nextLevel = this.level + 1;
        switch (nextLevel) {
            case 2: return '威力+3, サイズUP';
            case 3: return 'オーブ+1';
            case 4: return '威力+4, 回転速度UP';
            case 5: return 'オーブ+1, 軌道半径UP';
            case 6: return '威力+6, サイズUP';
            case 7: return 'オーブ+1, ノックバック強化';
            case 8: return '威力+7, オーブ+1, 回転速度UP';
            default: return '';
        }
    }
}
