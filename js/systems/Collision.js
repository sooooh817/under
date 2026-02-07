/**
 * 当たり判定システム
 */
class Collision {
    /**
     * 円と円の当たり判定
     */
    static circleToCircle(x1, y1, r1, x2, y2, r2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const dist = Math.sqrt(dx * dx + dy * dy);
        return dist < r1 + r2;
    }

    /**
     * 円と矩形（正方形敵）の当たり判定
     */
    static circleToRect(cx, cy, cr, rx, ry, rSize) {
        // 矩形の中心からの距離でざっくり判定
        const halfSize = rSize;
        const dx = Math.abs(cx - rx);
        const dy = Math.abs(cy - ry);

        if (dx > halfSize + cr) return false;
        if (dy > halfSize + cr) return false;

        if (dx <= halfSize) return true;
        if (dy <= halfSize) return true;

        const cornerDist = Math.pow(dx - halfSize, 2) + Math.pow(dy - halfSize, 2);
        return cornerDist <= cr * cr;
    }

    /**
     * 弾と敵の当たり判定
     */
    static projectileToEnemy(projectile, enemy) {
        if (enemy.shape === 'circle') {
            return this.circleToCircle(
                projectile.position.x, projectile.position.y, projectile.size,
                enemy.position.x, enemy.position.y, enemy.size
            );
        } else {
            return this.circleToRect(
                projectile.position.x, projectile.position.y, projectile.size,
                enemy.position.x, enemy.position.y, enemy.size
            );
        }
    }

    /**
     * プレイヤーと敵の当たり判定
     */
    static playerToEnemy(player, enemy) {
        if (enemy.shape === 'circle') {
            return this.circleToCircle(
                player.position.x, player.position.y, player.radius,
                enemy.position.x, enemy.position.y, enemy.size
            );
        } else {
            return this.circleToRect(
                player.position.x, player.position.y, player.radius,
                enemy.position.x, enemy.position.y, enemy.size
            );
        }
    }
}
