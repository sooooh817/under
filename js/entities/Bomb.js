/**
 * ボムアイテム
 * 取得すると画面内の敵を全滅させる
 */
class Bomb extends Entity {
    constructor(x, y) {
        super(x, y);
        this.size = 15;
        this.bobOffset = 0;
        this.type = 'bomb';
    }

    update(deltaTime, playerPosition) {
        this.bobOffset += deltaTime * 5;

        // プレイヤーとの距離チェック（回収）
        const distance = this.position.distanceTo(playerPosition);
        if (distance < 30) {
            this.destroy();
            return true; // 回収された
        }
        return false;
    }

    draw(ctx) {
        ctx.save();
        const x = this.position.x;
        const y = this.position.y + Math.sin(this.bobOffset) * 5;

        ctx.translate(x, y);

        // ボム本体
        ctx.fillStyle = '#333333';
        ctx.beginPath();
        ctx.arc(0, 3, 12, 0, Math.PI * 2);
        ctx.fill();

        // 導火線口
        ctx.fillStyle = '#555555';
        ctx.fillRect(-3, -12, 6, 4);

        // 導火線
        ctx.strokeStyle = '#d2b48c';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, -12);
        ctx.quadraticCurveTo(5, -18, 8, -15);
        ctx.stroke();

        // 火花
        if (Math.floor(Date.now() / 100) % 2 === 0) {
            ctx.fillStyle = '#ffaa00';
            ctx.beginPath();
            ctx.arc(8, -15, 3, 0, Math.PI * 2);
            ctx.fill();
        }

        // ドクロマーク（オプション）
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('☠', 0, 4);

        ctx.restore();
    }
}
