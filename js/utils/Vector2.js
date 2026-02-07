/**
 * 2Dベクトルユーティリティクラス
 * 位置、方向、速度の計算に使用
 */
class Vector2 {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    /**
     * ベクトルの長さを取得
     */
    get magnitude() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    /**
     * 正規化されたベクトルを取得
     */
    get normalized() {
        const mag = this.magnitude;
        if (mag === 0) return new Vector2(0, 0);
        return new Vector2(this.x / mag, this.y / mag);
    }

    /**
     * ベクトルを加算
     */
    add(other) {
        return new Vector2(this.x + other.x, this.y + other.y);
    }

    /**
     * ベクトルを減算
     */
    subtract(other) {
        return new Vector2(this.x - other.x, this.y - other.y);
    }

    /**
     * スカラー倍
     */
    multiply(scalar) {
        return new Vector2(this.x * scalar, this.y * scalar);
    }

    /**
     * 2点間の距離を計算
     */
    distanceTo(other) {
        return this.subtract(other).magnitude;
    }

    /**
     * ベクトルの角度（ラジアン）を取得
     */
    get angle() {
        return Math.atan2(this.y, this.x);
    }

    /**
     * 角度からベクトルを作成
     */
    static fromAngle(angle, magnitude = 1) {
        return new Vector2(
            Math.cos(angle) * magnitude,
            Math.sin(angle) * magnitude
        );
    }

    /**
     * ベクトルをコピー
     */
    clone() {
        return new Vector2(this.x, this.y);
    }

    /**
     * ゼロベクトル
     */
    static get zero() {
        return new Vector2(0, 0);
    }

    /**
     * ランダムな単位ベクトル
     */
    static random() {
        const angle = Math.random() * Math.PI * 2;
        return Vector2.fromAngle(angle);
    }
}
