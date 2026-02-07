/**
 * 入力管理クラス
 * キーボード入力を検知し、移動方向を提供
 */
class InputManager {
    constructor() {
        this.keys = {
            up: false,
            down: false,
            left: false,
            right: false
        };

        this.setupEventListeners();
    }

    setupEventListeners() {
        window.addEventListener('keydown', (e) => this.handleKeyDown(e));
        window.addEventListener('keyup', (e) => this.handleKeyUp(e));
    }

    handleKeyDown(e) {
        switch (e.code) {
            case 'KeyW':
            case 'ArrowUp':
                this.keys.up = true;
                break;
            case 'KeyS':
            case 'ArrowDown':
                this.keys.down = true;
                break;
            case 'KeyA':
            case 'ArrowLeft':
                this.keys.left = true;
                break;
            case 'KeyD':
            case 'ArrowRight':
                this.keys.right = true;
                break;
        }
    }

    handleKeyUp(e) {
        switch (e.code) {
            case 'KeyW':
            case 'ArrowUp':
                this.keys.up = false;
                break;
            case 'KeyS':
            case 'ArrowDown':
                this.keys.down = false;
                break;
            case 'KeyA':
            case 'ArrowLeft':
                this.keys.left = false;
                break;
            case 'KeyD':
            case 'ArrowRight':
                this.keys.right = false;
                break;
        }
    }

    /**
     * 移動方向ベクトルを取得（正規化済み）
     */
    getMovementDirection() {
        let x = 0;
        let y = 0;

        if (this.keys.up) y -= 1;
        if (this.keys.down) y += 1;
        if (this.keys.left) x -= 1;
        if (this.keys.right) x += 1;

        const direction = new Vector2(x, y);
        return direction.normalized;
    }

    /**
     * 何かキーが押されているか
     */
    isMoving() {
        return this.keys.up || this.keys.down || this.keys.left || this.keys.right;
    }
}
