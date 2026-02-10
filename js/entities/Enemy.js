/**
 * 敵クラス
 * 画面外からスポーンし、プレイヤーに向かって移動
 */
class Enemy extends Entity {
    constructor(x, y, type = 'normal') {
        super(x, y);

        this.type = type;
        const stats = this.getStats(type);

        this.hp = stats.hp;
        this.maxHp = stats.hp;
        this.speed = stats.speed;
        this.damage = stats.damage;
        this.expValue = stats.expValue;
        this.scoreValue = stats.scoreValue || 10;
        this.size = stats.size;
        this.color = stats.color;
        this.shape = stats.shape;

        // ノックバック
        this.knockbackVelocity = new Vector2(0, 0);
        this.knockbackDecay = 5;

        // ダメージフラッシュ
        this.flashTime = 0;

        // 遠距離攻撃用
        this.shootTimer = 0;
        this.shootInterval = stats.shootInterval || 0;
        this.shootRange = stats.shootRange || 0;
        this.projectileDamage = stats.projectileDamage || 0;

        // スタン（痺れ）状態
        this.stunTime = 0;

        // スパイダー用
        this.distanceTraveled = 0;
        this.webDropThreshold = 200; // 5体分 (約40px * 5)

        // ボスフラグ
        this.isBoss = stats.isBoss || false;

        // 貫通弾を止める能力
        this.blocksPierce = stats.blocksPierce || false;
    }

    getStats(type) {
        const stats = {
            normal: {
                hp: 8,
                speed: 50,
                damage: 5,
                expValue: 1,
                scoreValue: 10,
                size: 15,
                color: '#aa55cc',
                shape: 'square'
            },
            fast: {
                hp: 8,
                speed: 80,
                damage: 3,
                expValue: 1,
                scoreValue: 15,
                size: 12,
                color: '#5555ff',
                shape: 'triangle'
            },
            assassin: {
                hp: 5,
                speed: 80, // fastと同じ速度
                damage: 8,
                expValue: 2,
                scoreValue: 25,
                size: 10,
                color: '#ff00ff',
                shape: 'triangle',
                blocksPierce: true // 貫通弾を止める
            },
            tank: {
                hp: 40,
                speed: 30,
                damage: 15,
                expValue: 5,
                scoreValue: 50,
                size: 25,
                color: '#888888',
                shape: 'square'
            },
            boss: {
                hp: 160,
                speed: 25,
                damage: 25,
                expValue: 50,
                scoreValue: 500,
                size: 45,
                color: '#cc3333',
                shape: 'circle',
                shootInterval: 0.4,
                shootRange: 400,
                projectileDamage: 12,
                bulletCount: 13,
                isBoss: true
            },
            final_boss: {
                hp: 400,
                speed: 30,
                damage: 30,
                expValue: 100,
                scoreValue: 2000,
                size: 55,
                color: '#ffdd44',
                shape: 'circle',
                shootInterval: 0.3,
                shootRange: 500,
                projectileDamage: 15,
                bulletCount: 16,
                isBoss: true
            },
            ranged: {
                hp: 13,
                speed: 35,
                damage: 5,
                expValue: 3,
                scoreValue: 30,
                size: 16,
                color: '#cc44ff',
                shape: 'diamond',
                shootInterval: 2.0,
                shootRange: 250,
                projectileDamage: 8
            },
            spider: {
                hp: 13,
                speed: 40,
                damage: 8,
                expValue: 4,
                scoreValue: 25,
                size: 18,
                color: '#666699',
                shape: 'pentagon',
                shootInterval: 0,
                shootRange: 9999,
                projectileDamage: 4,
                bulletCount: 3,
                shootDistance: 100
            },
            bomber: {
                hp: 70,
                speed: 35,
                damage: 10,
                expValue: 8,
                scoreValue: 40,
                size: 20,
                color: '#ff6600',
                shape: 'circle',
                shootInterval: 0, // 距離ベースで発射
                shootRange: 9999, // 常に発射可能
                projectileDamage: 6,
                bulletCount: 8, // 8方向に発射
                shootDistance: 75 // キャラ5体分(15*5)移動ごとに発射
            }
        };
        return stats[type] || stats.normal;
    }

