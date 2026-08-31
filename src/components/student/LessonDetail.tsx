import React, { useState } from 'react';
import {
  ArrowLeft,
  Volume2,
  VolumeX,
  Lightbulb,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  RotateCcw,
  ArrowRight,
  HelpCircle,
  Star,
  Check
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Mission, InteractiveActivity } from '../../types';
import { KobiCharacter } from '../common/KobiCharacter';
import { audioService } from '../../utils/audio';

interface LessonDetailProps {
  missionId: string;
  onBackToMap: () => void;
  onFinishMission: (stars: number, score: number) => void;
}

export const LessonDetail: React.FC<LessonDetailProps> = ({
  missionId,
  onBackToMap,
  onFinishMission
}) => {
  const { getMissionById, currentUser } = useApp();
  const mission: Mission | undefined = getMissionById(missionId);

  // Lesson step: 0 = Theory Concept, 1 = Interactive Activity
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [hintLevel, setHintLevel] = useState<number>(0);
  const [activityStatus, setActivityStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [feedbackMessage, setFeedbackMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Activity State: Drag & Drop (supports both native drag and click)
  const [draggedItems, setDraggedItems] = useState<Record<string, string>>({}); // { zoneId: itemId }
  const [activeDraggedItemId, setActiveDraggedItemId] = useState<string | null>(null);

  // Activity State: Quiz Card
  const [selectedQuizOption, setSelectedQuizOption] = useState<string | null>(null);

  if (!mission) {
    return (
      <div className="p-12 text-center bg-white rounded-3xl border border-gray-200">
        <p className="text-gray-600 mb-4">Misi tidak ditemukan.</p>
        <button onClick={onBackToMap} className="px-6 py-2.5 bg-[#0058be] text-white rounded-full font-bold">
          Kembali ke Peta
        </button>
      </div>
    );
  }

  const lesson = mission.lesson;
  const activity: InteractiveActivity | undefined = lesson.activities[0];

  const handlePlayNarration = () => {
    if (isPlayingAudio) {
      audioService.stopSpeaking();
      setIsPlayingAudio(false);
      return;
    }
    setIsPlayingAudio(true);
    audioService.speakText(lesson.narrationText, () => {
      setIsPlayingAudio(false);
    });
  };

  const handleShowNextHint = () => {
    if (!activity) return;
    const maxHints = activity.kobiHints.length;
    const nextLevel = (hintLevel % maxHints) + 1;
    setHintLevel(nextLevel);
    audioService.playSnapSound();
    audioService.speakText(activity.kobiHints[nextLevel - 1]);
  };

  // Drag Drop Handlers
  const handleDropItem = (zoneId: string, itemId: string) => {
    setDraggedItems(prev => ({ ...prev, [zoneId]: itemId }));
    audioService.playSnapSound();
  };

  // Native HTML5 Drag Handlers
  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    e.dataTransfer.setData('text/plain', itemId);
    setActiveDraggedItemId(itemId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDropNative = (e: React.DragEvent, zoneId: string) => {
    e.preventDefault();
    const itemId = e.dataTransfer.getData('text/plain') || activeDraggedItemId;
    if (itemId) {
      handleDropItem(zoneId, itemId);
    }
    setActiveDraggedItemId(null);
  };

  // Check Drag & Drop Answer
  const checkDragDropAnswer = () => {
    if (!activity?.dragDropData) return;
    const zones = activity.dragDropData.zones;
    let allCorrect = true;

    for (const zone of zones) {
      const placedItemId = draggedItems[zone.id];
      if (!placedItemId) {
        allCorrect = false;
        break;
      }
      const itemObj = activity.dragDropData.items.find(it => it.id === placedItemId);
      if (!itemObj || itemObj.category !== zone.acceptsCategory) {
        allCorrect = false;
        break;
      }
    }

    if (allCorrect) {
      audioService.playSuccessSound();
      setActivityStatus('success');
      setFeedbackMessage('Bagus sekali! Semua perangkat keras berhasil diletakkan pada posisi yang benar!');
    } else {
      audioService.playErrorSound();
      setActivityStatus('error');
      setFeedbackMessage('Oops! Coba periksa kembali pasangan alat dan kotaknya.');
    }
  };

  // Check Quiz Answer
  const checkQuizAnswer = (optId: string) => {
    setSelectedQuizOption(optId);
    if (!activity?.quizData) return;
    const opt = activity.quizData.options.find(o => o.id === optId);
    if (opt?.isCorrect) {
      audioService.playSuccessSound();
      setActivityStatus('success');
      setFeedbackMessage(opt.feedback || 'Jawabanmu benar!');
    } else {
      audioService.playErrorSound();
      setActivityStatus('error');
      setFeedbackMessage(opt?.feedback || 'Jawaban belum tepat, coba lagi ya!');
    }
  };

  // Reset current activity
  const resetActivity = () => {
    setDraggedItems({});
    setSelectedQuizOption(null);
    setActivityStatus('idle');
    setFeedbackMessage('');
    setHintLevel(0);
    audioService.playSnapSound();
  };

  const handleFinish = () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    onFinishMission(3, 100);
  };

  return (
    <div className="space-y-6 pb-28 animate-in fade-in">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-[#e1e2ec] shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToMap}
            className="w-10 h-10 rounded-full bg-[#f2f3fd] hover:bg-[#d8e2ff] text-[#0058be] flex items-center justify-center transition-colors shadow-2xs"
            title="Kembali ke Peta"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <span className="text-xs font-extrabold text-[#0058be] uppercase tracking-wider">
              {lesson.chapterTitle} • Misi {mission.order}
            </span>
            <h1 className="font-['Plus_Jakarta_Sans'] font-extrabold text-xl sm:text-2xl text-gray-900 leading-tight">
              {lesson.title}
            </h1>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-2 bg-[#f2f3fd] p-1.5 rounded-full border border-[#adc6ff]/60 self-start sm:self-auto">
          <button
            onClick={() => setCurrentStep(0)}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
              currentStep === 0 ? 'bg-[#0058be] text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            1. Teori Konsep
          </button>
          <button
            onClick={() => setCurrentStep(1)}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
              currentStep === 1 ? 'bg-[#0058be] text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            2. Tantangan Interaktif
          </button>
        </div>
      </div>

      {/* STEP 0: TEORI KONSEP (Theory Microlearning) */}
      {currentStep === 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Card: Concepts & Narration */}
          <div className="lg:col-span-8 space-y-6">
            <div className="p-6 sm:p-10 bg-white rounded-[2.5rem] border-2 border-[#adc6ff] shadow-xl relative overflow-hidden">
              {/* Pill: Konsep Utama */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#d8e2ff] text-[#001a42] text-xs font-extrabold mb-4">
                <Sparkles className="w-3.5 h-3.5 text-[#0058be]" />
                KONSEP UTAMA
              </div>

              <h2 className="font-['Plus_Jakarta_Sans'] font-extrabold text-2xl sm:text-3xl text-gray-900 mb-4 leading-snug">
                {lesson.mainConceptTitle}
              </h2>

              <p className="text-base sm:text-lg text-gray-700 leading-relaxed font-semibold mb-6">
                {lesson.mainConceptText}
              </p>

              {/* Audio Narrative Player Button */}
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-[#adc6ff] flex items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white text-[#0058be] flex items-center justify-center shadow-sm">
                    {isPlayingAudio ? <Sparkles className="w-5 h-5 animate-spin text-amber-500" /> : <Volume2 className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#0058be]">Dengarkan Penjelasan Kobi</p>
                    <p className="text-xs text-gray-500 font-semibold">Suara narasi ramah anak dalam bahasa Indonesia</p>
                  </div>
                </div>

                <button
                  onClick={handlePlayNarration}
                  className={`px-4 py-2 rounded-full text-xs font-extrabold transition-all shadow-sm flex items-center gap-2 ${
                    isPlayingAudio
                      ? 'bg-amber-500 text-white'
                      : 'bg-[#0058be] hover:bg-[#2170e4] text-white'
                  }`}
                >
                  {isPlayingAudio ? (
                    <>
                      <VolumeX className="w-4 h-4" /> Berhenti
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-4 h-4" /> Putar Narasi
                    </>
                  )}
                </button>
              </div>

              {/* Real life example card */}
              {lesson.realLifeExample && (
                <div className="p-5 bg-amber-50/80 rounded-2xl border-2 border-amber-200/80 flex items-start gap-4">
                  <div className="text-3xl shrink-0">💡</div>
                  <div>
                    <h4 className="font-bold text-sm text-amber-900 mb-1">
                      Contoh di Dunia Nyata: {lesson.realLifeExample.title}
                    </h4>
                    <p className="text-xs sm:text-sm text-amber-950/90 leading-relaxed font-semibold">
                      {lesson.realLifeExample.description}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Mascot Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <div className="p-6 bg-gradient-to-b from-blue-50 to-white rounded-3xl border-2 border-[#adc6ff] shadow-md text-center flex flex-col items-center">
              <KobiCharacter size="lg" mood="happy" showSpeech={true} speechText={lesson.kobiNote} />
              <div className="mt-4 pt-4 border-t border-gray-100 w-full">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="w-full bg-[#0058be] hover:bg-[#2170e4] text-white font-['Plus_Jakarta_Sans'] font-extrabold text-base py-4 rounded-full tactile-btn shadow-lg flex items-center justify-center gap-2"
                >
                  Mulai Tantangan Interaktif
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 1: AKTIVITAS INTERAKTIF (Drag & Drop / Quiz) */}
      {currentStep === 1 && activity && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Interactive Stage */}
          <div className="lg:col-span-8 space-y-6">
            <div className="p-6 sm:p-10 bg-white rounded-[2.5rem] border-2 border-[#adc6ff] shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-[#d8e2ff] text-[#001a42]">
                  {activity.type === 'drag_drop' ? 'Tarik & Lepas Perangkat' : activity.type === 'quiz_card' ? 'Kuis Pilihan Bergambar' : 'Teka-Teki Interaktif'}
                </span>
                <button
                  onClick={resetActivity}
                  className="text-xs font-bold text-gray-500 hover:text-[#0058be] flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Ulangi
                </button>
              </div>

              <h2 className="font-['Plus_Jakarta_Sans'] font-extrabold text-2xl sm:text-3xl text-gray-900 mb-2">
                {activity.title}
              </h2>
              <p className="text-sm text-gray-600 font-semibold mb-6">
                {activity.instruction}
              </p>

              {/* 1. Drag & Drop Activity Mode */}
              {activity.type === 'drag_drop' && activity.dragDropData && (
                <div className="space-y-8">
                  {/* Items to drag / click */}
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                      Tarik atau Klik Perangkat:
                    </p>
                    <div className="flex flex-wrap gap-4">
                      {activity.dragDropData.items.map(item => {
                        const isPlaced = Object.values(draggedItems).includes(item.id);
                        return (
                          <div
                            key={item.id}
                            draggable={!isPlaced}
                            onDragStart={(e) => handleDragStart(e, item.id)}
                            onClick={() => {
                              if (isPlaced) return;
                              const emptyZone = activity.dragDropData?.zones.find(z => !draggedItems[z.id]);
                              if (emptyZone) {
                                handleDropItem(emptyZone.id, item.id);
                              }
                            }}
                            className={`p-4 rounded-2xl font-extrabold text-sm flex items-center gap-3 transition-all select-none ${
                              isPlaced
                                ? 'bg-gray-100 text-gray-400 opacity-50 cursor-not-allowed border border-gray-200'
                                : 'bg-gradient-to-r from-blue-500 to-[#0058be] text-white cursor-grab active:cursor-grabbing tactile-btn shadow-md hover:scale-105'
                            }`}
                          >
                            <span className="text-2xl">
                              {item.category === 'mouse' ? '🖱️' : item.category === 'keyboard' ? '⌨️' : '🖥️'}
                            </span>
                            <span>{item.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Drop Zones with onDragOver & onDrop */}
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                      Kotak Tempat Peletakan:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {activity.dragDropData.zones.map(zone => {
                        const placedItemId = draggedItems[zone.id];
                        const placedItem = activity.dragDropData?.items.find(i => i.id === placedItemId);

                        return (
                          <div
                            key={zone.id}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDropNative(e, zone.id)}
                            className={`p-5 rounded-3xl border-2 border-dashed transition-all flex flex-col items-center justify-center text-center min-h-[160px] ${
                              placedItem
                                ? 'bg-blue-50/80 border-[#0058be] shadow-sm'
                                : 'bg-gray-50/80 border-gray-300 hover:border-[#0058be]'
                            }`}
                          >
                            {placedItem ? (
                              <div className="flex flex-col items-center animate-in zoom-in-95">
                                <span className="text-4xl mb-2">
                                  {placedItem.category === 'mouse' ? '🖱️' : placedItem.category === 'keyboard' ? '⌨️' : '🖥️'}
                                </span>
                                <span className="font-extrabold text-sm text-[#0058be] mb-2">{placedItem.label}</span>
                                <button
                                  onClick={() => {
                                    setDraggedItems(prev => {
                                      const copy = { ...prev };
                                      delete copy[zone.id];
                                      return copy;
                                    });
                                  }}
                                  className="text-[11px] font-bold text-red-500 hover:underline"
                                >
                                  Hapus
                                </button>
                              </div>
                            ) : (
                              <>
                                <span className="text-3xl text-gray-300 mb-2">📦</span>
                                <p className="font-bold text-xs text-gray-700">{zone.label}</p>
                                <p className="text-[10px] text-gray-400 mt-0.5">{zone.description}</p>
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Validate Button */}
                  <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                    <button
                      onClick={checkDragDropAnswer}
                      className="px-8 py-3.5 bg-[#0058be] hover:bg-[#2170e4] text-white font-['Plus_Jakarta_Sans'] font-extrabold text-sm sm:text-base rounded-full tactile-btn shadow-lg"
                    >
                      Periksa Jawaban
                    </button>
                  </div>
                </div>
              )}

              {/* 2. Quiz Activity Mode */}
              {activity.type === 'quiz_card' && activity.quizData && (
                <div className="space-y-6">
                  <div className="p-4 bg-[#f2f3fd] rounded-2xl border border-[#adc6ff]">
                    <h3 className="font-bold text-base text-gray-900">{activity.quizData.question}</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {activity.quizData.options.map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => checkQuizAnswer(opt.id)}
                        className={`p-5 rounded-2xl border-2 font-bold text-left text-sm transition-all flex items-center gap-3 ${
                          selectedQuizOption === opt.id
                            ? opt.isCorrect
                              ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-md'
                              : 'bg-red-50 border-red-400 text-red-900 shadow-md'
                            : 'bg-white border-gray-200 hover:border-[#0058be] text-gray-800 hover:bg-blue-50/40'
                        }`}
                      >
                        <span className="w-8 h-8 rounded-full bg-white border flex items-center justify-center shrink-0 font-extrabold text-[#0058be]">
                          {selectedQuizOption === opt.id && opt.isCorrect ? '✓' : '•'}
                        </span>
                        <span>{opt.text}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Feedback State Display */}
              {activityStatus !== 'idle' && (
                <div
                  className={`mt-6 p-4 rounded-2xl border-2 flex items-center gap-3 animate-in fade-in ${
                    activityStatus === 'success'
                      ? 'bg-emerald-50 border-emerald-400 text-emerald-900'
                      : 'bg-red-50 border-red-300 text-red-900'
                  }`}
                >
                  {activityStatus === 'success' ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-6 h-6 text-red-500 shrink-0" />
                  )}
                  <div className="flex-1 text-xs sm:text-sm font-bold">
                    {feedbackMessage}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Kobi Helper Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <div className="p-6 bg-gradient-to-b from-blue-50 to-white rounded-3xl border-2 border-[#adc6ff] shadow-md flex flex-col items-center text-center">
              <KobiCharacter
                size="md"
                mood={activityStatus === 'success' ? 'celebrating' : 'helping'}
                interactive={true}
              />

              <div className="mt-4 p-3 bg-white rounded-2xl border border-[#adc6ff] w-full text-left">
                <p className="text-xs font-extrabold text-[#0058be] uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                  Petunjuk Kobi
                </p>
                <p className="text-xs text-gray-700 font-semibold leading-relaxed">
                  {hintLevel > 0
                    ? activity.kobiHints[hintLevel - 1]
                    : activity.kobiPrompt}
                </p>
              </div>

              <button
                onClick={handleShowNextHint}
                className="mt-3 w-full py-2.5 bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-xs rounded-full border border-amber-300 transition-colors flex items-center justify-center gap-1.5"
              >
                <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                Minta Bantuan Kobi ({hintLevel}/3)
              </button>

              {activityStatus === 'success' && (
                <div className="mt-4 pt-4 border-t border-gray-100 w-full animate-in zoom-in-95">
                  <button
                    onClick={handleFinish}
                    disabled={isSubmitting}
                    className="w-full bg-[#00855b] hover:bg-[#006947] disabled:opacity-50 text-white font-['Plus_Jakarta_Sans'] font-extrabold text-base py-4 rounded-full tactile-btn shadow-lg flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? 'Menyimpan...' : 'Selesaikan Misi!'}
                    <Sparkles className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Fixed Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-md border-t border-[#e1e2ec] p-4 z-30 flex items-center justify-between max-w-7xl mx-auto px-6">
        <button
          onClick={onBackToMap}
          className="px-5 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-full transition-colors flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" /> Keluar ke Peta
        </button>

        <div className="flex items-center gap-3">
          {currentStep === 0 ? (
            <button
              onClick={() => setCurrentStep(1)}
              className="px-8 py-3 bg-[#0058be] hover:bg-[#2170e4] text-white font-['Plus_Jakarta_Sans'] font-extrabold text-sm sm:text-base rounded-full tactile-btn shadow-md flex items-center gap-2"
            >
              Lanjut ke Aktivitas
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              disabled={activityStatus !== 'success' || isSubmitting}
              className={`px-8 py-3 font-['Plus_Jakarta_Sans'] font-extrabold text-sm sm:text-base rounded-full tactile-btn shadow-md flex items-center gap-2 ${
                activityStatus === 'success' && !isSubmitting
                  ? 'bg-[#00855b] hover:bg-[#006947] text-white'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isSubmitting ? 'Menyimpan...' : 'Selesai & Buka Hadiah'}
              <Sparkles className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
