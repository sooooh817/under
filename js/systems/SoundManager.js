/**
 * サウンドマネージャー
 * Web Audio APIを使用してゲームボーイ風（ポケモン風）の音を合成・再生する
 */
class SoundManager {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.bgmVolume = 0.3;
        this.seVolume = 0.4;
        this.isMuted = false;
        this.currentBgmNodes = [];
        this.isPlaying = false;
        this.bgmTimer = null;
        this.masterVolume = 1.0; // Global volume control

        // 音階周波数テーブル (Octave 4)
        this.notes = {
            'C': 261.63, 'C#': 277.18, 'D': 293.66, 'D#': 311.13,
            'E': 329.63, 'F': 349.23, 'F#': 369.99, 'G': 392.00,
            'G#': 415.30, 'A': 440.00, 'A#': 466.16, 'B': 493.88
        };
    }

    /**
     * 初期化（ユーザー操作後に呼ぶ必要がある）
     */
    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = this.masterVolume;
            this.masterGain.connect(this.ctx.destination);
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    /**
     * ファイルロードの互換性のため（実際はロード不要）
     */
    async loadAll() {
        // 合成なのでロード待ちなし
        console.log('Using Web Audio API Synthesis');
        return Promise.resolve();
    }

    /**
     * ノート名とオクターブから周波数を計算
     */
    getFreq(note, octave) {
        if (!note || note === 'R') return 0; // Rest
        let freq = this.notes[note];
        if (!freq) return 0;

        // Octave 4を基準に計算
        return freq * Math.pow(2, octave - 4);
    }

    /**
     * BGMを再生
     */
    playBGM(name) {
        this.init();
        this.stopBGM();

        if (this.isMuted) return;

        this.isPlaying = true;

        // ポケモン戦闘曲風BGMパターン
        if (name === 'bgm_game') {
            this.playBattleBGM();
        } else if (name === 'bgm_title') {
            this.playTitleBGM();
        } else if (name === 'bgm_gameover') {
            this.playGameOverBGM();
        }
    }

    playBattleBGM() {
        // カイナシティ (Slateport City) - Pokemon R/S Style
        // Bright, march-like, trumpets.
        const tempo = 135;
        const beatTime = 60 / tempo;

        // 簡易シーケンサー用ステート

        // 音データ (Key: F Major)
        // Note: l=1.0 is a quarter note

        // Intro (Simplified: Drums & Bass start, then melody)
        // Let's jump straight to the main cheerful loop for immediate recognition

        const loopMelody = [
            // Segment A (Trumpet fanfare style)
            // Pickup
            { n: 'C', o: 4, l: 0.25 }, { n: 'F', o: 4, l: 0.25 }, { n: 'A', o: 4, l: 0.25 }, { n: 'C', o: 5, l: 0.25 },
            // Measure 1
            { n: 'F', o: 5, l: 1.0 }, { n: 'F', o: 5, l: 0.25 }, { n: 'E', o: 5, l: 0.25 }, { n: 'D', o: 5, l: 0.25 }, { n: 'C', o: 5, l: 0.25 },
            // Measure 2
            { n: 'A#', o: 4, l: 0.5 }, { n: 'D', o: 5, l: 0.5 }, { n: 'C', o: 5, l: 0.5 }, { n: 'R', o: 0, l: 0.5 },
            // Measure 3
            { n: 'C', o: 4, l: 0.25 }, { n: 'E', o: 4, l: 0.25 }, { n: 'G', o: 4, l: 0.25 }, { n: 'A#', o: 4, l: 0.25 },
            { n: 'D', o: 5, l: 1.0 }, { n: 'C', o: 5, l: 0.25 }, { n: 'A#', o: 4, l: 0.25 }, { n: 'A', o: 4, l: 0.25 }, { n: 'G', o: 4, l: 0.25 },
            // Measure 4
            { n: 'F', o: 4, l: 0.5 }, { n: 'A', o: 4, l: 0.5 }, { n: 'C', o: 5, l: 0.5 }, { n: 'R', o: 0, l: 0.5 },

            // Segment B
            // Measure 5
            { n: 'A', o: 4, l: 0.5 }, { n: 'C', o: 5, l: 0.5 }, { n: 'F', o: 5, l: 0.75 }, { n: 'D', o: 5, l: 0.25 },
            // Measure 6
            { n: 'C', o: 5, l: 0.5 }, { n: 'A#', o: 4, l: 0.5 }, { n: 'A', o: 4, l: 0.5 }, { n: 'G', o: 4, l: 0.5 },
            // Measure 7
            { n: 'G', o: 4, l: 0.5 }, { n: 'A#', o: 4, l: 0.5 }, { n: 'E', o: 5, l: 0.75 }, { n: 'D', o: 5, l: 0.25 },
            // Measure 8
            { n: 'C', o: 5, l: 0.5 }, { n: 'A#', o: 4, l: 0.5 }, { n: 'A', o: 4, l: 0.5 }, { n: 'G', o: 4, l: 0.5 },

            // Loop turnaround
            { n: 'F', o: 4, l: 0.5 }, { n: 'A', o: 4, l: 0.5 }, { n: 'F', o: 4, l: 1.0 }
        ];

        const loopBass = [
            // Marching Bass (F Major: F, C, F, C...)
            // Measure 1 (F)
            { n: 'F', o: 3, l: 0.5 }, { n: 'C', o: 3, l: 0.5 }, { n: 'F', o: 3, l: 0.5 }, { n: 'C', o: 3, l: 0.5 },
            // Measure 2 (Bb)
            { n: 'A#', o: 2, l: 0.5 }, { n: 'F', o: 3, l: 0.5 }, { n: 'A#', o: 2, l: 0.5 }, { n: 'F', o: 3, l: 0.5 },
            // Measure 3 (C)
            { n: 'C', o: 3, l: 0.5 }, { n: 'G', o: 2, l: 0.5 }, { n: 'C', o: 3, l: 0.5 }, { n: 'G', o: 2, l: 0.5 },
            // Measure 4 (F)
            { n: 'F', o: 3, l: 0.5 }, { n: 'C', o: 3, l: 0.5 }, { n: 'F', o: 3, l: 0.5 }, { n: 'C', o: 3, l: 0.5 },
            // Measure 5 (F)
            { n: 'F', o: 3, l: 0.5 }, { n: 'C', o: 3, l: 0.5 }, { n: 'F', o: 3, l: 0.5 }, { n: 'C', o: 3, l: 0.5 },
            // Measure 6 (C)
            { n: 'C', o: 3, l: 0.5 }, { n: 'G', o: 2, l: 0.5 }, { n: 'C', o: 3, l: 0.5 }, { n: 'G', o: 2, l: 0.5 },
            // Measure 7 (C)
            { n: 'C', o: 3, l: 0.5 }, { n: 'G', o: 2, l: 0.5 }, { n: 'C', o: 3, l: 0.5 }, { n: 'G', o: 2, l: 0.5 },
            // Measure 8 (F)
            { n: 'F', o: 3, l: 0.5 }, { n: 'C', o: 3, l: 0.5 }, { n: 'F', o: 3, l: 0.5 }, { n: 'C', o: 3, l: 0.5 },
            { n: 'F', o: 3, l: 0.5 }, { n: 'C', o: 3, l: 1.0 }, { n: 'F', o: 3, l: 0.5 },
        ];

        // トラックごとのスケジューラー
        const runTrack = (trackId, notes, startTime, loop) => {
            let nIdx = 0;
            let t = startTime;

            const scheduleTrack = () => {
                if (!this.isPlaying) return;

                while (t < this.ctx.currentTime + 0.1) {
                    if (nIdx >= notes.length) {
                        if (loop) {
                            nIdx = 0;
                        } else {
                            return;
                        }
                    }

                    const note = notes[nIdx];
                    const dur = note.l * beatTime;

                    let type = 'square';
                    let vol = this.bgmVolume;

                    if (trackId === 'bass') {
                        type = 'triangle';
                        vol = this.bgmVolume * 0.8;
                    } else if (trackId === 'lead') {
                        type = 'sawtooth'; // R/S uses trumpets, sawtooth is closer
                        vol = this.bgmVolume * 0.7; // Sawtooth is loud
                    }

                    if (note.n !== 'R') {
                        this.playToneAt(this.getFreq(note.n, note.o), type, t, dur * 0.8, vol);
                    }

                    // Simple drums for march feel
                    if (trackId === 'bass') {
                        // Om-pah Om-pah
                        if (nIdx % 2 === 1) { // Off-beat snare
                            this.playNoiseAt(t, 0.1, this.bgmVolume * 0.4);
                        }
                    }

                    t += dur;
                    nIdx++;
                }

                this.bgmTimers.push(setTimeout(scheduleTrack, 25));
            };
            scheduleTrack();
            return t;
        };

        this.bgmTimers = [];

        // モバイル判定（簡易）
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        // モバイルの場合は発音数を制限
        const trackLimit = isMobile ? 1 : 2; // モバイルはリードのみ、PCはベースも

        // Start Sequencing
        // No intro this time, straight to loop
        runTrack('lead', loopMelody, this.ctx.currentTime + 0.1, true);

        if (!isMobile) {
            runTrack('bass', loopBass, this.ctx.currentTime + 0.1, true);
        } else {
            console.log('Mobile mode: Bass track disabled for performance');
        }
    }

    playGameOverBGM() {
        // Lavender Town Style (Sad, creepy, slow)
        const tempo = 100;
        const beatTime = 60 / tempo;

        // Simple sad melody (C Minor)
        // C, G, F#, F ...
        const melody = [
            { n: 'C', o: 5, l: 1.0 }, { n: 'G', o: 4, l: 1.0 }, { n: 'F#', o: 4, l: 1.0 }, { n: 'F', o: 4, l: 1.0 },
            { n: 'C', o: 5, l: 1.0 }, { n: 'G', o: 4, l: 1.0 }, { n: 'F#', o: 4, l: 1.0 }, { n: 'F', o: 4, l: 1.0 },

            // High part
            { n: 'C', o: 6, l: 0.5 }, { n: 'B', o: 5, l: 0.5 }, { n: 'C', o: 6, l: 0.5 }, { n: 'G', o: 5, l: 0.5 },
            { n: 'F#', o: 5, l: 2.0 }
        ];

        const bass = [
            { n: 'C', o: 3, l: 4.0 },
            { n: 'C', o: 3, l: 4.0 },
            { n: 'F', o: 2, l: 2.0 }, { n: 'G', o: 2, l: 2.0 }
        ];

        const runTrack = (trackId, notes, startTime, loop) => {
            let nIdx = 0;
            let t = startTime;

            const scheduleTrack = () => {
                if (!this.isPlaying) return;
                while (t < this.ctx.currentTime + 0.1) {
                    if (nIdx >= notes.length) {
                        if (loop) nIdx = 0; else return;
                    }

                    const note = notes[nIdx];
                    const dur = note.l * beatTime;

                    let type = 'sine';
                    let vol = this.bgmVolume * 0.8;

                    if (trackId === 'lead') {
                        type = 'triangle';
                        vol = this.bgmVolume * 0.6;
                    }

                    if (note.n !== 'R') {
                        this.playToneAt(this.getFreq(note.n, note.o), type, t, dur * 0.9, vol);
                    }

                    t += dur;
                    nIdx++;
                }
                this.bgmTimers.push(setTimeout(scheduleTrack, 50));
            };
            scheduleTrack();
        };

        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        this.bgmTimers = [];
        runTrack('lead', melody, this.ctx.currentTime + 0.1, true);

        if (!isMobile) {
            runTrack('bass', bass, this.ctx.currentTime + 0.1, true);
        }
    }

    playTitleBGM() {
        // Littleroot Town Style (Relaxed, Home, Warm)
        // Key: F Major (Simple, happy)
        // Tempo: Slow (~104 BPM)
        const tempo = 104;
        const beatTime = 60 / tempo;

        // Instruments:
        // Lead: Sine/Triangle (Flute-like)
        // Bass: Sine (Soft)

        // Melody A (Simple rising phrase)
        // F, G, A... C...
        const melody = [
            // Bar 1
            { n: 'F', o: 4, l: 0.5 }, { n: 'G', o: 4, l: 0.5 }, { n: 'A', o: 4, l: 0.5 }, { n: 'C', o: 5, l: 0.5 },
            { n: 'F', o: 5, l: 1.5 }, { n: 'D', o: 5, l: 0.5 },
            // Bar 2
            { n: 'C', o: 5, l: 1.5 }, { n: 'A', o: 4, l: 0.5 }, { n: 'F', o: 4, l: 1.0 }, { n: 'G', o: 4, l: 1.0 },
            // Bar 3
            { n: 'A', o: 4, l: 0.5 }, { n: 'A#', o: 4, l: 0.5 }, { n: 'C', o: 5, l: 0.5 }, { n: 'F', o: 5, l: 0.5 },
            { n: 'E', o: 5, l: 1.5 }, { n: 'D', o: 5, l: 0.5 },
            // Bar 4
            { n: 'C', o: 5, l: 1.5 }, { n: 'A#', o: 4, l: 0.5 }, { n: 'A', o: 4, l: 1.0 }, { n: 'G', o: 4, l: 1.0 },
        ];

        // Bass (Walking gently)
        // F... C...
        const bass = [
            // Bar 1 (F)
            { n: 'F', o: 3, l: 1.0 }, { n: 'C', o: 3, l: 1.0 }, { n: 'F', o: 3, l: 1.0 }, { n: 'A', o: 3, l: 1.0 },
            // Bar 2 (F -> C7)
            { n: 'F', o: 3, l: 1.0 }, { n: 'C', o: 4, l: 1.0 }, { n: 'C', o: 3, l: 1.0 }, { n: 'E', o: 3, l: 1.0 },
            // Bar 3 (F)
            { n: 'F', o: 3, l: 1.0 }, { n: 'C', o: 3, l: 1.0 }, { n: 'F', o: 3, l: 1.0 }, { n: 'A', o: 3, l: 1.0 },
            // Bar 4 (C)
            { n: 'C', o: 3, l: 1.0 }, { n: 'G', o: 3, l: 1.0 }, { n: 'C', o: 3, l: 2.0 },
        ];

        const runTrack = (trackId, notes, startTime, loop) => {
            let nIdx = 0;
            let t = startTime;

            const scheduleTrack = () => {
                if (!this.isPlaying) return;
                while (t < this.ctx.currentTime + 0.1) {
                    if (nIdx >= notes.length) {
                        if (loop) nIdx = 0; else return;
                    }

                    const note = notes[nIdx];
                    const dur = note.l * beatTime;

                    let type = 'sine';
                    let vol = this.bgmVolume * 0.7; // Softer

                    if (trackId === 'lead') {
                        type = 'triangle'; // Flute-ish
                        vol = this.bgmVolume * 0.5;
                        // Little filtering for softness (simulated by low type)
                    }

                    if (note.n !== 'R') {
                        // Envelope: Slower attack/release for legato feel
                        this.playToneAt(this.getFreq(note.n, note.o), type, t, dur * 0.95, vol);
                    }

                    t += dur;
                    nIdx++;
                }
                this.bgmTimers.push(setTimeout(scheduleTrack, 50));
            };
            scheduleTrack();
        };

        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        this.bgmTimers = [];
        runTrack('lead', melody, this.ctx.currentTime + 0.1, true);

        if (!isMobile) {
            runTrack('bass', bass, this.ctx.currentTime + 0.1, true);
        }
    }

    playTone(freq, type, duration, volume) {
        this.playToneAt(freq, type, this.ctx.currentTime, duration, volume);
    }

    playToneAt(freq, type, time, duration, volume) {
        if (freq <= 0) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.value = freq;

        gain.gain.setValueAtTime(volume, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + duration - 0.05);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(time);
        osc.stop(time + duration);

        this.currentBgmNodes.push(osc);
        // クリーンアップは実際はonendedで配列から消すべきだが省略
    }

    playNoiseAt(time, duration, volume) {
        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(volume, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + duration); // 減衰を急に

        noise.connect(gain);
        gain.connect(this.masterGain);

        noise.start(time);
    }

    stopBGM() {
        this.isPlaying = false;
        if (this.bgmTimer) clearTimeout(this.bgmTimer);
        if (this.bgmTimers) {
            this.bgmTimers.forEach(t => clearTimeout(t));
        }
        this.bgmTimers = [];

        this.currentBgmNodes.forEach(node => {
            try { node.stop(); } catch (e) { }
        });

    }

    pauseBGM() {
        if (this.ctx && this.ctx.state === 'running') {
            this.ctx.suspend();
        }
    }

    resumeBGM() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    /**
     * 効果音再生
     */
    playSE(name) {
        this.init();
        if (this.isMuted) return;

        const t = this.ctx.currentTime;

        switch (name) {
            case 'se_hit': // 敵に当たった音（低いノイズ混じり）
                this.playNoiseAt(t, 0.1, this.seVolume);
                break;

            case 'se_player_damage': // プレイヤー被弾（下降音）
                this.playSweep(t, 'square', 400, 100, 0.3, this.seVolume);
                break;

            case 'se_enemy_death': // 敵撃破（崩れるような音）
                this.playNoiseAt(t, 0.2, this.seVolume * 0.8);
                break;

            case 'se_levelup': // レベルアップ（ファンファーレ的アルペジオ）
                this.playToneAt(this.getFreq('C', 5), 'square', t, 0.1, this.seVolume);
                this.playToneAt(this.getFreq('E', 5), 'square', t + 0.1, 0.1, this.seVolume);
                this.playToneAt(this.getFreq('G', 5), 'square', t + 0.2, 0.1, this.seVolume);
                this.playToneAt(this.getFreq('C', 6), 'square', t + 0.3, 0.4, this.seVolume);
                break;

            case 'se_shot': // 発射音（ピシュッ）
            case 'se_pickup':
                this.playSweep(t, 'triangle', 800, 100, 0.1, this.seVolume * 0.5);
                break;

            default: // 汎用
                this.playSweep(t, 'square', 440, 0, 0.1, this.seVolume);
                break;
        }
    }

    playSweep(time, type, startFreq, endFreq, duration, volume) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(startFreq, time);
        osc.frequency.exponentialRampToValueAtTime(endFreq > 0 ? endFreq : 0.01, time + duration);

        gain.gain.setValueAtTime(volume, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + duration);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(time);
        osc.stop(time + duration);
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.isMuted) {
            this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
        } else {
            this.masterGain.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime); // Use masterVolume
        }
        return this.isMuted;
    }

    setVolume(value) {
        this.masterVolume = Math.max(0, Math.min(1, value));
        if (this.masterGain) {
            this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVolume, this.ctx.currentTime);
        }
    }
}

// グローバルインスタンス
const soundManager = new SoundManager();
