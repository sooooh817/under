/**
 * 弾（プロジェクタイル）クラス
 * スキルから発射される攻撃用オブジェクト
 */
class Projectile extends Entity {
    constructor(x, y, options = {}) {
        super(x, y);

        this.damage = options.damage || 10;
        this.speed = options.speed || 300;
        this.direction = options.direction || new Vector2(1, 0);
        this.pierce = options.pierce || 0;
        this.size = options.size || 8;
        this.color = options.color || '#ffff00';
        this.type = options.type || 'bullet';
        this.lifetime = options.lifetime || 3;

        // 追尾用
        this.homing = options.homing || false;
        this.homingStrength = options.homingStrength || 5;
        this.target = options.target || null;

        // ブーメラン用
        this.isReturning = options.isReturning || false;
        this.maxDistance = options.maxDistance || 200;
        this.startPosition = new Vector2(x, y);
        this.owner = options.owner || null;

        // ノックバック
        this.knockback = options.knockback || 100;

        // スタン効果
        this.stunDuration = options.stunDuration || 0;

        // ヒットした敵を記録（貫通用）
        this.hitEnemies = new Set();

        // トレイル効果
        this.trail = [];
        this.maxTrailLength = 5;
    }

    update(deltaTime, game) {
        // ライフタイム減少
        this.lifetime -= deltaTime;
        if (this.lifetime <= 0) {
            this.destroy();
            return;
        }

        // トレイル更新
        this.trail.unshift(this.position.clone());
        if (this.trail.length > this.maxTrailLength) {
            this.trail.pop();
        }

        // 追尾処理
        if (this.homing && this.target && this.target.active) {
            const toTarget = this.target.position.subtract(this.position).normalized;
            this.direction = this.direction.add(toTarget.multiply(this.homingStrength * deltaTime)).normalized;
        }

        // ブーメラン処理
        if (this.type === 'boomerang') {
            const distFromStart = this.position.distanceTo(this.startPosition);

            if (!this.isReturning && distFromStart >= this.maxDistance) {
                this.isReturning = true;
                this.hitEnemies.clear(); // 戻り時に再ヒット可能
            }

            if (this.isReturning && this.owner) {
                this.direction = this.owner.position.subtract(this.position).normalized;

                // プレイヤーに戻ったら消滅
                if (this.position.distanceTo(this.owner.position) < 30) {
                    this.destroy();
                    return;
                }
            }
        }

        // 移動
        this.position = this.position.add(this.direction.multiply(this.speed * deltaTime));

        // 画面外チェック（ブーメラン以外）
        if (this.type !== 'boomerang') {
            if (this.position.x < -50 || this.position.x > game.canvas.width + 50 ||
                this.position.y < -50 || this.position.y > game.canvas.height + 50) {
                this.destroy();
            }
        }
    }

    draw(ctx) {
        ctx.save();

        // トレイル描画
        for (let i = 0; i < this.trail.length; i++) {
            const alpha = 1 - (i / this.trail.length);
            const trailSize = this.size * (1 - i / this.trail.length * 0.5);

            ctx.globalAlpha = alpha * 0.5;
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.trail[i].x, this.trail[i].y, trailSize, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.globalAlpha = 1;

        switch (this.type) {
            case 'electric':
                this.drawElectric(ctx);
                break;
            case 'water':
                this.drawWater(ctx);
                break;
            case 'boomerang':
                this.drawBoomerang(ctx);
                break;
            case 'shockwave':
                this.drawShockwave(ctx);
                break;
            default:
                this.drawDefault(ctx);
        }

        ctx.restore();
    }

    drawElectric(ctx) {
        const x = this.position.x;
        const y = this.position.y;

        // グロー
        ctx.shadowColor = '#ffff00';
        ctx.shadowBlur = 15;

        // 稲妻形状
        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.arc(x, y, this.size, 0, Math.PI * 2);
        ctx.fill();

        // 内側の白
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x, y, this.size * 0.5, 0, Math.PI * 2);
        ctx.fill();
    }

    drawWater(ctx) {
        const x = this.position.x;
        const y = this.position.y;

        ctx.shadowColor = '#44aaff';
        ctx.shadowBlur = 10;

        // 水滴形状
        const angle = this.direction.angle;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);

        ctx.fillStyle = '#44ddff';
        ctx.beginPath();
        ctx.ellipse(0, 0, this.size * 1.5, this.size, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.beginPath();
        ctx.ellipse(-this.size * 0.5, -this.size * 0.3, this.size * 0.3, this.size * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    drawBoomerang(ctx) {
        const x = this.position.x;
        const y = this.position.y;

        ctx.shadowColor = '#44ff44';
        ctx.shadowBlur = 10;

        // 回転
        const rotation = Date.now() / 50;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotation);

        // 葉っぱ形状
        ctx.fillStyle = '#66ff66';
        ctx.beginPath();
        ctx.ellipse(0, 0, this.size * 1.5, this.size * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#338833';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.restore();
    }

    drawShockwave(ctx) {
        // 衝撃波（のしかかり用）- 別途処理
    }

    drawDefault(ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }

    onHit(enemy) {
        if (this.hitEnemies.has(enemy)) {
            return false; // 既にヒット済み
        }

        this.hitEnemies.add(enemy);

        // アサシン等の貫通ブロック能力をチェック
        if (enemy.blocksPierce) {
            this.pierce = 0;
        }

        // 貫通チェック
        if (this.pierce <= 0) {
            this.destroy();
        } else {
            this.pierce--;
        }

        return true;
    }
}
