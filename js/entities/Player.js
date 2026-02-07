/**
 * プレイヤークラス
 * キャラクター操作、ステータス、スキル管理
 */
class Player extends Entity {
    constructor(x, y, characterType = 'speed') {
        super(x, y);

        this.characterType = characterType;
        this.radius = 20;

        // タイプ別ステータス
        const stats = this.getBaseStats(characterType);
        this.maxHp = stats.maxHp;
        this.hp = this.maxHp;
        this.baseSpeed = stats.speed;
        this.speed = this.baseSpeed;
        this.color = stats.color;

        // 経験値・レベル
        this.exp = 0;
        this.level = 1;
        this.expToNextLevel = 10;

        // スキル
        this.skills = [];
        this.passiveSkills = [];

        // 初期スキルを追加
        this.addInitialSkill(characterType);

        // 向き（最後に移動した方向）
        this.facing = new Vector2(1, 0);

        // 無敵時間
        this.invincibleTime = 0;
        this.invincibleDuration = 0.5;

        // パッシブボーナス
        this.damageMultiplier = 1.0;
        this.cooldownMultiplier = 1.0;
        this.pickupRange = 50;

        // デバフ
        this.slowTimer = 0;
        this.isSlowed = false;
    }

    getBaseStats(type) {
        const stats = {
            speed: {
                maxHp: 100,
                speed: 220,
                color: '#ffcc00'
            },
            tank: {
                maxHp: 180,
                speed: 150,
                color: '#22aa88'
            },
            ranged: {
                maxHp: 120,
                speed: 180,
                color: '#44aadd'
            }
        };
        return stats[type] || stats.speed;
    }

    addInitialSkill(type) {
        switch (type) {
            case 'speed':
                this.skills.push(new ElectricShock());
                break;
            case 'tank':
                this.skills.push(new BodySlam());
                break;
            case 'ranged':
                this.skills.push(new WaterGun());
                break;
        }
    }

    update(deltaTime, inputManager, game) {
        // 無敵時間の更新
        if (this.invincibleTime > 0) {
            this.invincibleTime -= deltaTime;
        }

        // スロー状態の更新
        if (this.slowTimer > 0) {
            this.slowTimer -= deltaTime;
            this.isSlowed = true;
        } else {
            this.isSlowed = false;
        }

        // 移動速度計算
        let currentSpeed = this.speed;
        if (this.isSlowed) {
            currentSpeed *= 0.5; // 50%減速
        }

        // 移動
        const moveDir = inputManager.getMovementDirection();
        if (moveDir.magnitude > 0) {
            this.facing = moveDir.clone();
            this.position = this.position.add(moveDir.multiply(currentSpeed * deltaTime));
        }

        // 画面内に制限
        this.constrainToScreen(game.canvas.width, game.canvas.height);

        // スキルの更新と発動
        for (const skill of this.skills) {
            skill.update(deltaTime, this.cooldownMultiplier);
            if (skill.canFire()) {
                skill.fire(this, game);
            }
        }
    }

    applySlow(duration) {
        this.slowTimer = Math.max(this.slowTimer, duration);
    }

    constrainToScreen(width, height) {
        this.position.x = Math.max(this.radius, Math.min(width - this.radius, this.position.x));
        this.position.y = Math.max(this.radius, Math.min(height - this.radius, this.position.y));
    }

    draw(ctx) {
        ctx.save();

        // 無敵時間中は点滅
        if (this.invincibleTime > 0 && Math.floor(this.invincibleTime * 10) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }

        // スプライト名を取得
        const spriteName = `player_${this.characterType}`;
        const sprite = spriteManager.get(spriteName);

        if (sprite) {
            // スプライト画像を描画
            const spriteSize = this.radius * 2.5;

            ctx.save();
            ctx.translate(this.position.x, this.position.y);

            // 向きに応じて反転
            if (this.facing.x < 0) {
                ctx.scale(-1, 1);
            }

            ctx.drawImage(
                sprite,
                -spriteSize / 2,
                -spriteSize / 2,
                spriteSize,
                spriteSize
            );
            ctx.restore();
        } else {
            // プレースホルダー描画（フォールバック）
            // 本体（円）
            ctx.beginPath();
            ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);

            // グラデーション
            const gradient = ctx.createRadialGradient(
                this.position.x - 5, this.position.y - 5, 0,
                this.position.x, this.position.y, this.radius
            );
            gradient.addColorStop(0, this.lightenColor(this.color, 40));
            gradient.addColorStop(1, this.color);
            ctx.fillStyle = gradient;
            ctx.fill();

            // 輪郭
            ctx.strokeStyle = this.darkenColor(this.color, 30);
            ctx.lineWidth = 2;
            ctx.stroke();

            // 向きインジケーター（小さな突起）
            const indicatorLength = 8;
            const indicatorPos = this.position.add(this.facing.multiply(this.radius + indicatorLength / 2));
            ctx.beginPath();
            ctx.arc(indicatorPos.x, indicatorPos.y, 5, 0, Math.PI * 2);
            ctx.fillStyle = this.lightenColor(this.color, 60);
            ctx.fill();
        }

        ctx.restore();
    }

    takeDamage(amount) {
        if (this.invincibleTime > 0) return;

        this.hp -= amount;
        this.invincibleTime = this.invincibleDuration;

        if (this.hp <= 0) {
            this.hp = 0;
            this.destroy();
        }
    }

    addExp(amount) {
        this.exp += amount;

        // レベルアップチェック
        if (this.exp >= this.expToNextLevel) {
            this.exp -= this.expToNextLevel;
            this.level++;
            this.expToNextLevel = this.level * 10;
            return true; // レベルアップした
        }
        return false;
    }

    heal(amount) {
        this.hp = Math.min(this.maxHp, this.hp + amount);
    }

    addSkill(skill) {
        // 既存スキルの強化チェック
        const existing = this.skills.find(s => s.name === skill.name);
        if (existing) {
            existing.upgrade();
        } else {
            this.skills.push(skill);
        }
    }

    addPassive(passive) {
        const existing = this.passiveSkills.find(p => p.name === passive.name);
        if (existing) {
            existing.upgrade();
        } else {
            this.passiveSkills.push(passive);
        }
        this.applyPassives();
    }

    applyPassives() {
        // パッシブ効果をリセットして再適用
        this.damageMultiplier = 1.0;
        this.cooldownMultiplier = 1.0;
        this.speed = this.baseSpeed;
        this.pickupRange = 50;

        for (const passive of this.passiveSkills) {
            if (passive.name === 'こうそくいどう') {
                this.speed += this.baseSpeed * 0.15 * passive.level;
            } else if (passive.name === 'プラスパワー') {
                this.damageMultiplier += 0.1 * passive.level;
            } else if (passive.name === 'きあいのハチマキ') {
                // 最大HP増加（レベルアップ時に適用）
            } else if (passive.name === 'エフェクトガード') {
                this.cooldownMultiplier -= 0.08 * passive.level;
            }
        }

        this.cooldownMultiplier = Math.max(0.3, this.cooldownMultiplier);
    }

    // カラーユーティリティ
    lightenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.min(255, (num >> 16) + amt);
        const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
        const B = Math.min(255, (num & 0x0000FF) + amt);
        return `rgb(${R}, ${G}, ${B})`;
    }

    darkenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.max(0, (num >> 16) - amt);
        const G = Math.max(0, ((num >> 8) & 0x00FF) - amt);
        const B = Math.max(0, (num & 0x0000FF) - amt);
        return `rgb(${R}, ${G}, ${B})`;
    }
}
