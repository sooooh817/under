/**
 * 蜘蛛の巣
 * 敵（スパイダー）が設置する罠
 * プレイヤーが触れるとダメージ＋移動速度低下
 */
class SpiderWeb extends Entity {
    constructor(x, y) {
        super(x, y);
        this.size = 20;
        this.color = '#eeeeee';
        this.duration = 3; // 10秒 -> 3秒
        this.time = 0;
        this.damage = 5;
        this.slowDuration = 3.0; // 3秒間スロー
    }

    update(deltaTime, player) {
        this.time += deltaTime;

        // 寿命チェック
        if (this.time >= this.duration) {
            this.destroy();
            return;
        }

        // プレイヤーとの当たり判定
        if (player && player.active) {
            const dist = this.position.distanceTo(player.position);
            // プレイヤーが踏んだら（少し甘めの判定）
            if (dist < this.size + player.radius * 0.5) {
                this.onStep(player);
            }
        }
    }

    onStep(player) {
        // ダメージを与える（クールダウン管理は簡易的に）
        // 罠なので踏んだ瞬間発動し、消えるか、継続するか。
        // ここでは「踏んだら自分は消える」使い捨てタイプにする（シンプルかつ処理が楽）
        // もし継続タイプなら Player 側に debuffTimer を持たせる必要がある。

        player.takeDamage(this.damage);
        player.applySlow(this.slowDuration);

        // 音
        if (window.soundManager) soundManager.playSE('se_hit'); // 仮音

        // 巣は消滅
        this.destroy();
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.position.x, this.position.y);

        const alpha = 1 - (this.time / this.duration);
        ctx.globalAlpha = Math.max(0, alpha);

        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;

        // 蜘蛛の巣っぽい描画（放射状の線と、同心円っぽい線）
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 / 8) * i;
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(angle) * this.size, Math.sin(angle) * this.size);
        }
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(0, 0, this.size * 0.5, 0, Math.PI * 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();
    }
}
