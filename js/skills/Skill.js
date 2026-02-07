/**
 * スキル基底クラス
 * すべてのスキルの基本となるクラス
 */
class Skill {
    constructor(options = {}) {
        this.name = options.name || 'Unknown Skill';
        this.description = options.description || '';
        this.icon = options.icon || '⚡';
        this.color = options.color || '#ffffff';

        this.baseDamage = options.damage || 10;
        this.damage = this.baseDamage;

        this.baseCooldown = options.cooldown || 1.0;
        this.cooldown = this.baseCooldown;
        this.cooldownTimer = 0;

        this.level = 1;
        this.maxLevel = 8;

        // スキル固有のパラメータ
        this.pierce = options.pierce || 0;
        this.projectileCount = options.projectileCount || 1;
        this.projectileSpeed = options.projectileSpeed || 300;
        this.size = options.size || 8;
        this.knockback = options.knockback || 100;
    }

    /**
     * 毎フレーム更新
     */
    update(deltaTime, cooldownMultiplier = 1.0) {
        if (this.cooldownTimer > 0) {
            this.cooldownTimer -= deltaTime;
        }
    }

    /**
     * 発射可能かチェック
     */
    canFire() {
        return this.cooldownTimer <= 0;
    }

    /**
     * スキル発動
     */
    fire(player, game) {
        this.cooldownTimer = this.cooldown * (player.cooldownMultiplier || 1.0);
        // サブクラスで実装
    }

    /**
     * レベルアップ時の強化
     */
    upgrade() {
        if (this.level >= this.maxLevel) return;
        this.level++;
        this.applyUpgrade();
    }

    /**
     * 強化効果を適用
     */
    applyUpgrade() {
        // サブクラスでオーバーライド
    }

    /**
     * 現在のステータスを取得（UI表示用）
     */
    getStats() {
        return {
            name: this.name,
            level: this.level,
            maxLevel: this.maxLevel,
            damage: this.damage,
            cooldown: this.cooldown.toFixed(2),
            description: this.getUpgradeDescription()
        };
    }

    /**
     * 次のアップグレード説明を取得
     */
    getUpgradeDescription() {
        return this.description;
    }
}
