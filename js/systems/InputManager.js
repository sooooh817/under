/**
 * 入力管理クラス
 * キーボード入力とタッチ入力を検知し、移動方向を提供
 */
class InputManager {
    constructor() {
        this.keys = {
            up: false,
            down: false,
            left: false,
            right: false
        };

        // タッチ操作用
        this.touchActive = false;
        this.touchDirection = new Vector2(0, 0);
        this.joystickCenter = null;
        this.joystickRadius = 60;

        this.setupEventListeners();
        this.setupTouchControls();
    }

    setupEventListeners() {
        window.addEventListener('keydown', (e) => this.handleKeyDown(e));
        window.addEventListener('keyup', (e) => this.handleKeyUp(e));
    }

    setupTouchControls() {
        const canvas = document.getElementById('gameCanvas');
        if (!canvas) return;

        // タッチ開始
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = canvas.getBoundingClientRect();
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;

            // タッチ位置をジョイスティックの中心に
            this.joystickCenter = { x, y };
            this.touchActive = true;
        }, { passive: false });

        // タッチ移動
        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (!this.touchActive || !this.joystickCenter) return;

            const touch = e.touches[0];
            const rect = canvas.getBoundingClientRect();
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;

            // ジョイスティック中心からの差分
            const dx = x - this.joystickCenter.x;
            const dy = y - this.joystickCenter.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance > 5) { // デッドゾーン
                // 正規化して方向を設定
                this.touchDirection = new Vector2(
                    dx / Math.max(distance, this.joystickRadius),
                    dy / Math.max(distance, this.joystickRadius)
                );
            } else {
                this.touchDirection = new Vector2(0, 0);
            }
        }, { passive: false });

        // タッチ終了
        canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.touchActive = false;
            this.joystickCenter = null;
            this.touchDirection = new Vector2(0, 0);
        }, { passive: false });

        canvas.addEventListener('touchcancel', (e) => {
            this.touchActive = false;
            this.joystickCenter = null;
            this.touchDirection = new Vector2(0, 0);
        });
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
        // タッチ入力が有効な場合はそちらを優先
        if (this.touchActive && (this.touchDirection.x !== 0 || this.touchDirection.y !== 0)) {
            return this.touchDirection.normalized;
        }

        // キーボード入力
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
        return this.keys.up || this.keys.down || this.keys.left || this.keys.right ||
            (this.touchActive && (this.touchDirection.x !== 0 || this.touchDirection.y !== 0));
    }

    /**
     * ジョイスティックの描画情報を取得
     */
    getJoystickInfo() {
        if (!this.touchActive || !this.joystickCenter) return null;
        return {
            center: this.joystickCenter,
            direction: this.touchDirection,
            radius: this.joystickRadius
        };
    }
}
