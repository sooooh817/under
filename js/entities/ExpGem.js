/**
 * 経験値ジェムクラス
 * 敵を倒すとドロップし、プレイヤーに吸い寄せられる
 */
class ExpGem extends Entity {
    constructor(x, y, value = 1) {
        super(x, y);

        this.value = value;
        this.size = value > 3 ? 8 : 5;
        this.color = value > 3 ? '#ffd700' : '#44ddff';

        // 吸い寄せ
        this.attractSpeed = 400;
        this.isAttracted = false;

        // アニメーション
        this.bobOffset = Math.random() * Math.PI * 2;
        this.sparkleTime = 0;
    }

    update(deltaTime, playerPosition, pickupRange) {
        // 上下に浮遊するアニメーション
        this.bobOffset += deltaTime * 3;

        // キラキラエフェクト
        this.sparkleTime += deltaTime;

        // プレイヤーとの距離をチェック
        const distance = this.position.distanceTo(playerPosition);

        if (distance < pickupRange) {
            this.isAttracted = true;
        }

        // 吸い寄せ中はプレイヤーに向かって移動
        if (this.isAttracted) {
            const direction = playerPosition.subtract(this.position).normalized;
            this.position = this.position.add(direction.multiply(this.attractSpeed * deltaTime));

            // 回収判定
            if (distance < 15) {
                this.destroy();
                return this.value; // 獲得EXP
            }
        }

        return 0;
    }

    draw(ctx) {
        ctx.save();

        const x = this.position.x;
        const y = this.position.y + Math.sin(this.bobOffset) * 3;
        const s = this.size;

        // グロー効果
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10;

        // ダイヤモンド形
        ctx.beginPath();
        ctx.moveTo(x, y - s);
        ctx.lineTo(x + s, y);
        ctx.lineTo(x, y + s);
        ctx.lineTo(x - s, y);
        ctx.closePath();

        // グラデーション
        const gradient = ctx.createLinearGradient(x - s, y - s, x + s, y + s);
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(0.5, this.color);
        gradient.addColorStop(1, this.darkenColor(this.color, 30));

        ctx.fillStyle = gradient;
        ctx.fill();

        // キラキラエフェクト
        if (Math.sin(this.sparkleTime * 5) > 0.7) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.beginPath();
            ctx.arc(x + s / 2, y - s / 2, 2, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
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
