/**
 * マグネットアイテム
 * 取得すると画面内の全経験値を回収する
 */
class Magnet extends Entity {
    constructor(x, y) {
        super(x, y);
        this.size = 15;
        this.bobOffset = 0;
        this.type = 'magnet';
    }

    update(deltaTime, playerPosition) {
        this.bobOffset += deltaTime * 5;

        // プレイヤーとの距離チェック（回収）
        const distance = this.position.distanceTo(playerPosition);
        if (distance < 30) { // プレイヤーの半径 + マグネットのサイズ
            this.destroy();
            return true; // 回収された
        }
        return false;
    }

    draw(ctx) {
        ctx.save();
        const x = this.position.x;
        const y = this.position.y + Math.sin(this.bobOffset) * 5;

        // U字磁石の描画
        ctx.translate(x, y);

        // 赤い部分 (N極)
        ctx.fillStyle = '#ff4444';
        ctx.beginPath();
        ctx.arc(0, -5, 10, Math.PI, 0);
        ctx.lineTo(10, 5);
        ctx.lineTo(5, 5);
        ctx.lineTo(5, -5);
        ctx.arc(0, -5, 5, 0, Math.PI, true);
        ctx.lineTo(-5, 5);
        ctx.lineTo(-10, 5);
        ctx.closePath();
        ctx.fill();

        // 青い部分 (S極) - 下半分
        ctx.fillStyle = '#4444ff';
        ctx.fillRect(-10, 5, 5, 5);
        ctx.fillRect(5, 5, 5, 5);

        // グロー
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 10;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.restore();
    }
}
