/**
 * 敵の弾クラス
 * 遠距離攻撃敵から発射される弾
 */
class EnemyProjectile extends Entity {
    constructor(x, y, options = {}) {
        super(x, y);

        this.damage = options.damage || 10;
        this.speed = options.speed || 200;
        this.direction = options.direction || new Vector2(1, 0);
        this.size = options.size || 8;
        this.color = options.color || '#cc44ff';
        this.lifetime = options.lifetime || 5;

        // トレイル効果
        this.trail = [];
        this.maxTrailLength = 4;
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

        // 移動
        this.position = this.position.add(this.direction.multiply(this.speed * deltaTime));

        // 画面外チェック
        if (this.position.x < -50 || this.position.x > game.canvas.width + 50 ||
            this.position.y < -50 || this.position.y > game.canvas.height + 50) {
            this.destroy();
        }
    }

    draw(ctx) {
        ctx.save();

        // トレイル描画
        for (let i = 0; i < this.trail.length; i++) {
            const alpha = 1 - (i / this.trail.length);
            const trailSize = this.size * (1 - i / this.trail.length * 0.5);

            ctx.globalAlpha = alpha * 0.4;
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.trail[i].x, this.trail[i].y, trailSize, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.globalAlpha = 1;

        // グロー効果
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10;

        // 外側の円
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.size, 0, Math.PI * 2);
        ctx.fill();

        // 内側の白い部分
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.size * 0.4, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}
