import React, { useState, useEffect, useMemo } from 'react';
import {
  Play,
  Square,
  Undo2,
  Redo2,
  Save,
  Trash2,
  Plus,
  Sparkles,
  Code2,
  ArrowUp,
  ArrowDown,
  HelpCircle,
  CheckCircle2,
  Circle,
  Trophy,
  Star,
  Zap,
  Target,
  Compass,
  RotateCcw,
  BookOpen,
  Volume2,
  ChevronRight,
  Award
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  BlockCategory,
  CodeBlockTemplate,
  WorkspaceBlock,
  CodingProject,
  StudioDifficulty,
  StudioAlgorithmChallenge,
  StudioChallengeCriterion
} from '../../types';
import { CODE_BLOCK_TEMPLATES } from '../../data/mockData';
import { STUDIO_CHALLENGES, DIFFICULTY_CONFIG } from '../../data/studioChallenges';
import { audioService } from '../../utils/audio';
import { OfflineBanner } from '../common/OfflineBanner';

export const CodingStudio: React.FC = () => {
  const { currentUser, saveProject, triggerKobiSpeech, awardChallengeBonus } = useApp();

  // Initial difficulty based on student's grade
  const initialDifficulty: StudioDifficulty = useMemo(() => {
    if (currentUser?.grade <= 2) return 'easy';
    if (currentUser?.grade <= 4) return 'medium';
    return 'hard';
  }, [currentUser?.grade]);

  // Mode & Difficulty State
  const [difficulty, setDifficulty] = useState<StudioDifficulty>(initialDifficulty);
  const [isChallengeMode, setIsChallengeMode] = useState<boolean>(true);
  const [activeCategory, setActiveCategory] = useState<BlockCategory>('motion');
  const [projectTitle, setProjectTitle] = useState<string>('Petualangan Algoritma Kobi');

  // Filter challenges based on selected difficulty
  const currentChallenges = useMemo(() => {
    return STUDIO_CHALLENGES.filter(c => c.difficulty === difficulty);
  }, [difficulty]);

  const [activeChallengeId, setActiveChallengeId] = useState<string>(
    STUDIO_CHALLENGES.find(c => c.difficulty === initialDifficulty)?.id || 'ch-easy-1'
  );

  const activeChallenge: StudioAlgorithmChallenge = useMemo(() => {
    return (
      STUDIO_CHALLENGES.find(c => c.id === activeChallengeId) ||
      currentChallenges[0] ||
      STUDIO_CHALLENGES[0]
    );
  }, [activeChallengeId, currentChallenges]);

  // Completed challenges tracking (persisted in local state)
  const [completedChallenges, setCompletedChallenges] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('codenusa_completed_challenges');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Success Celebration Modal State
  const [showCelebration, setShowCelebration] = useState<boolean>(false);
  const [lastCompletedChallenge, setLastCompletedChallenge] = useState<StudioAlgorithmChallenge | null>(null);

  // Workspace blocks state with Undo / Redo history
  const [workspaceBlocks, setWorkspaceBlocks] = useState<WorkspaceBlock[]>(() => {
    return (
      activeChallenge?.starterBlocks || [
        {
          instanceId: 'wb-flag',
          templateId: 'blk-when-flag-clicked',
          opcode: 'event_whenflagclicked',
          category: 'events',
          name: 'ketika ⚑ diklik',
          shape: 'cap',
          params: {}
        },
        {
          instanceId: 'wb-move1',
          templateId: 'blk-move',
          opcode: 'motion_movesteps',
          category: 'motion',
          name: 'gerak [STEPS] langkah',
          shape: 'notch',
          params: { STEPS: 25 }
        },
        {
          instanceId: 'wb-say1',
          templateId: 'blk-say-for-sec',
          opcode: 'looks_sayforsecs',
          category: 'looks',
          name: 'katakan [MESSAGE] selama [SECS] detik',
          shape: 'notch',
          params: { MESSAGE: 'Halo Sahabat Coder!', SECS: 2 }
        }
      ]
    );
  });

  const [history, setHistory] = useState<WorkspaceBlock[][]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Stage Simulation State
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [activeBlockIndex, setActiveBlockIndex] = useState<number | null>(null);
  const [spriteState, setSpriteState] = useState({
    x: 0,
    y: 0,
    size: 100,
    direction: 0,
    sayingText: '',
    spriteType: 'kobi' as 'kobi' | 'cat' | 'rocket'
  });
  const [activeTab, setActiveTab] = useState<'blocks' | 'code'>('blocks');

  // Push new state to history
  const updateWorkspaceWithHistory = (newBlocks: WorkspaceBlock[]) => {
    setHistory(prev => [...prev.slice(0, historyIndex + 1), workspaceBlocks]);
    setHistoryIndex(prev => prev + 1);
    setWorkspaceBlocks(newBlocks);
  };

  const handleUndo = () => {
    if (historyIndex >= 0 && history[historyIndex]) {
      audioService.playSnapSound();
      const previousState = history[historyIndex];
      setHistoryIndex(prev => prev - 1);
      setWorkspaceBlocks(previousState);
    }
  };

  const handleRedo = () => {
    if (historyIndex + 1 < history.length) {
      audioService.playSnapSound();
      const nextState = history[historyIndex + 1];
      setHistoryIndex(prev => prev + 1);
      setWorkspaceBlocks(nextState);
    }
  };

  // Change difficulty handler
  const handleSelectDifficulty = (newDiff: StudioDifficulty) => {
    audioService.playSnapSound();
    setDifficulty(newDiff);
    const firstChallenge = STUDIO_CHALLENGES.find(c => c.difficulty === newDiff);
    if (firstChallenge) {
      setActiveChallengeId(firstChallenge.id);
      if (firstChallenge.starterBlocks) {
        updateWorkspaceWithHistory(firstChallenge.starterBlocks);
      }
    }
    const diffInfo = DIFFICULTY_CONFIG[newDiff];
    triggerKobiSpeech(
      `Tingkat kesulitan diubah ke ${diffInfo.label} (${diffInfo.levelName}). ${diffInfo.description}`,
      'happy',
      true
    );
  };

  // Switch challenge within current difficulty
  const handleSelectChallenge = (challenge: StudioAlgorithmChallenge) => {
    audioService.playSnapSound();
    setActiveChallengeId(challenge.id);
    setProjectTitle(`Tantangan: ${challenge.title}`);
    if (challenge.starterBlocks) {
      updateWorkspaceWithHistory(challenge.starterBlocks);
    }
    triggerKobiSpeech(
      `Tantangan "${challenge.title}" dipilih! Fokus konsep: ${challenge.conceptFocus}.`,
      'happy',
      true
    );
  };

  // Load challenge starter code
  const handleLoadStarterCode = () => {
    if (activeChallenge?.starterBlocks) {
      audioService.playSnapSound();
      updateWorkspaceWithHistory(activeChallenge.starterBlocks);
      triggerKobiSpeech('Template blok kode awal berhasil dimuat kembali!', 'happy', true);
    }
  };

  // Request Hint from Kobi
  const handleRequestHint = () => {
    audioService.playSuccessSound();
    triggerKobiSpeech(`💡 Petunjuk Kobi: ${activeChallenge.hint}`, 'happy', true);
  };

  // Real-time criteria verification
  const criteriaStatus = useMemo(() => {
    if (!isChallengeMode || !activeChallenge) return [];

    return activeChallenge.criteria.map(crit => {
      let isMet = false;
      switch (crit.check) {
        case 'min_blocks':
          isMet = workspaceBlocks.length >= Number(crit.param || 1);
          break;
        case 'has_opcode':
          isMet = workspaceBlocks.some(b => b.opcode === crit.param);
          break;
        case 'has_speech':
          isMet = workspaceBlocks.some(b => b.opcode === 'looks_sayforsecs');
          break;
        case 'has_sound':
          isMet = workspaceBlocks.some(b => b.opcode === 'sound_play');
          break;
        case 'has_rotation':
          isMet = workspaceBlocks.some(
            b => b.opcode === 'motion_turnright' || b.opcode === 'motion_turnleft'
          );
          break;
        case 'has_coordinate':
          isMet = workspaceBlocks.some(b => b.opcode === 'motion_gotoxy');
          break;
        case 'has_size_change':
          isMet = workspaceBlocks.some(b => b.opcode === 'looks_changesizeby');
          break;
        case 'has_wait':
          isMet = workspaceBlocks.some(b => b.opcode === 'control_wait');
          break;
        default:
          isMet = true;
      }
      return {
        ...crit,
        isMet
      };
    });
  }, [isChallengeMode, activeChallenge, workspaceBlocks]);

  const allCriteriaMet = useMemo(() => {
    return criteriaStatus.length > 0 && criteriaStatus.every(c => c.isMet);
  }, [criteriaStatus]);

  const categories: { id: BlockCategory; label: string; color: string; bg: string }[] = [
    { id: 'motion', label: 'Gerakan', color: '#0058be', bg: 'bg-blue-500' },
    { id: 'looks', label: 'Tampilan', color: '#6b38d4', bg: 'bg-purple-600' },
    { id: 'sound', label: 'Suara', color: '#00855b', bg: 'bg-emerald-600' },
    { id: 'events', label: 'Kejadian', color: '#f59e0b', bg: 'bg-amber-500' },
    { id: 'control', label: 'Kontrol', color: '#ea580c', bg: 'bg-orange-600' }
  ];

  const filteredTemplates = CODE_BLOCK_TEMPLATES.filter(b => b.category === activeCategory);

  const addBlockToWorkspace = (template: CodeBlockTemplate) => {
    audioService.playSnapSound();
    const newBlock: WorkspaceBlock = {
      instanceId: `wb-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      templateId: template.id,
      opcode: template.opcode,
      category: template.category,
      name: template.name,
      shape: template.shape,
      params: { ...template.defaultParams }
    };
    updateWorkspaceWithHistory([...workspaceBlocks, newBlock]);
  };

  const removeBlock = (instanceId: string) => {
    audioService.playSnapSound();
    updateWorkspaceWithHistory(workspaceBlocks.filter(b => b.instanceId !== instanceId));
  };

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    if (index === 0 && workspaceBlocks[0].opcode === 'event_whenflagclicked') return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 1 || targetIndex >= workspaceBlocks.length) return;

    audioService.playSnapSound();
    const copy = [...workspaceBlocks];
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;
    updateWorkspaceWithHistory(copy);
  };

  const updateBlockParam = (instanceId: string, paramKey: string, value: string | number) => {
    const updated = workspaceBlocks.map(b => {
      if (b.instanceId === instanceId) {
        return {
          ...b,
          params: { ...b.params, [paramKey]: value }
        };
      }
      return b;
    });
    setWorkspaceBlocks(updated);
  };

  const clearWorkspace = () => {
    audioService.playSnapSound();
    updateWorkspaceWithHistory([
      {
        instanceId: 'wb-flag',
        templateId: 'blk-when-flag-clicked',
        opcode: 'event_whenflagclicked',
        category: 'events',
        name: 'ketika ⚑ diklik',
        shape: 'cap',
        params: {}
      }
    ]);
  };

  // Run the code blocks on the Sprite Simulator safely
  const runCode = async (slowMode: boolean = false) => {
    if (isRunning) return;
    setIsRunning(true);
    audioService.playSuccessSound();

    // Reset initial sprite position
    setSpriteState(prev => ({
      ...prev,
      x: 0,
      y: 0,
      size: 100,
      direction: 0,
      sayingText: ''
    }));

    const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

    for (let i = 0; i < workspaceBlocks.length; i++) {
      setActiveBlockIndex(i);
      const block = workspaceBlocks[i];

      if (block.opcode === 'motion_movesteps') {
        const steps = Number(block.params.STEPS || 10);
        setSpriteState(prev => ({
          ...prev,
          x: Math.max(-130, Math.min(130, prev.x + steps * 1.5))
        }));
      } else if (block.opcode === 'motion_turnright') {
        const deg = Number(block.params.DEGREES || 15);
        setSpriteState(prev => ({ ...prev, direction: (prev.direction + deg) % 360 }));
      } else if (block.opcode === 'motion_turnleft') {
        const deg = Number(block.params.DEGREES || 15);
        setSpriteState(prev => ({ ...prev, direction: (prev.direction - deg + 360) % 360 }));
      } else if (block.opcode === 'motion_gotoxy') {
        const nx = Math.max(-130, Math.min(130, Number(block.params.X || 0)));
        const ny = Math.max(-100, Math.min(100, Number(block.params.Y || 0)));
        setSpriteState(prev => ({ ...prev, x: nx, y: ny }));
      } else if (block.opcode === 'looks_sayforsecs') {
        const msg = String(block.params.MESSAGE || 'Halo!');
        const secs = Math.min(5, Math.max(1, Number(block.params.SECS || 2)));
        setSpriteState(prev => ({ ...prev, sayingText: msg }));
        audioService.speakText(msg);
        await delay(secs * 1000);
        setSpriteState(prev => ({ ...prev, sayingText: '' }));
      } else if (block.opcode === 'looks_changesizeby') {
        const sz = Number(block.params.SIZE || 10);
        setSpriteState(prev => ({ ...prev, size: Math.max(50, Math.min(160, prev.size + sz)) }));
      } else if (block.opcode === 'sound_play') {
        audioService.playCoinSound();
      } else if (block.opcode === 'control_wait') {
        const secs = Math.min(4, Math.max(0.5, Number(block.params.SECS || 1)));
        await delay(secs * 1000);
      }

      await delay(slowMode ? 700 : 350);
    }

    setActiveBlockIndex(null);
    setIsRunning(false);

    // Evaluate challenge completion
    if (isChallengeMode && activeChallenge) {
      if (allCriteriaMet) {
        if (!completedChallenges.includes(activeChallenge.id)) {
          const updated = [...completedChallenges, activeChallenge.id];
          setCompletedChallenges(updated);
          try {
            localStorage.setItem('codenusa_completed_challenges', JSON.stringify(updated));
          } catch {
            // ignore
          }
          awardChallengeBonus(
            activeChallenge.id,
            activeChallenge.title,
            activeChallenge.rewardStars,
            activeChallenge.rewardXp
          );
        } else {
          audioService.playFanfare();
        }
        setLastCompletedChallenge(activeChallenge);
        setShowCelebration(true);
      } else {
        const uncompletedCount = criteriaStatus.filter(c => !c.isMet).length;
        triggerKobiSpeech(
          `Hampir berhasil! Masih ada ${uncompletedCount} syarat algoritma yang belum terpenuhi. Periksa daftar checklist di atas ya!`,
          'happy',
          true
        );
      }
    }
  };

  const stopCode = () => {
    setIsRunning(false);
    setActiveBlockIndex(null);
    setSpriteState(prev => ({ ...prev, sayingText: '' }));
    audioService.stopSpeaking();
  };

  const handleSave = () => {
    const newProj: CodingProject = {
      id: `proj-${Date.now()}`,
      title: projectTitle,
      description: `Proyek kreasi dengan ${workspaceBlocks.length} blok pada tingkat ${DIFFICULTY_CONFIG[difficulty].label}.`,
      authorId: currentUser.id,
      authorName: currentUser.name,
      grade: currentUser.grade,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      blocks: workspaceBlocks,
      sprite: {
        name: 'Kobi',
        type: spriteState.spriteType,
        x: spriteState.x,
        y: spriteState.y,
        size: spriteState.size,
        direction: spriteState.direction,
        visible: true
      },
      stageBackground: 'grid'
    };
    saveProject(newProj);
    audioService.playSuccessSound();
  };

  // Generate clean JavaScript code string
  const generateCodeText = () => {
    return `// Kode Algoritma: ${projectTitle}
// Tingkat Kesulitan: ${DIFFICULTY_CONFIG[difficulty].label} (${DIFFICULTY_CONFIG[difficulty].levelName})
// Pembuat: ${currentUser.name} (${currentUser.school})

async function jalankanAlgoritma() {
${workspaceBlocks
  .map(b => {
    if (b.opcode === 'event_whenflagclicked') return '  // 🚩 Ketika Tombol Bendera Hijau Diklik';
    if (b.opcode === 'motion_movesteps') return `  await sprite.gerak(${b.params.STEPS || 10});`;
    if (b.opcode === 'motion_turnright') return `  await sprite.putarKanan(${b.params.DEGREES || 15});`;
    if (b.opcode === 'motion_turnleft') return `  await sprite.putarKiri(${b.params.DEGREES || 15});`;
    if (b.opcode === 'motion_gotoxy') return `  await sprite.pergiKe(${b.params.X || 0}, ${b.params.Y || 0});`;
    if (b.opcode === 'looks_sayforsecs') return `  await sprite.katakan("${b.params.MESSAGE || 'Halo'}", ${b.params.SECS || 2});`;
    if (b.opcode === 'looks_changesizeby') return `  await sprite.ubahUkuran(${b.params.SIZE || 10});`;
    if (b.opcode === 'sound_play') return `  await audio.mainkanSuara("${b.params.SOUND || 'Chime'}");`;
    if (b.opcode === 'control_wait') return `  await jedaWaktu(${b.params.SECS || 1});`;
    if (b.opcode === 'control_repeat') return `  for (let i = 0; i < ${b.params.TIMES || 4}; i++) { /* ulangi aksi */ }`;
    return `  // ${b.name}`;
  })
  .join('\n')}
}

jalankanAlgoritma();`;
  };

  const diffConfig = DIFFICULTY_CONFIG[difficulty];

  return (
    <div className="space-y-6 pb-20 animate-in fade-in">
      {/* Offline Banner Notification */}
      <OfflineBanner />

      {/* ========================================================================= */}
      {/* 1. DIFFICULTY SELECTOR & STUDIO HEADER BAR                                */}
      {/* ========================================================================= */}
      <div className="bg-white p-5 rounded-3xl border border-[#e1e2ec] shadow-sm space-y-4">
        {/* Top Row: Title, Mode Toggle & Action Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Project Title & Studio Icon */}
          <div className="flex items-center gap-3 flex-1 max-w-lg">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#0058be] to-purple-600 flex items-center justify-center text-white text-2xl shadow-md shrink-0">
              🎨
            </div>
            <div className="flex-1 min-w-0">
              <input
                type="text"
                value={projectTitle}
                onChange={e => setProjectTitle(e.target.value)}
                className="font-['Plus_Jakarta_Sans'] font-extrabold text-lg sm:text-xl text-gray-900 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-[#0058be] focus:outline-none w-full truncate"
                placeholder="Nama Proyek Koding"
              />
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-gray-400 font-semibold">Studio Koding CodeNusa</span>
                <span className="text-gray-300">•</span>
                <span
                  className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full border ${diffConfig.badgeBg}`}
                >
                  {diffConfig.icon} {diffConfig.label}
                </span>
              </div>
            </div>
          </div>

          {/* Action Controls & Mode Switch */}
          <div className="flex items-center flex-wrap gap-2.5">
            {/* Mode Switcher */}
            <div className="bg-[#f2f3fd] p-1 rounded-full border border-[#adc6ff] flex items-center">
              <button
                onClick={() => {
                  audioService.playSnapSound();
                  setIsChallengeMode(true);
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-extrabold transition-all flex items-center gap-1.5 ${
                  isChallengeMode
                    ? 'bg-[#0058be] text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Trophy className="w-3.5 h-3.5" />
                Tantangan Algoritma
              </button>
              <button
                onClick={() => {
                  audioService.playSnapSound();
                  setIsChallengeMode(false);
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-extrabold transition-all flex items-center gap-1.5 ${
                  !isChallengeMode
                    ? 'bg-[#0058be] text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Mode Bebas
              </button>
            </div>

            {/* Undo & Redo */}
            <div className="flex items-center gap-1 bg-[#f2f3fd] p-1 rounded-full border border-[#adc6ff]">
              <button
                onClick={handleUndo}
                disabled={historyIndex < 0}
                aria-label="Batalkan perubahan (Undo)"
                title="Undo"
                className="p-1.5 rounded-full text-gray-700 hover:bg-white disabled:opacity-40 disabled:hover:bg-transparent"
              >
                <Undo2 className="w-4 h-4" />
              </button>
              <button
                onClick={handleRedo}
                disabled={historyIndex + 1 >= history.length}
                aria-label="Ulangi perubahan (Redo)"
                title="Redo"
                className="p-1.5 rounded-full text-gray-700 hover:bg-white disabled:opacity-40 disabled:hover:bg-transparent"
              >
                <Redo2 className="w-4 h-4" />
              </button>
            </div>

            {/* Tab: Visual vs Raw Code */}
            <div className="bg-[#f2f3fd] p-1 rounded-full border border-[#adc6ff] flex items-center">
              <button
                onClick={() => setActiveTab('blocks')}
                className={`px-3 py-1.5 rounded-full text-xs font-extrabold transition-all ${
                  activeTab === 'blocks' ? 'bg-[#0058be] text-white shadow-sm' : 'text-gray-600'
                }`}
              >
                Blok Visual
              </button>
              <button
                onClick={() => setActiveTab('code')}
                className={`px-3 py-1.5 rounded-full text-xs font-extrabold transition-all flex items-center gap-1 ${
                  activeTab === 'code' ? 'bg-[#0058be] text-white shadow-sm' : 'text-gray-600'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                Kode Asli
              </button>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-[#00855b] hover:bg-[#006947] text-white font-extrabold text-xs sm:text-sm rounded-full tactile-btn shadow-md flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              Simpan
            </button>
          </div>
        </div>

        {/* --------------------------------------------------------------------- */}
        {/* Difficulty Level Option Segmented Cards (Mudah, Sedang, Sulit)        */}
        {/* --------------------------------------------------------------------- */}
        <div className="pt-2 border-t border-gray-100">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold text-gray-700 uppercase tracking-wider">
                Pilih Tingkat Kesulitan Algoritma:
              </span>
              <span className="text-[11px] text-gray-400 font-medium">
                (Disesuaikan dengan jenjang pemahaman murid)
              </span>
            </div>

            <div className="text-xs font-bold text-gray-500 flex items-center gap-1.5">
              <span>Selesai:</span>
              <span className="font-extrabold text-[#0058be]">
                {completedChallenges.length} dari {STUDIO_CHALLENGES.length} Tantangan
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {(['easy', 'medium', 'hard'] as StudioDifficulty[]).map(diffKey => {
              const cfg = DIFFICULTY_CONFIG[diffKey];
              const isSelected = difficulty === diffKey;
              const challengeCount = STUDIO_CHALLENGES.filter(c => c.difficulty === diffKey).length;
              const completedCount = STUDIO_CHALLENGES.filter(
                c => c.difficulty === diffKey && completedChallenges.includes(c.id)
              ).length;

              return (
                <div
                  key={diffKey}
                  onClick={() => handleSelectDifficulty(diffKey)}
                  className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all duration-200 flex flex-col justify-between ${
                    isSelected
                      ? cfg.activeBorder
                      : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50/70'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{cfg.icon}</span>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-extrabold text-sm text-gray-900">{cfg.label}</h4>
                          <span className="text-[10px] font-bold text-gray-400">
                            ({cfg.recommendedGrades})
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500 font-medium">{cfg.levelName}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                          completedCount === challengeCount
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : 'bg-gray-100 text-gray-600 border-gray-200'
                        }`}
                      >
                        {completedCount}/{challengeCount} Selesai
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-gray-600 leading-relaxed mb-2 line-clamp-2">
                    {cfg.description}
                  </p>

                  <div className="flex flex-wrap gap-1 mt-auto pt-1">
                    {cfg.targetConcepts.map(c => (
                      <span
                        key={c}
                        className="text-[10px] bg-white/80 border border-gray-200 text-gray-600 px-1.5 py-0.5 rounded-md font-semibold"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* --------------------------------------------------------------------- */}
        {/* Active Challenges Selector within the selected difficulty             */}
        {/* --------------------------------------------------------------------- */}
        {isChallengeMode && (
          <div className="pt-3 border-t border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-600">
                Pilih Misi Tantangan ({diffConfig.label}):
              </span>
              <span className="text-[11px] text-[#0058be] font-bold">
                ⭐ Dapatkan Bintang & XP setelah menjalankan program dengan benar!
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {currentChallenges.map((ch, idx) => {
                const isActive = ch.id === activeChallenge.id;
                const isCompleted = completedChallenges.includes(ch.id);

                return (
                  <button
                    key={ch.id}
                    onClick={() => handleSelectChallenge(ch)}
                    className={`p-3 rounded-2xl border text-left transition-all relative flex items-start gap-2.5 ${
                      isActive
                        ? 'border-[#0058be] bg-[#f2f6ff] ring-2 ring-[#adc6ff] shadow-sm'
                        : 'border-gray-200 hover:border-gray-300 bg-gray-50/50 hover:bg-white'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-extrabold shrink-0 mt-0.5 ${
                        isCompleted
                          ? 'bg-emerald-500 text-white'
                          : isActive
                          ? 'bg-[#0058be] text-white'
                          : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {isCompleted ? '✓' : idx + 1}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className="font-extrabold text-xs text-gray-900 truncate">{ch.title}</p>
                      </div>
                      <p className="text-[10px] text-gray-500 font-medium truncate mt-0.5">
                        {ch.conceptFocus}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-extrabold text-amber-600 flex items-center gap-0.5">
                          <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />+
                          {ch.rewardStars}
                        </span>
                        <span className="text-[10px] font-extrabold text-[#0058be] flex items-center gap-0.5">
                          <Zap className="w-2.5 h-2.5" />+{ch.rewardXp} XP
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. ACTIVE CHALLENGE BRIEF & VERIFICATION CHECKLIST (If Challenge Mode)    */}
      {/* ========================================================================= */}
      {isChallengeMode && activeChallenge && (
        <div
          className={`p-4 sm:p-5 rounded-3xl border-2 shadow-sm transition-all ${
            allCriteriaMet
              ? 'bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-200'
              : 'bg-white border-[#adc6ff]'
          }`}
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Left: Challenge Title, Goal, & Concept */}
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${diffConfig.badgeBg}`}
                >
                  {diffConfig.icon} {diffConfig.label}
                </span>
                <span className="text-xs font-extrabold text-[#0058be] bg-[#d8e2ff] px-2.5 py-0.5 rounded-full">
                  {activeChallenge.badgeLabel}
                </span>
                {completedChallenges.includes(activeChallenge.id) && (
                  <span className="text-xs font-extrabold text-emerald-700 bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Selesai Dikerjakan
                  </span>
                )}
              </div>

              <h3 className="font-['Plus_Jakarta_Sans'] font-extrabold text-base sm:text-lg text-gray-900">
                {activeChallenge.title}
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed font-medium">
                {activeChallenge.description}
              </p>
            </div>

            {/* Right Action buttons for template & hint */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleLoadStarterCode}
                className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
                title="Muat Ulang Template Awal"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Template Awal
              </button>

              <button
                onClick={handleRequestHint}
                className="px-3.5 py-2 bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors border border-amber-300"
              >
                <HelpCircle className="w-3.5 h-3.5 text-amber-700" />
                Petunjuk Kobi
              </button>
            </div>
          </div>

          {/* Criteria Checklist */}
          <div className="mt-4 pt-3 border-t border-gray-200/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-extrabold text-gray-700 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-[#0058be]" /> Syarat Algoritma (Verifikasi
                Otomatis):
              </span>
              <span
                className={`text-xs font-extrabold ${
                  allCriteriaMet ? 'text-emerald-700' : 'text-amber-700'
                }`}
              >
                {criteriaStatus.filter(c => c.isMet).length} dari {criteriaStatus.length} Syarat
                Terpenuhi
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {criteriaStatus.map(crit => (
                <div
                  key={crit.id}
                  className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all ${
                    crit.isMet
                      ? 'bg-emerald-100/70 border-emerald-300 text-emerald-900'
                      : 'bg-gray-50 border-gray-200 text-gray-600'
                  }`}
                >
                  {crit.isMet ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-gray-400 shrink-0" />
                  )}
                  <span className="text-[11px] font-bold leading-tight line-clamp-2">
                    {crit.description}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. MAIN STUDIO 3-COLUMN LAYOUT (Toolbox, Workspace, Simulator)             */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* --------------------------------------------------------------------- */}
        {/* Left Column: Block Palette & Categories (lg:col-span-3)               */}
        {/* --------------------------------------------------------------------- */}
        <div className="lg:col-span-3 bg-white rounded-3xl border border-[#e1e2ec] shadow-sm p-4 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <h3 className="font-bold text-sm text-gray-800">Kategori Blok</h3>
            <span className="text-[10px] text-gray-400 font-bold uppercase">Klik Tambah</span>
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-1.5">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => {
                  audioService.playSnapSound();
                  setActiveCategory(cat.id);
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                  activeCategory === cat.id
                    ? `${cat.bg} text-white shadow-sm scale-105`
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Block Palette List */}
          <div className="space-y-2.5 pt-2 max-h-[500px] overflow-y-auto pr-1">
            {filteredTemplates.map(template => (
              <div
                key={template.id}
                onClick={() => addBlockToWorkspace(template)}
                className="p-3 rounded-2xl text-white font-bold text-xs cursor-pointer shadow-md transition-all hover:scale-102 hover:shadow-lg flex items-center justify-between group active:scale-95 select-none"
                style={{ backgroundColor: template.color }}
              >
                <div className="flex items-center gap-2 truncate">
                  <span>
                    {template.category === 'motion'
                      ? '🏃'
                      : template.category === 'looks'
                      ? '💬'
                      : template.category === 'sound'
                      ? '🎵'
                      : template.category === 'events'
                      ? '🚩'
                      : '🔁'}
                  </span>
                  <span className="truncate">{template.name.replace(/\[.*?\]/g, '___')}</span>
                </div>
                <Plus className="w-4 h-4 opacity-0 group-hover:opacity-100 shrink-0 transition-opacity" />
              </div>
            ))}
          </div>
        </div>

        {/* --------------------------------------------------------------------- */}
        {/* Center Column: Workspace / Lembar Kerja (lg:col-span-5)               */}
        {/* --------------------------------------------------------------------- */}
        <div className="lg:col-span-5 bg-white rounded-3xl border-2 border-[#adc6ff] shadow-sm p-5 space-y-4 min-h-[540px] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-gray-800">Lembar Kerja Kode</span>
                <span className="text-xs bg-[#d8e2ff] text-[#0058be] px-2 py-0.5 rounded-full font-bold">
                  {workspaceBlocks.length} Blok
                </span>
              </div>
              <button
                onClick={clearWorkspace}
                className="text-xs text-red-500 hover:text-red-700 font-bold flex items-center gap-1 transition-colors"
                title="Kosongkan Lembar Kerja"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Hapus Semua
              </button>
            </div>

            {activeTab === 'blocks' ? (
              /* Block Stacking Workspace */
              <div className="space-y-2 bg-[#f9f9ff] p-4 rounded-2xl border border-dashed border-[#adc6ff] min-h-[400px]">
                {workspaceBlocks.map((b, idx) => {
                  const isActive = activeBlockIndex === idx;
                  return (
                    <div
                      key={b.instanceId}
                      className={`p-3 rounded-2xl font-bold text-xs text-white shadow-sm flex items-center justify-between gap-3 transition-all relative ${
                        isActive ? 'ring-4 ring-amber-400 scale-102 shadow-lg z-10' : ''
                      }`}
                      style={{
                        backgroundColor:
                          b.category === 'motion'
                            ? '#0058be'
                            : b.category === 'looks'
                            ? '#6b38d4'
                            : b.category === 'sound'
                            ? '#00855b'
                            : b.category === 'events'
                            ? '#f59e0b'
                            : '#ea580c'
                      }}
                    >
                      <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
                        <span>
                          {b.category === 'events'
                            ? '🚩'
                            : b.category === 'motion'
                            ? '🏃'
                            : b.category === 'looks'
                            ? '💬'
                            : b.category === 'sound'
                            ? '🎵'
                            : '🔁'}
                        </span>
                        <span className="truncate">{b.name.split('[')[0]}</span>

                        {/* Editable Parameter Inputs */}
                        {b.params.STEPS !== undefined && (
                          <input
                            type="number"
                            value={b.params.STEPS}
                            onChange={e =>
                              updateBlockParam(b.instanceId, 'STEPS', Number(e.target.value))
                            }
                            className="w-14 px-2 py-0.5 bg-white text-gray-900 rounded-lg text-xs font-bold text-center focus:outline-none shadow-inner"
                          />
                        )}
                        {b.params.X !== undefined && (
                          <div className="flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded-lg">
                            <span className="text-[10px]">X:</span>
                            <input
                              type="number"
                              value={b.params.X}
                              onChange={e =>
                                updateBlockParam(b.instanceId, 'X', Number(e.target.value))
                              }
                              className="w-12 px-1 py-0.5 bg-white text-gray-900 rounded text-xs font-bold text-center focus:outline-none"
                            />
                            <span className="text-[10px] ml-1">Y:</span>
                            <input
                              type="number"
                              value={b.params.Y}
                              onChange={e =>
                                updateBlockParam(b.instanceId, 'Y', Number(e.target.value))
                              }
                              className="w-12 px-1 py-0.5 bg-white text-gray-900 rounded text-xs font-bold text-center focus:outline-none"
                            />
                          </div>
                        )}
                        {b.params.MESSAGE !== undefined && (
                          <input
                            type="text"
                            value={b.params.MESSAGE}
                            onChange={e => updateBlockParam(b.instanceId, 'MESSAGE', e.target.value)}
                            className="px-2.5 py-0.5 bg-white text-gray-900 rounded-lg text-xs font-bold focus:outline-none max-w-[130px] shadow-inner"
                          />
                        )}
                        {b.params.DEGREES !== undefined && (
                          <input
                            type="number"
                            value={b.params.DEGREES}
                            onChange={e =>
                              updateBlockParam(b.instanceId, 'DEGREES', Number(e.target.value))
                            }
                            className="w-14 px-2 py-0.5 bg-white text-gray-900 rounded-lg text-xs font-bold text-center focus:outline-none shadow-inner"
                          />
                        )}
                        {b.params.SIZE !== undefined && (
                          <input
                            type="number"
                            value={b.params.SIZE}
                            onChange={e =>
                              updateBlockParam(b.instanceId, 'SIZE', Number(e.target.value))
                            }
                            className="w-14 px-2 py-0.5 bg-white text-gray-900 rounded-lg text-xs font-bold text-center focus:outline-none shadow-inner"
                          />
                        )}
                        {b.params.SECS !== undefined && (
                          <input
                            type="number"
                            value={b.params.SECS}
                            onChange={e =>
                              updateBlockParam(b.instanceId, 'SECS', Number(e.target.value))
                            }
                            className="w-12 px-2 py-0.5 bg-white text-gray-900 rounded-lg text-xs font-bold text-center focus:outline-none shadow-inner"
                          />
                        )}
                      </div>

                      {/* Reorder and Delete buttons */}
                      <div className="flex items-center gap-1 shrink-0">
                        {idx > 1 && (
                          <button
                            onClick={() => moveBlock(idx, 'up')}
                            className="opacity-70 hover:opacity-100 p-0.5 text-white"
                            title="Pindah ke Atas"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {idx > 0 && idx < workspaceBlocks.length - 1 && (
                          <button
                            onClick={() => moveBlock(idx, 'down')}
                            className="opacity-70 hover:opacity-100 p-0.5 text-white"
                            title="Pindah ke Bawah"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {b.opcode !== 'event_whenflagclicked' && (
                          <button
                            onClick={() => removeBlock(b.instanceId)}
                            className="opacity-60 hover:opacity-100 p-1 text-white hover:text-red-200 transition-opacity ml-1"
                            title="Hapus Blok"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Raw Code View */
              <pre className="p-4 bg-gray-900 text-emerald-400 font-mono text-xs rounded-2xl overflow-x-auto min-h-[400px]">
                {generateCodeText()}
              </pre>
            )}
          </div>
        </div>

        {/* --------------------------------------------------------------------- */}
        {/* Right Column: Stage Simulator & Controls (lg:col-span-4)              */}
        {/* --------------------------------------------------------------------- */}
        <div className="lg:col-span-4 bg-white rounded-3xl border-2 border-[#adc6ff] shadow-xl p-5 space-y-4">
          {/* Controls Bar: Green Flag & Red Stop */}
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <button
                onClick={() => runCode(false)}
                disabled={isRunning}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-xs font-extrabold shadow-sm flex items-center gap-1.5 tactile-btn transition-transform"
                title="Jalankan Algoritma (Bendera Hijau)"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                Mulai ⚑
              </button>

              <button
                onClick={stopCode}
                className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-full text-xs font-extrabold shadow-sm transition-transform"
                title="Hentikan Program"
              >
                <Square className="w-3 h-3 fill-white" />
              </button>
            </div>

            <button
              onClick={() => runCode(true)}
              disabled={isRunning}
              className="px-3 py-1.5 bg-[#d8e2ff] text-[#0058be] rounded-full text-xs font-bold hover:bg-[#adc6ff] transition-colors"
            >
              Mode Lambat 🐢
            </button>
          </div>

          {/* Interactive Simulation Stage */}
          <div className="relative w-full h-72 bg-gradient-to-b from-[#f2f3fd] via-white to-blue-50/50 rounded-2xl border-2 border-[#adc6ff] overflow-hidden flex items-center justify-center bg-grid-dots">
            {/* Center Origin Crosshair */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
              <div className="w-full h-[1px] bg-gray-400" />
              <div className="h-full w-[1px] bg-gray-400 absolute" />
            </div>

            {/* Target Coordinate Marker (if active challenge has target coordinate) */}
            {isChallengeMode && activeChallenge?.targetCoordinate && (
              <div
                className="absolute z-10 flex flex-col items-center pointer-events-none transition-all"
                style={{
                  transform: `translate(${activeChallenge.targetCoordinate.x}px, ${-activeChallenge
                    .targetCoordinate.y}px)`
                }}
              >
                <div className="relative flex items-center justify-center">
                  <div className="w-6 h-6 rounded-full bg-amber-400 animate-ping opacity-75 absolute" />
                  <div className="w-6 h-6 rounded-full bg-amber-500 border-2 border-white shadow-md flex items-center justify-center text-[10px] text-white font-bold">
                    🎯
                  </div>
                </div>
                <span className="text-[9px] font-extrabold bg-amber-600 text-white px-1.5 py-0.5 rounded shadow whitespace-nowrap mt-0.5">
                  {activeChallenge.targetCoordinate.label}
                </span>
              </div>
            )}

            {/* Sprite Character with motion translation & rotation */}
            <div
              className="relative transition-all duration-300 flex flex-col items-center select-none z-20"
              style={{
                transform: `translate(${spriteState.x}px, ${-spriteState.y}px) rotate(${
                  spriteState.direction
                }deg) scale(${spriteState.size / 100})`
              }}
            >
              {/* Speech Bubble */}
              {spriteState.sayingText && (
                <div className="absolute -top-14 bg-white text-gray-900 px-3 py-1.5 rounded-2xl shadow-lg border-2 border-[#0058be] text-xs font-extrabold whitespace-nowrap animate-bounce z-30">
                  {spriteState.sayingText}
                  <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-r-2 border-b-2 border-[#0058be] rotate-45" />
                </div>
              )}

              {/* Sprite Graphic */}
              <div className="w-20 h-20">
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuASL8Ya0tlN_GgiFTxe2RRjreq-bv2wfXC7kzX9yZowq26f9ApzXA95zmQ3bW5tZ1Mp5DA4vaalM95WTva7n4Ek-M8nMgTkR_5sBlzPbtqa7_85P0W0m6us3InEwkrUyDIAE2RXz3qOcSyVA_FCAq2vkR7kSy4KyV6ghDUA2K2OFLplvRftzjLpQBVWSK9BYAY72xeWJqtyC_xOXpR2TUzAXlhT4qaE9sRL4OgQXT2XAWIimvBUoiXl"
                  alt="Sprite Kobi"
                  className="w-full h-full object-contain drop-shadow-md"
                />
              </div>
            </div>
          </div>

          {/* Sprite Coordinate HUD */}
          <div className="grid grid-cols-4 gap-2 text-center text-xs font-bold text-gray-700 bg-gray-50 p-2.5 rounded-2xl border border-gray-200">
            <div>
              <p className="text-[10px] text-gray-400 font-bold uppercase">X Pos</p>
              <p className="text-[#0058be] font-extrabold">{spriteState.x}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-bold uppercase">Y Pos</p>
              <p className="text-[#0058be] font-extrabold">{spriteState.y}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-bold uppercase">Arah</p>
              <p className="text-purple-700 font-extrabold">{spriteState.direction}°</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-bold uppercase">Ukuran</p>
              <p className="text-emerald-700 font-extrabold">{spriteState.size}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. CELEBRATION MODAL (Upon Successful Algorithm Execution)                */}
      {/* ========================================================================= */}
      {showCelebration && lastCompletedChallenge && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full text-center space-y-5 border-4 border-amber-300 shadow-2xl relative animate-in zoom-in-95">
            {/* Header Badge */}
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-tr from-amber-400 to-amber-200 border-4 border-white shadow-xl flex items-center justify-center text-3xl animate-bounce">
              🏆
            </div>

            <div className="space-y-1">
              <span
                className={`text-xs font-extrabold px-3 py-1 rounded-full border ${diffConfig.badgeBg}`}
              >
                Tantangan Tingkat {diffConfig.label} Berhasil!
              </span>
              <h3 className="font-['Plus_Jakarta_Sans'] font-extrabold text-xl sm:text-2xl text-gray-900 mt-2">
                Luar Biasa, Sahabat Coder!
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed font-medium">
                Algoritma untuk misi{' '}
                <strong className="text-gray-900">"{lastCompletedChallenge.title}"</strong> telah
                berhasil dijalankan dengan sempurna.
              </p>
            </div>

            {/* Reward Summary */}
            <div className="bg-gradient-to-r from-amber-50 via-white to-amber-50 p-4 rounded-2xl border border-amber-200 flex items-center justify-center gap-6">
              <div className="flex items-center gap-2">
                <Star className="w-6 h-6 fill-amber-400 text-amber-500" />
                <div className="text-left">
                  <p className="text-[10px] text-gray-500 font-bold uppercase">Bintang</p>
                  <p className="text-sm font-extrabold text-amber-700">
                    +{lastCompletedChallenge.rewardStars} Bintang
                  </p>
                </div>
              </div>

              <div className="w-[1px] h-8 bg-amber-200" />

              <div className="flex items-center gap-2">
                <Zap className="w-6 h-6 text-[#0058be] fill-[#0058be]" />
                <div className="text-left">
                  <p className="text-[10px] text-gray-500 font-bold uppercase">XP Karakter</p>
                  <p className="text-sm font-extrabold text-[#0058be]">
                    +{lastCompletedChallenge.rewardXp} XP
                  </p>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="space-y-2 pt-2">
              <button
                onClick={() => {
                  audioService.playSnapSound();
                  setShowCelebration(false);
                }}
                className="w-full py-3 bg-[#0058be] hover:bg-[#004395] text-white font-extrabold text-sm rounded-full shadow-lg tactile-btn transition-transform"
              >
                Lanjutkan Petualangan Studio 🚀
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
