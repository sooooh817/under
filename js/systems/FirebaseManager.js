/**
 * Firebase マネージャー
 * Firestore ランキング管理 + Firebase Authentication (匿名認証 / Googleログイン)
 */
class FirebaseManager {
    constructor() {
        this.db = null;
        this.auth = null;
        this.currentUser = null;
        this.initialized = false;
        this.authStateCallbacks = [];
        this.init();
    }

    async init() {
        try {
            // Firebase設定
            const firebaseConfig = {
                apiKey: "AIzaSyD--u9mkf6VEZlz6oxD1c2fwVVBmLVyot0",
                authDomain: "pocket-survivor-f072f.firebaseapp.com",
                projectId: "pocket-survivor-f072f",
                storageBucket: "pocket-survivor-f072f.firebasestorage.app",
                messagingSenderId: "674302826177",
                appId: "1:674302826177:web:48ada541283ddf3c832640"
            };

            // Firebase初期化
            if (!firebase.apps.length) {
                firebase.initializeApp(firebaseConfig);
            }

            this.db = firebase.firestore();
            this.auth = firebase.auth();
            this.initialized = true;
            console.log('Firebase initialized successfully');

            // 認証状態の監視を開始
            this._setupAuthStateListener();

            // 匿名ユーザーとして自動サインイン（未ログイン時のみ）
            await this._autoSignInAnonymously();

        } catch (error) {
            console.error('Firebase initialization failed:', error);
            this.initialized = false;
        }
    }

    // ─── Auth: 内部メソッド ─────────────────────────────────

    /**
     * 認証状態の監視をセットアップ
     */
    _setupAuthStateListener() {
        this.auth.onAuthStateChanged(user => {
            this.currentUser = user;
            console.log('Auth state changed:', user ? `uid=${user.uid} anonymous=${user.isAnonymous}` : 'signed out');
            // 登録されたコールバックを全て呼び出す
            this.authStateCallbacks.forEach(cb => cb(user));
        });
    }

    /**
     * 未サインイン時に匿名で自動サインイン
     */
    async _autoSignInAnonymously() {
        if (!this.auth.currentUser) {
            try {
                await this.auth.signInAnonymously();
                console.log('Signed in anonymously');
            } catch (error) {
                console.error('Anonymous sign-in failed:', error);
            }
        }
    }

    // ─── Auth: 公開メソッド ─────────────────────────────────

    /**
     * 認証状態変化のコールバックを登録
     * @param {function} callback - (user) => void
     */
    onAuthStateChanged(callback) {
        this.authStateCallbacks.push(callback);
        // 既にユーザーがいれば即座に呼び出す
        if (this.currentUser !== null) {
            callback(this.currentUser);
        }
    }

    /**
     * 現在のユーザーを取得
     * @returns {firebase.User|null}
     */
    getCurrentUser() {
        return this.currentUser;
    }

    /**
     * Google アカウントでサインイン（匿名アカウントからのリンクアップグレード対応）
     */
    async signInWithGoogle() {
        if (!this.initialized) return false;
        try {
            const provider = new firebase.auth.GoogleAuthProvider();
            const user = this.auth.currentUser;

            if (user && user.isAnonymous) {
                // 匿名アカウントを Google アカウントにリンク
                await user.linkWithPopup(provider);
                console.log('Anonymous account linked to Google');
            } else {
                // 通常の Google サインイン
                await this.auth.signInWithPopup(provider);
                console.log('Signed in with Google');
            }
            return true;
        } catch (error) {
            // 既に別アカウントで使用されている場合はそちらでサインイン
            if (error.code === 'auth/credential-already-in-use') {
                try {
                    await this.auth.signInWithCredential(error.credential);
                    console.log('Signed in with existing Google account');
                    return true;
                } catch (e) {
                    console.error('Sign-in with existing credential failed:', e);
                    return false;
                }
            }
            console.error('Google sign-in failed:', error);
            return false;
        }
    }

    /**
     * サインアウト（後に匿名ユーザーとして再サインイン）
     */
    async signOut() {
        if (!this.initialized) return;
        try {
            await this.auth.signOut();
            console.log('Signed out');
            // 匿名ユーザーとして再サインイン
            await this._autoSignInAnonymously();
        } catch (error) {
            console.error('Sign-out failed:', error);
        }
    }

    /**
     * 現在のユーザーが Google 認証済みかどうか
     * @returns {boolean}
     */
    isGoogleUser() {
        return this.currentUser !== null && !this.currentUser.isAnonymous;
    }

    /**
     * ランキング用の表示名を返す
     * Google認証済み → Google表示名
     * 匿名 / 未ログイン → null（呼び出し側でプレイヤー名入力欄の値を使う）
     * @returns {string|null}
     */
    getDisplayName() {
        if (this.isGoogleUser() && this.currentUser.displayName) {
            return this.currentUser.displayName;
        }
        return null;
    }

    // ─── Firestore: ランキング ───────────────────────────────

    /**
     * スコアをFirestoreに保存
     */
    async saveScore(playerName, score, survivalTime, level) {
        if (!this.initialized || !this.db) {
            console.warn('Firebase not initialized');
            return false;
        }

        // Google認証済みなら表示名を優先、匿名なら入力名を使用
        const name = this.getDisplayName() || playerName || 'No name';

        try {
            await this.db.collection('rankings').add({
                playerName: name,
                score: score,
                survivalTime: survivalTime,
                level: level,
                uid: this.currentUser ? this.currentUser.uid : null,
                isAnonymous: this.currentUser ? this.currentUser.isAnonymous : true,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log('Score saved to Firebase');
            return true;
        } catch (error) {
            console.error('Error saving score:', error);
            return false;
        }
    }

    /**
     * トップ10ランキングを取得
     */
    async getTopRankings(limit = 10) {
        if (!this.initialized || !this.db) {
            console.warn('Firebase not initialized');
            return [];
        }

        try {
            const snapshot = await this.db.collection('rankings')
                .orderBy('score', 'desc')
                .limit(limit)
                .get();

            const rankings = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                rankings.push({
                    playerName: data.playerName,
                    score: data.score,
                    survivalTime: data.survivalTime,
                    level: data.level,
                    timestamp: data.timestamp?.toDate() || new Date()
                });
            });

            return rankings;
        } catch (error) {
            console.error('Error getting rankings:', error);
            return [];
        }
    }
}

// グローバルインスタンス
const firebaseManager = new FirebaseManager();
