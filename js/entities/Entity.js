/**
 * エンティティ基底クラス
 * すべてのゲームオブジェクトの基本となるクラス
 */
class Entity {
    constructor(x, y) {
        this.position = new Vector2(x, y);
        this.velocity = new Vector2(0, 0);
        this.active = true;
    }

    /**
     * 毎フレーム更新
     * @param {number} deltaTime - 経過時間（秒）
     */
    update(deltaTime) {
        // サブクラスでオーバーライド
    }

    /**
     * 描画
     * @param {CanvasRenderingContext2D} ctx
     */
    draw(ctx) {
        // サブクラスでオーバーライド
    }

    /**
     * エンティティを非アクティブにする
     */
    destroy() {
        this.active = false;
    }
}
