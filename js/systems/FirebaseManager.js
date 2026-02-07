/**
 * Firebase ランキングマネージャー
 * 共有ランキングをFirestoreで管理
 */
class FirebaseManager {
    constructor() {
        this.db = null;
        this.initialized = false;
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
            this.initialized = true;
            console.log('Firebase initialized successfully');
        } catch (error) {
            console.error('Firebase initialization failed:', error);
            this.initialized = false;
        }
    }

    /**
     * スコアをFirestoreに保存
     */
    async saveScore(playerName, score, survivalTime, level) {
        if (!this.initialized || !this.db) {
            console.warn('Firebase not initialized');
            return false;
        }

        try {
            await this.db.collection('rankings').add({
                playerName: playerName || '名無し',
                score: score,
                survivalTime: survivalTime,
                level: level,
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