    update(deltaTime, playerPosition, game) {
        // スタン時間の更新
        if (this.stunTime > 0) {
            this.stunTime -= deltaTime;
            // フラッシュタイマー更新（スタン中も継続）
            if (this.flashTime > 0) {
                this.flashTime -= deltaTime;
            }
            return; // スタン中は移動・攻撃しない
        }

        // ノックバック処理
        if (this.knockbackVelocity.magnitude > 0) {
            this.position = this.position.add(this.knockbackVelocity.multiply(deltaTime));
            this.knockbackVelocity = this.knockbackVelocity.multiply(1 - this.knockbackDecay * deltaTime);
            if (this.knockbackVelocity.magnitude < 1) {
                this.knockbackVelocity = Vector2.zero;
            }
        }

        const distanceToPlayer = this.position.distanceTo(playerPosition);
        const direction = playerPosition.subtract(this.position).normalized;

        // ボスの場合：常に移動しながら弾幕攻撃
        if (this.type === 'boss') {
            // 移動
            this.position = this.position.add(direction.multiply(this.speed * deltaTime));

            // 射程内で弾幕攻撃
            if (distanceToPlayer <= this.shootRange) {
                this.shootTimer += deltaTime;
                if (this.shootTimer >= this.shootInterval) {
                    this.shootTimer = 0;
                    this.shootBarrage(direction, game);
                }
            }
        }
        // 遠距離敵の場合：射程内では止まって射撃
        else if (this.type === 'ranged' && distanceToPlayer <= this.shootRange) {
            this.shootTimer += deltaTime;
            if (this.shootTimer >= this.shootInterval) {
                this.shootTimer = 0;
                this.shoot(direction, game);
            }
        } else if (this.type === 'fast') {
            // 素早い敵：プレイヤーに接近したら自爆
            this.position = this.position.add(direction.multiply(this.speed * deltaTime));

            // 自爆判定 (物理接触＋αで確実に発動させる)
            // プレイヤーの半径(約20) + 自分の半径(12) + 余白(10) => 約42
            const triggerDist = this.size + (game.player ? game.player.radius : 20) + 10;
            if (distanceToPlayer < triggerDist) {
                // 自爆
                this.explode(game);
                return;
            }
        } else if (this.type === 'spider') {
            // ミニボマー：移動距離に応じてランダム方向に3発弾を発射
            const moveAmount = this.speed * deltaTime;
            this.position = this.position.add(direction.multiply(moveAmount));

            this.distanceTraveled += moveAmount;
            const shootDist = this.getStats(this.type).shootDistance || 100;
            if (this.distanceTraveled >= shootDist) {
                this.distanceTraveled = 0;
                this.shootRandomDirections(game);
            }
        } else if (this.type === 'bomber') {
            // ボマー：移動距離に応じて全方向に弾幕発射
            const moveAmount = this.speed * deltaTime;
            this.position = this.position.add(direction.multiply(moveAmount));

            this.distanceTraveled += moveAmount;
            const shootDist = this.getStats(this.type).shootDistance || 75;
            if (this.distanceTraveled >= shootDist) {
                this.distanceTraveled = 0;
                this.shootAllDirections(game);
            }
        } else {
            // プレイヤーに向かって移動
            this.position = this.position.add(direction.multiply(this.speed * deltaTime));
        }

        // フラッシュタイマー更新
        if (this.flashTime > 0) {
            this.flashTime -= deltaTime;
        }
    }

    shoot(direction, game) {
        if (!game || !game.enemyProjectiles) return;

        const projectile = new EnemyProjectile(this.position.x, this.position.y, {
            damage: this.projectileDamage,
            speed: 180,
            direction: direction,
            size: 7,
            color: '#cc44ff'
        });

        game.enemyProjectiles.push(projectile);
    }

    shootBarrage(direction, game) {
        if (!game || !game.enemyProjectiles) return;

        // 弾幕パターンをランダムに選択
        const pattern = Math.floor(Math.random() * 3);

        switch (pattern) {
            case 0:
                // 放射状弾幕 - 全方向に16発
                this.shootRadial(game, 16);
                break;
            case 1:
                // 渦巻き弾幕 - 螺旋状に24発
                this.shootSpiral(game, 24);
                break;
            case 2:
                // 狙い撃ち弾幕 - プレイヤー方向に5発扇状
                this.shootSpread(direction, game, 5);
                break;
        }
    }

    // 放射状弾幕
    shootRadial(game, count) {
        const angleStep = (Math.PI * 2) / count;
        const baseAngle = Math.random() * Math.PI * 2; // ランダムな開始角度

        for (let i = 0; i < count; i++) {
            const angle = baseAngle + angleStep * i;
            const dir = new Vector2(Math.cos(angle), Math.sin(angle));

            const projectile = new EnemyProjectile(this.position.x, this.position.y, {
                damage: this.projectileDamage,
                speed: 150,
                direction: dir,
                size: 8,
                color: '#ff3333',
                lifetime: 6
            });

            game.enemyProjectiles.push(projectile);
        }
    }

