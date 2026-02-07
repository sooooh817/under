/**
 * HUD（ヘッドアップディスプレイ）
 * 画面上のステータス表示を管理
 */
class HUD {
    constructor(canvas) {
        this.canvas = canvas;
        this.padding = 15;
    }

    draw(ctx, player, gameTime, killCount, score) {
        ctx.save();
        ctx.font = '12px "Press Start 2P", monospace';

        // 左上: HP と EXP バー
        this.drawHealthBar(ctx, player);
        this.drawExpBar(ctx, player);
        this.drawLevel(ctx, player);

        // 上部中央: 経過時間
        this.drawTime(ctx, gameTime);

        // 右上: スコアと撃破数
        this.drawScore(ctx, score);
        this.drawKillCount(ctx, killCount);

        // 左下: スキルアイコン
        this.drawSkillIcons(ctx, player);

        ctx.restore();
    }

    drawScore(ctx, score) {
        const x = this.canvas.width - this.padding;
        const y = this.padding + 28;

        ctx.fillStyle = '#ffcc00';
        ctx.font = '14px "Press Start 2P", monospace';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = '#ff8800';
        ctx.shadowBlur = 3;
        ctx.fillText(`${score}`, x, y);
        ctx.shadowBlur = 0;
    }

    drawHealthBar(ctx, player) {
        const x = this.padding;
        const y = this.padding;
        const width = 200;
        const height = 20;

        // 背景
        ctx.fillStyle = '#333333';
        ctx.fillRect(x, y, width, height);

        // HP
        const hpPercent = player.hp / player.maxHp;
        const hpColor = hpPercent > 0.5 ? '#44ff44' : hpPercent > 0.25 ? '#ffaa00' : '#ff4444';
        ctx.fillStyle = hpColor;
        ctx.fillRect(x, y, width * hpPercent, height);

        // 枠
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);

        // テキスト
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${Math.ceil(player.hp)}/${player.maxHp}`, x + width / 2, y + height / 2);
    }

    drawExpBar(ctx, player) {
        const x = this.padding;
        const y = this.padding + 28;
        const width = 200;
        const height = 12;

        // 背景
        ctx.fillStyle = '#222255';
        ctx.fillRect(x, y, width, height);

        // EXP
        const expPercent = player.exp / player.expToNextLevel;
        const gradient = ctx.createLinearGradient(x, y, x + width, y);
        gradient.addColorStop(0, '#4488ff');
        gradient.addColorStop(1, '#88ccff');
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, width * expPercent, height);

        // 枠
        ctx.strokeStyle = '#6688aa';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, width, height);
    }

    drawLevel(ctx, player) {
        const x = this.padding + 210;
        const y = this.padding + 20;

        ctx.fillStyle = '#ffd700';
        ctx.font = '14px "Press Start 2P", monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = '#ff8800';
        ctx.shadowBlur = 5;
        ctx.fillText(`Lv.${player.level}`, x, y);
        ctx.shadowBlur = 0;
    }

    drawTime(ctx, gameTime) {
        const x = this.canvas.width / 2;
        const y = this.padding + 10;

        const minutes = Math.floor(gameTime / 60);
        const seconds = Math.floor(gameTime % 60);
        const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        ctx.fillStyle = '#ffffff';
        ctx.font = '16px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(timeStr, x, y);
    }

    drawKillCount(ctx, killCount) {
        const x = this.canvas.width - this.padding;
        const y = this.padding + 10;

        ctx.fillStyle = '#ff6666';
        ctx.font = '12px "Press Start 2P", monospace';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(`KO: ${killCount}`, x, y);
    }

    drawSkillIcons(ctx, player) {
        const iconSize = 40;
        const spacing = 8;
        const x = this.padding;
        const y = this.canvas.height - this.padding - iconSize;

        let offsetX = 0;

        for (const skill of player.skills) {
            // アイコン背景
            ctx.fillStyle = 'rgba(20, 20, 40, 0.8)';
            ctx.fillRect(x + offsetX, y, iconSize, iconSize);

            // スキルの色
            ctx.fillStyle = skill.color;
            ctx.fillRect(x + offsetX + 3, y + 3, iconSize - 6, iconSize - 6);

            // レベル表示
            ctx.fillStyle = '#ffffff';
            ctx.font = '8px "Press Start 2P", monospace';
            ctx.textAlign = 'right';
            ctx.textBaseline = 'bottom';
            ctx.fillText(skill.level.toString(), x + offsetX + iconSize - 4, y + iconSize - 2);

            // 枠
            ctx.strokeStyle = '#666666';
            ctx.lineWidth = 1;
            ctx.strokeRect(x + offsetX, y, iconSize, iconSize);

            offsetX += iconSize + spacing;
        }

        // パッシブスキルも表示
        for (const passive of player.passiveSkills) {
            ctx.fillStyle = 'rgba(20, 40, 20, 0.8)';
            ctx.fillRect(x + offsetX, y, iconSize, iconSize);

            ctx.fillStyle = passive.color;
            ctx.fillRect(x + offsetX + 3, y + 3, iconSize - 6, iconSize - 6);

            ctx.fillStyle = '#ffffff';
            ctx.font = '8px "Press Start 2P", monospace';
            ctx.textAlign = 'right';
            ctx.textBaseline = 'bottom';
            ctx.fillText(passive.level.toString(), x + offsetX + iconSize - 4, y + iconSize - 2);

            ctx.strokeStyle = '#446644';
            ctx.lineWidth = 1;
            ctx.strokeRect(x + offsetX, y, iconSize, iconSize);

            offsetX += iconSize + spacing;
        }
    }
}
