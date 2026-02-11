/**
 * ゲームメインクラス
 * ゲームループ、状態管理、描画を統括
 */
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        // Canvas サイズ設定
        this.canvas.width = 960;
        this.canvas.height = 640;

        // システム
        this.inputManager = new InputManager();
        this.spawner = new Spawner(this.canvas);
        this.hud = new HUD(this.canvas);
        this.levelUpUI = new LevelUpUI();

        // ゲーム状態
        this.state = 'menu'; // menu, playing, paused, levelUp, gameOver
        this.selectedCharacter = 'speed';

        // エンティティ
        this.player = null;
        this.enemies = [];
        this.projectiles = [];
        this.enemyProjectiles = [];
        this.spiderWebs = []; // Spider webs
        this.expGems = [];
        this.items = [];
        this.flames = [];
        this.effects = [];
        this.damageTexts = [];
        this.maxDamageTexts = 30; // 画面上のダメージ数字の最大数（描画負荷軽減）

        // ゲーム統計
        this.gameTime = 0;
        this.killCount = 0;
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('pocketSurvivorHighScore')) || 0;

        // 時間管理
        this.lastTime = 0;

        // UI初期化
        this.setupUI();

        // 起動時BGM
        soundManager.playBGM('bgm_title');

        // ゲームループ開始
        requestAnimationFrame((time) => this.gameLoop(time));
    }

    setupUI() {
        const startScreen = document.getElementById('start-screen');
        const gameOverScreen = document.getElementById('game-over-screen');
        const startBtn = document.getElementById('startBtn');
        const restartBtn = document.getElementById('restartBtn');
        const charBtns = document.querySelectorAll('.char-btn');

        // キャラクター選択
        charBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                charBtns.forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                this.selectedCharacter = btn.dataset.type;
            });
        });

        // ゲーム開始
        startBtn.addEventListener('click', () => {
            // プレイヤー名を保存
            const playerNameInput = document.getElementById('playerName');
            const playerName = playerNameInput ? playerNameInput.value.trim() || 'No name' : 'No name';
            localStorage.setItem('pocketSurvivorPlayerName', playerName);

            // ローディング表示（一瞬フリーズしても反応したことがわかるように）
            startBtn.innerText = 'Loading...';
            startBtn.disabled = true;

            setTimeout(() => {
                try {
                    startScreen.classList.add('hidden');
                    this.startGame();

                    // 成功したらボタンを戻しておく（次回用）
                    setTimeout(() => {
                        startBtn.innerText = 'GAME START';
                        startBtn.disabled = false;
                    }, 100);

                } catch (e) {
                    console.error('Game Start Error:', e);
                    alert('ゲームの起動に失敗しました: ' + e.message);
                    startBtn.innerText = 'GAME START';
                    startBtn.disabled = false;
                }
            }, 50); // UI更新のためのわずかな遅延
        });

        // タイトルに戻る（リスタートボタン）
        restartBtn.addEventListener('click', () => {
            gameOverScreen.classList.add('hidden');
            // soundManager.stopBGM(); // 不要
            soundManager.playBGM('bgm_title'); // タイトルBGMへ移行

            // タイトル画面を表示
            startScreen.classList.remove('hidden');
            this.state = 'menu';
        });

        // ゲームクリアからのリスタート
        const clearRestartBtn = document.getElementById('clear-restartBtn');
        const gameClearScreen = document.getElementById('game-clear-screen');
        if (clearRestartBtn) {
            clearRestartBtn.addEventListener('click', () => {
                gameClearScreen.classList.add('hidden');
                soundManager.playBGM('bgm_title');
                startScreen.classList.remove('hidden');
                this.state = 'menu';
                // 紙吹雪をクリア
                const container = document.getElementById('confetti-container');
                if (container) container.innerHTML = '';
            });
        }

        // ポーズ関連
        const resumeBtn = document.getElementById('resumeBtn');
        const quitBtn = document.getElementById('quitBtn');
        const pauseScreen = document.getElementById('pause-screen');

        window.addEventListener('keydown', (e) => {
            if (e.code === 'Escape') {
                this.togglePause();
            }
        });

        resumeBtn.addEventListener('click', () => {
            this.togglePause();
        });

        quitBtn.addEventListener('click', () => {
            pauseScreen.classList.add('hidden');
            this.state = 'menu';
            startScreen.classList.remove('hidden');

            soundManager.playBGM('bgm_title'); // タイトルに戻ったらBGM再生
        });

        // 音量スライダー
        const volumeSlider = document.getElementById('volumeSlider');
        if (volumeSlider) {
            volumeSlider.addEventListener('input', (e) => {
                const vol = parseFloat(e.target.value);
                soundManager.setVolume(vol);
            });
            // 初期値反映（HTML側と合わせる）
            soundManager.setVolume(0.3);
        }

        // ランキング表示
        const rankingBtn = document.getElementById('rankingBtn');
        const rankingModal = document.getElementById('ranking-modal');
        const closeRankingBtn = document.getElementById('closeRankingBtn');

        if (rankingBtn && rankingModal) {
            rankingBtn.addEventListener('click', () => {
                this.showRanking();
                rankingModal.classList.remove('hidden');
            });

            closeRankingBtn.addEventListener('click', () => {
                rankingModal.classList.add('hidden');
            });
        }
    }

    // ランキング関連メソッド（ローカル保存も残す）
    getRankings() {
        const data = localStorage.getItem('pocketSurvivorRankings');
        return data ? JSON.parse(data) : [];
    }

    saveToRankings(score) {
        // ローカルにも保存
        let rankings = this.getRankings();
        rankings.push({
            score: score,
            date: new Date().toLocaleDateString('ja-JP')
        });
        rankings.sort((a, b) => b.score - a.score);
        rankings = rankings.slice(0, 10);
        localStorage.setItem('pocketSurvivorRankings', JSON.stringify(rankings));

        // Firebaseにも保存（プレイヤー名を取得）
        const playerName = localStorage.getItem('pocketSurvivorPlayerName') || 'No name';
        if (firebaseManager && firebaseManager.initialized) {
            firebaseManager.saveScore(playerName, score, this.gameTime, this.player.level);
        }

        return rankings;
    }

    async showRanking() {
        const list = document.getElementById('ranking-list');
        list.innerHTML = '<li class="no-records">読み込み中...</li>';

        // Firebaseから取得を試みる
        let rankings = [];
        if (firebaseManager && firebaseManager.initialized) {
            rankings = await firebaseManager.getTopRankings(10);
        }

        // Firebaseが使えない場合はローカルから
        if (rankings.length === 0) {
            rankings = this.getRankings().map(r => ({
                playerName: 'あなた',
                score: r.score,
                survivalTime: 0,
                level: 0
            }));
        }

        if (rankings.length === 0) {
            list.innerHTML = '<li class="no-records">まだ記録がありません</li>';
            return;
        }

        list.innerHTML = rankings.map((r, i) => `
            <li>
                <span class="rank">${i + 1}位</span>
                <span class="name">${r.playerName || 'No name'}</span>
                <span class="score">${r.score}</span>
            </li>
        `).join('');
    }

    startGame() {
        // リセット
        this.enemies = [];
        this.projectiles = [];
        this.enemyProjectiles = [];
        this.spiderWebs = [];
        this.expGems = [];
        this.items = [];
        this.flames = [];
        this.effects = [];
        this.damageTexts = [];
        this.maxDamageTexts = 30; // 画面上のダメージ数字の最大数（描画負荷軽減）
        this.gameTime = 0;
        this.killCount = 0;
        this.score = 0;

        // プレイヤー生成
        this.player = new Player(
            this.canvas.width / 2,
            this.canvas.height / 2,
            this.selectedCharacter
        );

        // スポーナーリセット
        this.spawner = new Spawner(this.canvas);

        // BGM再生
        soundManager.playBGM('bgm_game');

        this.state = 'playing';
    }

    gameLoop(currentTime) {
        // デルタタイムの計算
        const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1);
        this.lastTime = currentTime;

        // 状態に応じた更新
        if (this.state === 'playing') {
            this.update(deltaTime);
        }

        // 描画（常に実行）
        this.draw();

        // 次のフレームをリクエスト
        requestAnimationFrame((time) => this.gameLoop(time));
    }

    update(deltaTime) {
        this.gameTime += deltaTime;

        // プレイヤー更新
        this.player.update(deltaTime, this.inputManager, this);

        // プレイヤー死亡チェック
        if (!this.player.active) {
            this.gameOver();
            return;
        }

        // 敵スポーン
        this.spawner.update(deltaTime, this.gameTime, this.enemies, this.player);

        // 敵更新
        for (const enemy of this.enemies) {
            if (enemy.active) {
                enemy.update(deltaTime, this.player.position, this);
            }
        }

        // 弾更新
        for (const projectile of this.projectiles) {
            if (projectile.active) {
                projectile.update(deltaTime, this);
            }
        }

        // 弾描画（この処理はdrawメソッドに移動すべきですが、カリングロジックの意図としてここに残っている可能性があります。ただし通常はdrawで行います）
        // updateメソッド内での描画ループは本来不要です。drawメソッドのみで描画を行います。
        // ここでのループはupdate処理のみを行うべきですが、リファクタリングの過程で描画ロジックが混在しているようです。
        // 今回の変更ではdrawメソッドにカリングを追加したので、ここはupdateのみであることを確認します。
        // （コードを確認すると、updateメソッド内には弾のdraw呼び出しはありません。drawメソッドを見てみます）

        // 敵弾更新
        for (const projectile of this.enemyProjectiles) {
            if (projectile.active) {
                projectile.update(deltaTime, this);
            }
        }

        // 蜘蛛の巣更新
        for (const web of this.spiderWebs) {
            if (web.active) {
                web.update(deltaTime, this.player);
            }
        }

        // アイテム更新
        for (const item of this.items) {
            if (item.active) {
                const collected = item.update(deltaTime, this.player.position);
                if (collected) {
                    if (item instanceof Magnet) {
                        this.collectMagnet();
                    } else if (item instanceof Bomb) {
                        this.triggerBomb();
                    }
                }
            }
        }

        // 経験値ジェム更新
        for (const gem of this.expGems) {
            if (gem.active) {
                const expGained = gem.update(deltaTime, this.player.position, this.player.pickupRange);
                if (expGained > 0) {
                    soundManager.playSE('se_pickup');
                    if (this.player.addExp(expGained)) {
                        this.triggerLevelUp();
                    }
                }
            }
        }

        // 炎エリア更新
        this.updateFlames(deltaTime);

        // エフェクト更新
        this.updateEffects(deltaTime);

        // ダメージテキスト更新
        this.updateDamageTexts(deltaTime);

        // バリアスキルの更新
        for (const skill of this.player.skills) {
            if (skill instanceof Barrier) {
                skill.checkCollisions(this.player, this, this.gameTime);
            }
        }

        // 当たり判定
        this.checkCollisions();

        // 敵弾 vs プレイヤー
        this.checkEnemyProjectileCollisions();

        // 非アクティブなエンティティを削除
        this.cleanup();
    }

    updateFlames(deltaTime) {
        for (let i = this.flames.length - 1; i >= 0; i--) {
            const flame = this.flames[i];
            flame.time += deltaTime;

            if (flame.time >= flame.duration) {
                this.flames.splice(i, 1);
                continue;
            }

            // 敵へのダメージ
            for (const enemy of this.enemies) {
                if (!enemy.active) continue;

                const dist = Math.sqrt(
                    Math.pow(flame.x - enemy.position.x, 2) +
                    Math.pow(flame.y - enemy.position.y, 2)
                );

                if (dist <= flame.range + enemy.size) {
                    // ダメージクールダウンチェック
                    const lastHit = flame.hitEnemies.get(enemy) || 0;
                    if (flame.time >= lastHit + flame.tickRate) {
                        flame.hitEnemies.set(enemy, flame.time);

                        const killed = enemy.takeDamage(flame.damage);
                        this.showDamage(enemy.position.x, enemy.position.y, flame.damage, false);
                        if (killed) {
                            this.onEnemyKilled(enemy);
                        }
                    }
                }
            }
        }
    }

    updateEffects(deltaTime) {
        for (let i = this.effects.length - 1; i >= 0; i--) {
            const effect = this.effects[i];
            effect.time += deltaTime;

            if (effect.time >= effect.duration) {
                this.effects.splice(i, 1);
                continue;
            }

            if (effect.type === 'shockwave') {
                effect.radius = (effect.time / effect.duration) * effect.maxRadius;
            }
        }
    }

    checkCollisions() {
        // 弾 vs 敵
        for (const projectile of this.projectiles) {
            if (!projectile.active) continue;

            for (const enemy of this.enemies) {
                if (!enemy.active) continue;

                if (Collision.projectileToEnemy(projectile, enemy)) {
                    if (projectile.onHit(enemy)) {
                        soundManager.playSE('se_hit');
                        const knockbackDir = enemy.position.subtract(projectile.position).normalized;
                        const killed = enemy.takeDamage(
                            projectile.damage,
                            knockbackDir,
                            projectile.knockback,
                            projectile.stunDuration // スタン効果を適用
                        );

                        if (killed) {
                            this.onEnemyKilled(enemy);
                        }

                        // アサシンに当たったら貫通を止める
                        if (enemy.blocksPierce && projectile.pierce > 0) {
                            projectile.pierce = 0;
                        }

                        // クリティカル判定（仮：今は常になし）
                        // 将来的には projectile.critical などを参照
                        this.showDamage(enemy.position.x, enemy.position.y - 10, projectile.damage, false);
                    }
                }
            }
        }

        // プレイヤー vs 敵（接触ダメージ）
        for (const enemy of this.enemies) {
            if (!enemy.active) continue;

            if (Collision.playerToEnemy(this.player, enemy)) {
                this.player.takeDamage(enemy.damage);
                soundManager.playSE('se_player_damage');

                // ノックバック
                const knockbackDir = this.player.position.subtract(enemy.position).normalized;
                this.player.position = this.player.position.add(knockbackDir.multiply(20));
            }
        }
    }

    checkEnemyProjectileCollisions() {
        for (const projectile of this.enemyProjectiles) {
            if (!projectile.active) continue;

            // プレイヤーとの距離チェック
            const dist = this.player.position.distanceTo(projectile.position);
            if (dist < this.player.radius + projectile.size) {
                this.player.takeDamage(projectile.damage);
                soundManager.playSE('se_player_damage');

                // ノックバック
                const knockbackDir = this.player.position.subtract(projectile.position).normalized;
                this.player.position = this.player.position.add(knockbackDir.multiply(15));

                projectile.destroy();
            }
        }
    }

    onEnemyKilled(enemy) {
        this.killCount++;
        this.score += enemy.scoreValue || 10;
        soundManager.playSE('se_enemy_death');

        // ボス撃破時はSpawnerに通知
        if (enemy.isBoss) {
            this.spawner.onBossKilled(enemy);

            // ラスボス撃破時はゲームクリア
            if (this.spawner.finalBossKilled) {
                this.gameClear();
                return;
            }
        }

        // 経験値ジェムをドロップ
        const gem = new ExpGem(enemy.position.x, enemy.position.y, enemy.expValue);
        this.expGems.push(gem);

        // レアアイテムドロップ判定 (1%)
        if (Math.random() < 0.01) {
            const roll = Math.random();
            if (roll < 0.5) {
                this.items.push(new Magnet(enemy.position.x, enemy.position.y));
            } else {
                this.items.push(new Bomb(enemy.position.x, enemy.position.y));
            }
        }
    }

    collectMagnet() {
        soundManager.playSE('se_levelup'); // 仮音（気持ちいい音がいい）
        for (const gem of this.expGems) {
            if (gem.active) {
                gem.isAttracted = true;
                gem.attractSpeed = 800; // 高速回収
            }
        }
        this.showDamage(this.player.position.x, this.player.position.y - 40, "MAGNET!", true);
    }

    triggerBomb() {
        soundManager.playSE('se_enemy_death'); // ドカーン音が欲しい

        // 画面フラッシュ（白）
        this.ctx.fillStyle = 'white';
        this.ctx.globalAlpha = 0.8;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.globalAlpha = 1.0;

        let killCount = 0;
        for (const enemy of this.enemies) {
            if (enemy.active && !enemy.isBoss) { // ボス系は全て無効
                enemy.takeDamage(9999);
                this.onEnemyKilled(enemy);
                killCount++;
            }
        }
        this.showDamage(this.player.position.x, this.player.position.y - 40, "BOMB!", true);
    }

    triggerLevelUp() {
        soundManager.playSE('se_levelup');
        this.state = 'levelUp';

        this.levelUpUI.show(this.player, (option) => {
            this.applyUpgrade(option);
            this.state = 'playing';
        });
    }

    applyUpgrade(option) {
        switch (option.type) {
            case 'upgrade':
                option.skill.upgrade();
                break;

            case 'newSkill':
                const newSkill = new option.skillClass();
                this.player.addSkill(newSkill);
                break;

            case 'passiveUpgrade':
                option.passive.upgrade();

                // きずぐすりはアップグレード時も回復
                if (option.passive.name === 'きずぐすり') {
                    this.player.hp = Math.min(this.player.maxHp, this.player.hp + 20);
                    this.showDamage(this.player.position.x, this.player.position.y - 40, "+20 HP", true);
                }

                this.player.applyPassives();
                break;

            case 'newPassive':
                const passive = {
                    name: option.name,
                    icon: option.icon,
                    color: option.color,
                    level: 1,
                    upgrade: function () { this.level++; }
                };
                this.player.passiveSkills.push(passive);

                // きずぐすりはHP即時回復
                if (option.name === 'きずぐすり') {
                    this.player.hp = Math.min(this.player.maxHp, this.player.hp + 20);
                    this.showDamage(this.player.position.x, this.player.position.y - 40, "+20 HP", true);
                }

                this.player.applyPassives();
                break;
        }
    }

    cleanup() {
        this.enemies = this.enemies.filter(e => e.active);
        this.projectiles = this.projectiles.filter(p => p.active);
        this.enemyProjectiles = this.enemyProjectiles.filter(p => p.active);
        this.spiderWebs = this.spiderWebs.filter(w => w.active);
        this.expGems = this.expGems.filter(g => g.active);
        this.items = this.items.filter(i => i.active);
    }

    gameOver() {
        this.state = 'gameOver';

        // ハイスコア更新チェック
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('pocketSurvivorHighScore', this.highScore);
        }

        // ランキングに保存
        this.saveToRankings(this.score);

        const gameOverScreen = document.getElementById('game-over-screen');
        document.getElementById('final-time').textContent = this.formatTime(this.gameTime);
        document.getElementById('final-kills').textContent = this.killCount;
        document.getElementById('final-level').textContent = this.player.level;

        // スコア表示（要素が存在すれば）
        const scoreEl = document.getElementById('final-score');
        const highScoreEl = document.getElementById('final-highscore');
        if (scoreEl) scoreEl.textContent = this.score;
        if (highScoreEl) highScoreEl.textContent = this.highScore;

        gameOverScreen.classList.remove('hidden');

        // BGM切り替え
        soundManager.playBGM('bgm_gameover');
    }

    gameClear() {
        this.state = 'gameOver'; // 状態はgameOver扱い（操作不能）

        // スコアボーナス
        this.score += 5000;

        // ハイスコア更新
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('pocketSurvivorHighScore', this.highScore);
        }

        this.saveToRankings(this.score);

        const gameClearScreen = document.getElementById('game-clear-screen');
        document.getElementById('clear-time').textContent = this.formatTime(this.gameTime);
        document.getElementById('clear-kills').textContent = this.killCount;
        document.getElementById('clear-level').textContent = this.player.level;

        const scoreEl = document.getElementById('clear-score');
        const highScoreEl = document.getElementById('clear-highscore');
        if (scoreEl) scoreEl.textContent = this.score;
        if (highScoreEl) highScoreEl.textContent = this.highScore;

        // キャラクター画像を設定
        const charImg = document.getElementById('clear-char-img');
        if (charImg) {
            charImg.src = `assets/sprites/player_${this.player.type}.png`;
        }

        gameClearScreen.classList.remove('hidden');
        soundManager.playBGM('bgm_gameover'); // 勝利用BGMがあればそれに変更

        // 紙吹雪開始
        this.createConfetti();
    }

    createConfetti() {
        const container = document.getElementById('confetti-container');
        if (!container) return;

        container.innerHTML = '';
        const colors = ['#fce18a', '#ff726d', '#b48def', '#f4306d'];

        for (let i = 0; i < 50; i++) {
            const confetti = document.createElement('div');
            confetti.classList.add('confetti');

            // ランダムな位置、色、遅延
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.animationDelay = Math.random() * 2 + 's';
            confetti.style.animationDuration = (Math.random() * 2 + 2) + 's'; // 2-4秒

            container.appendChild(confetti);
        }
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    draw() {
        // 背景クリア
        this.ctx.fillStyle = '#0a0a12';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // グリッド背景
        this.drawGrid();

        if (this.state === 'menu' || !this.player) return;

        // 炎エリア描画
        this.drawFlames();

        // 経験値ジェム描画
        for (const gem of this.expGems) {
            if (gem.active) gem.draw(this.ctx);
        }

        // アイテム描画
        for (const item of this.items) {
            if (item.active) item.draw(this.ctx);
        }

        // 蜘蛛の巣描画
        for (const web of this.spiderWebs) {
            if (web.active) web.draw(this.ctx);
        }

        // 敵描画
        for (const enemy of this.enemies) {
            if (enemy.active) {
                // 画面外カリング（描画スキップ）
                if (enemy.x + enemy.width < 0 || enemy.x > this.canvas.width ||
                    enemy.y + enemy.height < 0 || enemy.y > this.canvas.height) {
                    continue;
                }
                enemy.draw(this.ctx);
            }
        }
        // 弾描画
        for (const projectile of this.projectiles) {
            if (projectile.active) {
                // 画面外カリング
                if (projectile.x + projectile.width < 0 || projectile.x > this.canvas.width ||
                    projectile.y + projectile.height < 0 || projectile.y > this.canvas.height) {
                    continue;
                }
                projectile.draw(this.ctx);
            }
        }

        // 敵弾描画
        for (const projectile of this.enemyProjectiles) {
            if (projectile.active) projectile.draw(this.ctx);
        }

        // プレイヤー描画
        this.player.draw(this.ctx);

        // バリアオーブ描画
        for (const skill of this.player.skills) {
            if (skill instanceof Barrier) {
                skill.drawOrbs(this.ctx, this.player, this.gameTime);
            }
        }

        // エフェクト描画
        this.drawEffects();

        // ダメージテキスト描画
        this.drawDamageTexts();
    }

    drawGrid() {
        this.ctx.strokeStyle = 'rgba(255, 215, 0, 0.1)';
        this.ctx.lineWidth = 1;

        // グリッド移動（疑似スクロール）
        // 実際の無限スクロールはもっと複雑ですが、ここでは雰囲気だけ
        // const offsetX = -this.player.x % 50;
        // const offsetY = -this.player.y % 50;

        // 固定グリッド
        const gridSize = 50;
        for (let x = 0; x <= this.canvas.width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }

        for (let y = 0; y <= this.canvas.height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }

    drawFlames() {
        for (const flame of this.flames) {
            this.ctx.save();
            this.ctx.globalAlpha = (flame.duration - flame.time) / flame.duration * 0.5;
            this.ctx.fillStyle = '#ff5500';
            this.ctx.beginPath();
            this.ctx.arc(flame.x, flame.y, flame.range, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        }
    }

    drawEffects() {
        for (const effect of this.effects) {
            if (effect.type === 'shockwave') {
                this.ctx.save();
                const alpha = 1 - (effect.time / effect.duration);
                this.ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
                this.ctx.lineWidth = 3;
                this.ctx.beginPath();
                this.ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
                this.ctx.stroke();
                this.ctx.restore();
            }
        }
    }

    updateDamageTexts(deltaTime) {
        for (let i = this.damageTexts.length - 1; i >= 0; i--) {
            const text = this.damageTexts[i];
            text.update(deltaTime);
            if (!text.active) {
                this.damageTexts.splice(i, 1);
            }
        }
    }

    drawDamageTexts() {
        for (const text of this.damageTexts) {
            text.draw(this.ctx);
        }
    }

    showDamage(x, y, amount, isCritical = false) {
        // 少し位置をずらす
        const offsetX = (Math.random() - 0.5) * 20;
        const offsetY = (Math.random() - 0.5) * 20;

        // 重すぎる場合は古いものを消す（または新規追加を諦める）
        if (this.damageTexts.length >= this.maxDamageTexts) {
            this.damageTexts.shift(); // 最も古いものを削除
        }

        this.damageTexts.push(new DamageText(x + offsetX, y + offsetY, amount, isCritical));
    }
    togglePause() {
        if (this.state === 'playing') {
            this.state = 'paused';
            document.getElementById('pause-screen').classList.remove('hidden');
            soundManager.pauseBGM();
        } else if (this.state === 'paused') {
            this.state = 'playing';
            document.getElementById('pause-screen').classList.add('hidden');
            soundManager.resumeBGM();
        }
    }
}