    // 渦巻き弾幕
    shootSpiral(game, count) {
        const spiralOffset = this.spiralAngle || 0;
        this.spiralAngle = (spiralOffset + 0.3) % (Math.PI * 2);

        const angleStep = (Math.PI * 2) / 6; // 8方向 -> 6方向

        for (let i = 0; i < 6; i++) {
            const angle = spiralOffset + angleStep * i;
            const dir = new Vector2(Math.cos(angle), Math.sin(angle));

            const projectile = new EnemyProjectile(this.position.x, this.position.y, {
                damage: this.projectileDamage,
                speed: 120,
                direction: dir,
                size: 6,
                color: '#ffaa00',
                lifetime: 7
            });

            game.enemyProjectiles.push(projectile);
        }
    }

    // 扇状弾幕（プレイヤー狙い）
    shootSpread(direction, game, count) {
        const spreadAngle = Math.PI / 3; // 60度の範囲
        const baseAngle = Math.atan2(direction.y, direction.x);
        const startAngle = baseAngle - spreadAngle / 2;
        const angleStep = spreadAngle / (count - 1);

        for (let i = 0; i < count; i++) {
            const angle = startAngle + angleStep * i;
            const dir = new Vector2(Math.cos(angle), Math.sin(angle));

            const projectile = new EnemyProjectile(this.position.x, this.position.y, {
                damage: this.projectileDamage * 1.2,
                speed: 200,
                direction: dir,
                size: 10,
                color: '#ff00ff',
                lifetime: 5
            });

            game.enemyProjectiles.push(projectile);
        }
    }

    // ミニボマー(spider)用：ランダム方向に弾を発射
    shootRandomDirections(game) {
        if (!game || !game.enemyProjectiles) return;

        const stats = this.getStats(this.type);
        const bulletCount = stats.bulletCount || 3;

        for (let i = 0; i < bulletCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dir = new Vector2(Math.cos(angle), Math.sin(angle));

            const projectile = new EnemyProjectile(this.position.x, this.position.y, {
                damage: this.projectileDamage,
                speed: 120,
                direction: dir,
                size: 5,
                color: '#666699',
                lifetime: 4
            });

            game.enemyProjectiles.push(projectile);
        }
    }

    // ボマー用：全方向に弾を発射
    shootAllDirections(game) {
        if (!game || !game.enemyProjectiles) return;

        const stats = this.getStats(this.type);
        const bulletCount = stats.bulletCount || 8;

        for (let i = 0; i < bulletCount; i++) {
            const angle = (i / bulletCount) * Math.PI * 2;
            const dir = new Vector2(Math.cos(angle), Math.sin(angle));

            const projectile = new EnemyProjectile(this.position.x, this.position.y, {
                damage: this.projectileDamage,
                speed: 120,
                direction: dir,
                size: 6,
                color: '#ff6600',
                lifetime: 4
            });

            game.enemyProjectiles.push(projectile);
        }
    }

    explode(game) {
        if (!game || !game.player) return;

        // 爆発エフェクトの代わりに範囲攻撃
        // 範囲は自分のサイズの2倍
        const explosionRange = this.size * 2;
        const dist = this.position.distanceTo(game.player.position);

        // 青い炎エフェクトを追加
        if (game.flames) {
            for (let i = 0; i < 5; i++) {
                const offsetX = (Math.random() - 0.5) * explosionRange;
                const offsetY = (Math.random() - 0.5) * explosionRange;
                game.flames.push({
                    x: this.position.x + offsetX,
                    y: this.position.y + offsetY,
                    range: explosionRange * (0.5 + Math.random() * 0.5),
                    duration: 0.5 + Math.random() * 0.3,
                    time: 0,
                    color: 'blue',
                    damage: 0, // ダメージなし（視覚効果のみ）
                    tickRate: 999, // ダメージ判定なし
                    hitEnemies: new Map() // 必須プロパティ
                });
            }
        }

        if (dist <= explosionRange + game.player.radius) {
            // プレイヤーにダメージ (通常攻撃の2倍)
            game.player.takeDamage(this.damage * 2);
            // 音があれば鳴らす
            if (window.soundManager) soundManager.playSE('se_enemy_death'); // 仮音

            // ノックバック
            const knockbackDir = game.player.position.subtract(this.position).normalized;
            game.player.position = game.player.position.add(knockbackDir.multiply(50));
        }

        // 自分は消滅
        this.destroy();
    }

    dropWeb(game) {
        if (!game || !game.spiderWebs) return;

        // その場にウェブを設置
        const web = new SpiderWeb(this.position.x, this.position.y);
        game.spiderWebs.push(web);
    }

