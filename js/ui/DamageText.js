/**
 * ダメージテキストクラス
 * 敵にダメージを与えた際に数値を表示する
 */
class DamageText {
    constructor(x, y, damage, isCritical = false) {
        this.x = x;
        this.y = y;
        this.damage = Math.floor(damage);
        this.isCritical = isCritical;

        this.lifeTime = 1.0; // 表示時間（秒）
        this.time = 0;

        // 上昇速度
        this.velocityY = -30;

        // 横揺れ用
        this.randomOffset = (Math.random() - 0.5) * 20;
    }

    update(deltaTime) {
        this.time += deltaTime;

        // 上に移動
        this.y += this.velocityY * deltaTime;

        // 速度減衰（ふわっと止まる感じ）
        this.velocityY += 50 * deltaTime;
    }

    draw(ctx) {
        const alpha = Math.max(0, 1 - (this.time / this.lifeTime));
        const scale = 1 + (this.isCritical ? 0.5 : 0) - (this.time * 0.5); // 最初大きく、だんだん小さく

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(this.x + this.randomOffset * (this.time * 2), this.y);
        ctx.scale(Math.max(0, scale), Math.max(0, scale));

        ctx.font = this.isCritical ? 'bold 24px Arial' : 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // 縁取り
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.strokeText(this.damage, 0, 0);

        // 文字色
        ctx.fillStyle = this.isCritical ? '#ff0000' : '#ffffff';
        ctx.fillText(this.damage, 0, 0);

        ctx.restore();
    }
}
