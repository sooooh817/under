/**
 * エントリーポイント
 * ゲームの初期化
 */

// DOMが読み込まれたらゲームを開始
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🎮 Pocket Survivor - 起動中...');

    // スプライトを読み込み（画像がなくてもOK）
    await spriteManager.loadAll();

    // サウンドを読み込み（音声がなくてもOK）
    await soundManager.loadAll();

    // ゲームインスタンス作成
    window.game = new Game();

    console.log('🎮 Pocket Survivor - ゲームが起動しました！');
    console.log('WASD または 矢印キーで移動');
    console.log('🔊 ヒント: assets/audio/ フォルダにBGMを追加すると音楽が流れます');

    // ユーザー操作でオーディオコンテキストを開始（ブラウザの自動再生制限対策）
    const resumeAudio = () => {
        if (soundManager.ctx && soundManager.ctx.state === 'suspended') {
            soundManager.ctx.resume();
        }
        document.removeEventListener('click', resumeAudio);
        document.removeEventListener('keydown', resumeAudio);
    };
    document.addEventListener('click', resumeAudio);
    document.addEventListener('keydown', resumeAudio);
});
