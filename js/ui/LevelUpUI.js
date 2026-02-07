/**
 * レベルアップUI
 * レベルアップ時の強化選択画面
 */
class LevelUpUI {
    constructor() {
        this.container = document.getElementById('level-up-screen');
        this.optionsContainer = this.container.querySelector('.upgrade-options');

        // 利用可能なスキルプール
        this.skillPool = [
            { type: 'skill', class: ElectricShock, name: 'でんきショック', icon: '⚡', color: '#ffcc00' },
            { type: 'skill', class: BodySlam, name: 'のしかかり', icon: '💥', color: '#22aa88' },
            { type: 'skill', class: WaterGun, name: 'みずでっぽう', icon: '💧', color: '#44aadd' },
            { type: 'skill', class: LeafCutter, name: 'はっぱカッター', icon: '🍃', color: '#44ff44' },
            { type: 'skill', class: MagicalFlame, name: 'マジカルフレイム', icon: '🔥', color: '#ff6600' },
            { type: 'skill', class: Barrier, name: 'まもる', icon: '🛡️', color: '#aaddff' }
        ];

        this.passivePool = [
            { type: 'passive', name: 'こうそくいどう', icon: '👟', color: '#88ff88', description: '移動速度 +15%' },
            { type: 'passive', name: 'プラスパワー', icon: '💪', color: '#ff8888', description: '攻撃威力 +10%' },
            { type: 'passive', name: 'きずぐすり', icon: '🧪', color: '#44dd44', description: 'HP +20 回復' },
            { type: 'passive', name: 'エフェクトガード', icon: '⏱️', color: '#aa88ff', description: 'クールダウン -8%' }
        ];
    }

    show(player, onSelect) {
        this.container.classList.remove('hidden');
        this.optionsContainer.innerHTML = '';

        // ランダムに3つの選択肢を生成
        const options = this.generateOptions(player);

        for (const option of options) {
            const card = this.createCard(option, player);

            card.addEventListener('click', () => {
                this.hide();
                onSelect(option);
            });

            this.optionsContainer.appendChild(card);
        }
    }

    hide() {
        this.container.classList.add('hidden');
    }

    generateOptions(player) {
        const options = [];
        const availableOptions = [];

        // 既存スキルのアップグレードを追加
        for (const skill of player.skills) {
            if (skill.level < skill.maxLevel) {
                availableOptions.push({
                    type: 'upgrade',
                    skill: skill,
                    name: skill.name,
                    icon: skill.icon,
                    color: skill.color,
                    level: skill.level,
                    description: skill.getUpgradeDescription()
                });
            }
        }

        // 既存パッシブのアップグレードを追加
        for (const passive of player.passiveSkills) {
            if (passive.level < 5) {
                availableOptions.push({
                    type: 'passiveUpgrade',
                    passive: passive,
                    name: passive.name,
                    icon: passive.icon,
                    color: passive.color,
                    level: passive.level,
                    description: this.getPassiveDescription(passive.name)
                });
            }
        }

        // 未取得スキルを追加
        for (const skillDef of this.skillPool) {
            const hasSkill = player.skills.some(s => s.name === skillDef.name);
            if (!hasSkill) {
                availableOptions.push({
                    type: 'newSkill',
                    skillClass: skillDef.class,
                    name: skillDef.name,
                    icon: skillDef.icon,
                    color: skillDef.color,
                    level: 0,
                    description: '新スキル獲得'
                });
            }
        }

        // 未取得パッシブを追加
        for (const passiveDef of this.passivePool) {
            const hasPassive = player.passiveSkills.some(p => p.name === passiveDef.name);
            if (!hasPassive) {
                availableOptions.push({
                    type: 'newPassive',
                    name: passiveDef.name,
                    icon: passiveDef.icon,
                    color: passiveDef.color,
                    level: 0,
                    description: passiveDef.description
                });
            }
        }

        // ランダムに3つ選択
        const shuffled = availableOptions.sort(() => Math.random() - 0.5);
        return shuffled.slice(0, 3);
    }

    createCard(option, player) {
        const card = document.createElement('div');
        card.className = 'upgrade-card';

        const levelText = option.level > 0 ? `Lv.${option.level} → Lv.${option.level + 1}` : 'NEW!';

        card.innerHTML = `
            <div class="icon" style="background: ${option.color}; font-size: 28px;">
                ${option.icon}
            </div>
            <div class="name">${option.name}</div>
            <div class="level">${levelText}</div>
            <div class="description">${option.description}</div>
        `;

        return card;
    }

    getPassiveDescription(name) {
        switch (name) {
            case 'こうそくいどう': return '移動速度 +15%';
            case 'プラスパワー': return '攻撃威力 +10%';
            case 'きずぐすり': return 'HP +20 回復';
            case 'エフェクトガード': return 'クールダウン -8%';
            default: return '';
        }
    }
}