    draw(ctx) {
        ctx.save();

        const x = this.position.x;
        const y = this.position.y;
        const s = this.size;

        // ダメージフラッシュ
        let fillColor = this.color;
        if (this.flashTime > 0) {
            fillColor = '#ffffff';
        }

        // スプライト名を取得
        const spriteName = `enemy_${this.type}`;
        const sprite = spriteManager.get(spriteName);

        if (sprite) {
            // スプライト画像を描画
            const spriteSize = s * 2.5;

            ctx.save();
            ctx.translate(x, y);

            // ダメージフラッシュ時は白くする
            if (this.flashTime > 0) {
                ctx.filter = 'brightness(3)';
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
            // グラデーション
            let gradient;
            if (this.shape === 'circle') {
                gradient = ctx.createRadialGradient(x - s / 4, y - s / 4, 0, x, y, s);
            } else {
                gradient = ctx.createRadialGradient(x, y - s / 4, 0, x, y, s * 1.5);
            }
            gradient.addColorStop(0, this.lightenColor(fillColor, 30));
            gradient.addColorStop(1, fillColor);

            ctx.fillStyle = gradient;
            ctx.strokeStyle = this.darkenColor(this.color, 40);
            ctx.lineWidth = 2;

            switch (this.shape) {
                case 'square':
                    ctx.beginPath();
                    ctx.rect(x - s, y - s, s * 2, s * 2);
                    ctx.fill();
                    ctx.stroke();
                    break;

                case 'triangle':
                    ctx.beginPath();
                    ctx.moveTo(x, y - s);
                    ctx.lineTo(x + s, y + s);
                    ctx.lineTo(x - s, y + s);
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();
                    break;

                case 'diamond':
                    ctx.beginPath();
                    ctx.moveTo(x, y - s);
                    ctx.lineTo(x + s, y);
                    ctx.lineTo(x, y + s);
                    ctx.lineTo(x - s, y);
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();
                    break;

                case 'circle':
                    ctx.beginPath();
                    ctx.arc(x, y, s, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.stroke();

                    // ボス用の目
                    if (this.type === 'boss') {
                        ctx.fillStyle = '#ffff00';
                        ctx.beginPath();
                        ctx.arc(x - s / 3, y - s / 4, s / 6, 0, Math.PI * 2);
                        ctx.arc(x + s / 3, y - s / 4, s / 6, 0, Math.PI * 2);
                        ctx.fill();

                        ctx.fillStyle = '#000000';
                        ctx.beginPath();
                        ctx.arc(x - s / 3, y - s / 4, s / 12, 0, Math.PI * 2);
                        ctx.arc(x + s / 3, y - s / 4, s / 12, 0, Math.PI * 2);
                        ctx.fill();
                    }
                    break;

                case 'pentagon': // スパイダー用
                    ctx.beginPath();
                    for (let i = 0; i < 5; i++) {
                        const angle = (Math.PI * 2 / 5) * i - Math.PI / 2;
                        const px = x + Math.cos(angle) * s;
                        const py = y + Math.sin(angle) * s;
                        if (i === 0) ctx.moveTo(px, py);
                        else ctx.lineTo(px, py);
                    }
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();
                    // 脚
                    ctx.strokeStyle = this.color;
                    ctx.lineWidth = 2;
                    for (let i = 0; i < 8; i++) {
                        const angle = (Math.PI * 2 / 8) * i;
                        ctx.beginPath();
                        ctx.moveTo(x, y);
                        ctx.lineTo(x + Math.cos(angle) * s * 1.5, y + Math.sin(angle) * s * 1.5);
                        ctx.stroke();
                    }
                    break;
            }
        }

        // HPバー（ボスのみ）
        if (this.type === 'boss') {
            const barWidth = s * 2.5;
            const barHeight = 6;
            const barX = x - barWidth / 2;
            const barY = y - s - 15;

            ctx.fillStyle = '#333333';
            ctx.fillRect(barX, barY, barWidth, barHeight);

            ctx.fillStyle = '#ff4444';
            ctx.fillRect(barX, barY, barWidth * (this.hp / this.maxHp), barHeight);

            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;
            ctx.strokeRect(barX, barY, barWidth, barHeight);
        }

        ctx.restore();
    }

    takeDamage(amount, knockbackDir = null, knockbackForce = 0, stunDuration = 0) {
        this.hp -= amount;
        this.flashTime = 0.1;

        if (knockbackDir && knockbackForce > 0) {
            this.knockbackVelocity = knockbackDir.multiply(knockbackForce);
        }

        // スタン効果を適用
        if (stunDuration > 0) {
            this.stunTime = Math.max(this.stunTime, stunDuration);
        }

        if (this.hp <= 0) {
            this.destroy();
            return true; // 死亡
        }
        return false;
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
