/**
 * スプライトマネージャー
 * 画像アセットの読み込みと管理
 */
class SpriteManager {
    constructor() {
        this.sprites = {};
        this.loaded = false;
        this.loadPromise = null;
    }

    /**
     * すべてのスプライトを読み込み
     */
    async loadAll() {
        if (this.loadPromise) return this.loadPromise;

        this.loadPromise = new Promise(async (resolve) => {
            const spriteList = [
                // プレイヤースプライト
                { name: 'player_speed', path: 'assets/sprites/player_speed.png' },
                { name: 'player_tank', path: 'assets/sprites/player_tank.png' },
                { name: 'player_ranged', path: 'assets/sprites/player_ranged.png' },
                // 敵スプライト
                { name: 'enemy_normal', path: 'assets/sprites/enemy_normal.png' },
                { name: 'enemy_fast', path: 'assets/sprites/enemy_fast.png' },
                { name: 'enemy_tank', path: 'assets/sprites/enemy_tank.png' },
                { name: 'enemy_boss', path: 'assets/sprites/enemy_boss.png' },
                { name: 'enemy_ranged', path: 'assets/sprites/enemy_ranged.png' },
                { name: 'enemy_spider', path: 'assets/sprites/enemy_spider.png' },
                { name: 'enemy_assassin', path: 'assets/sprites/enemy_assassin.png' },
                { name: 'enemy_bomber', path: 'assets/sprites/enemy_bomber.png' },
                { name: 'enemy_final_boss', path: 'assets/sprites/enemy_final_boss.png' },
            ];

            let loadedCount = 0;
            const totalSprites = spriteList.length;

            for (const sprite of spriteList) {
                try {
                    const img = await this.loadImage(sprite.path);
                    this.sprites[sprite.name] = img;
                    loadedCount++;
                    console.log(`✓ Loaded: ${sprite.name} (${loadedCount}/${totalSprites})`);
                } catch (e) {
                    // 画像が見つからない場合はnullを設定
                    this.sprites[sprite.name] = null;
                    loadedCount++;
                    console.log(`✗ Not found: ${sprite.name} - using placeholder`);
                }
            }

            this.loaded = true;
            resolve();
        });

        return this.loadPromise;
    }

    /**
     * 単一画像を読み込み
     */
    loadImage(path) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error(`Failed to load: ${path}`));
            img.src = path;
        });
    }

    /**
     * スプライトを取得
     */
    get(name) {
        return this.sprites[name] || null;
    }

    /**
     * スプライトが存在するか
     */
    has(name) {
        return this.sprites[name] !== null && this.sprites[name] !== undefined;
    }
}

// グローバルインスタンス
const spriteManager = new SpriteManager();
