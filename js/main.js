/**
 * エントリーポイント
 * ゲームの初期化 + Firebase 認証UI
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

    // ─── Firebase 認証UI ───────────────────────────────
    setupAuthUI();
});

/**
 * 認証UIのセットアップ
 * - 匿名状態 / Google連携済み によって表示切り替え
 * - Google サインインボタン / サインアウトボタン のイベント登録
 */
function setupAuthUI() {
    const anonSection   = document.getElementById('auth-anonymous');
    const googleSection = document.getElementById('auth-google');
    const signInBtn     = document.getElementById('googleSignInBtn');
    const signOutBtn    = document.getElementById('googleSignOutBtn');
    const avatarImg     = document.getElementById('user-avatar');
    const displayName   = document.getElementById('user-displayname');
    const playerNameInput = document.getElementById('playerName');

    if (!signInBtn || !signOutBtn) return; // 要素がなければスキップ

    // 認証状態が変化したときにUIを更新
    firebaseManager.onAuthStateChanged(user => {
        if (!user) return;

        if (user.isAnonymous) {
            // ── 匿名ユーザー ──
            anonSection.classList.remove('hidden');
            googleSection.classList.add('hidden');
            // プレイヤー名入力欄をリセット（編集可能に）
            playerNameInput.removeAttribute('readonly');
            playerNameInput.style.opacity = '';
            if (!playerNameInput.value) {
                playerNameInput.placeholder = 'No name';
            }
        } else {
            // ── Google 連携済み ──
            anonSection.classList.add('hidden');
            googleSection.classList.remove('hidden');
            // アバター画像
            if (user.photoURL) {
                avatarImg.src = user.photoURL;
                avatarImg.style.display = 'block';
            } else {
                avatarImg.style.display = 'none';
            }
            // 表示名
            displayName.textContent = user.displayName || user.email || 'Google User';
            // プレイヤー名入力欄に表示名を初期値として設定（10文字まで）、編集は自由
            if (user.displayName) {
                playerNameInput.value = user.displayName.slice(0, 10);
            }
            // readonlyは設定しない（自由に変更可能）
            playerNameInput.removeAttribute('readonly');
            playerNameInput.style.opacity = '';
        }
    });

    // ── Google サインインボタン ──
    signInBtn.addEventListener('click', async () => {
        signInBtn.disabled = true;
        signInBtn.textContent = '接続中...';
        const success = await firebaseManager.signInWithGoogle();
        if (!success) {
            // 失敗したらボタンを元に戻す
            signInBtn.disabled = false;
            signInBtn.innerHTML = `
                <svg class="google-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Googleでアカウント登録`;
        }
    });

    // ── サインアウトボタン ──
    signOutBtn.addEventListener('click', async () => {
        signOutBtn.disabled = true;
        await firebaseManager.signOut();
        signOutBtn.disabled = false;
    });
}
