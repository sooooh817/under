/**
 * 敵スポーナー
 * 時間経過に応じて敵を生成
 */
class Spawner {
    constructor(canvas) {
        this.canvas = canvas;
        this.spawnTimer = 0;
        this.baseSpawnInterval = 1.5;
        this.spawnInterval = this.baseSpawnInterval;

        // 難易度スケーリング
        this.difficultyMultiplier = 1;
        this.bossSpawned = false;
        this.lastBossTime = 60; // 初回ボス: 60+180=240秒(4分)
        this.bossInterval = 180; // 3分ごと (1回目:4分, 2回目:7分, 3回目:10分...)
        this.bossKillCount = 0; // ボス撃破数
        this.maxBossCount = 3; // 最大ボス出現回数
        this.bossSpawnCount = 0; // ボス出現回数
        this.finalBossKilled = false; // ラスボス撃破フラグ
    }

    update(deltaTime, gameTime, enemies, player) {
        // 難易度上昇（時間経過で敵が強く、多くなる）
        this.difficultyMultiplier = 1 + Math.floor(gameTime / 30) * 0.2;
        this.gameTime = gameTime;
        this.spawnInterval = Math.max(0.3, this.baseSpawnInterval - gameTime / 180);

        this.spawnTimer += deltaTime;

        // 通常敵のスポーン
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnTimer = 0;
            this.spawnEnemy(enemies, player);
        }

        // ボススポーン（5分ごと）
        if (this.bossSpawnCount < this.maxBossCount && gameTime - this.lastBossTime >= this.bossInterval) {
            this.spawnBoss(enemies, player);
            this.lastBossTime = gameTime;
            this.bossSpawnCount++;
        }
    }

    spawnEnemy(enemies, player) {
        const spawnPos = this.getSpawnPosition(player.position);

        // 敵タイプをランダム選択（難易度に応じて変化）
        const type = this.getRandomEnemyType();

        const enemy = new Enemy(spawnPos.x, spawnPos.y, type);

        // 難易度に応じてステータスを強化
        enemy.hp = Math.floor(enemy.hp * this.difficultyMultiplier);
        enemy.maxHp = enemy.hp;
        enemy.damage = Math.floor(enemy.damage * (1 + this.difficultyMultiplier * 0.1));

        enemies.push(enemy);
    }

    spawnBoss(enemies, player) {
        const spawnPos = this.getSpawnPosition(player.position);

        // 3回目はラスボス
        const bossType = (this.bossSpawnCount >= this.maxBossCount - 1) ? 'final_boss' : 'boss';
        const boss = new Enemy(spawnPos.x, spawnPos.y, bossType);

        // ボスの難易度スケーリング
        boss.hp = Math.floor(boss.hp * this.difficultyMultiplier * 1.5);
        boss.maxHp = boss.hp;

        enemies.push(boss);
    }

    getSpawnPosition(playerPosition) {
        // 画面外からスポーン（ただし画面の見える範囲の外側）
        const margin = 50;
        const side = Math.floor(Math.random() * 4);

        let x, y;

        switch (side) {
            case 0: // 上
                x = Math.random() * this.canvas.width;
                y = -margin;
                break;
            case 1: // 右
                x = this.canvas.width + margin;
                y = Math.random() * this.canvas.height;
                break;
            case 2: // 下
                x = Math.random() * this.canvas.width;
                y = this.canvas.height + margin;
                break;
            case 3: // 左
                x = -margin;
                y = Math.random() * this.canvas.height;
                break;
        }

        return new Vector2(x, y);
    }

    getRandomEnemyType() {
        const rand = Math.random();
        const time = this.difficultyMultiplier;

        // ボス撃破後はアサシン出現
        if (this.bossKillCount >= 1 && rand < 0.12) {
            return 'assassin';
            // 2回目ボス撃破後はボマー出現
        } else if (this.bossKillCount >= 2 && rand < 0.20) {
            return 'bomber';
        } else if (time >= 1.6 && rand < 0.15) { // Tank: 1分30秒 (time >= 1.6)
            return 'tank';
        } else if (this.gameTime >= 30 && rand < 0.25) { // Spider: 30秒以降
            return 'spider';
        } else if (this.gameTime >= 15 && rand < 0.35) { // Ranged: 15秒以降
            return 'ranged';
        } else if (this.gameTime >= 30 && rand < 0.45) { // Fast: 30秒以降
            return 'fast';
        } else {
            return 'normal';
        }
    }

    onBossKilled(enemy) {
        this.bossKillCount++;
        if (enemy && enemy.type === 'final_boss') {
            this.finalBossKilled = true;
        }
    }
}
