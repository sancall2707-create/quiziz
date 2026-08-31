import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { LessonDetail } from './LessonDetail';
import { MissionResultModal } from './MissionResultModal';
import { Badge } from '../../types';

export const MissionPage: React.FC = () => {
  const { missionId } = useParams<{ missionId: string }>();
  const navigate = useNavigate();
  const { completeMission, getMissionById } = useApp();

  const effectiveMissionId = missionId || 'm-g4-c1-m4';

  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    missionTitle: string;
    stars: number;
    score: number;
    xpEarned: number;
    coinsEarned: number;
    newBadge?: Badge;
    isOfflineSaved?: boolean;
  }>({
    isOpen: false,
    missionTitle: '',
    stars: 3,
    score: 100,
    xpEarned: 150,
    coinsEarned: 50,
    isOfflineSaved: false
  });

  const handleFinishMission = (stars: number, score: number) => {
    const result = completeMission(effectiveMissionId, stars, score);
    const missionObj = getMissionById(effectiveMissionId);

    setModalState({
      isOpen: true,
      missionTitle: missionObj?.title || 'Misi Pembelajaran',
      stars: result.starsEarned,
      score,
      xpEarned: result.xpEarned,
      coinsEarned: result.coinsEarned,
      newBadge: result.newBadge,
      isOfflineSaved: result.isOfflineSaved
    });
  };

  const handleContinueAfterModal = () => {
    setModalState(prev => ({ ...prev, isOpen: false }));
    navigate('/student/adventure');
  };

  const handleReplayMission = () => {
    setModalState(prev => ({ ...prev, isOpen: false }));
  };

  return (
    <>
      <LessonDetail
        missionId={effectiveMissionId}
        onBackToMap={() => navigate('/student/adventure')}
        onFinishMission={handleFinishMission}
      />

      <MissionResultModal
        isOpen={modalState.isOpen}
        missionTitle={modalState.missionTitle}
        starsEarned={modalState.stars}
        score={modalState.score}
        xpEarned={modalState.xpEarned}
        coinsEarned={modalState.coinsEarned}
        newBadge={modalState.newBadge}
        isOfflineSaved={modalState.isOfflineSaved}
        onContinue={handleContinueAfterModal}
        onReplay={handleReplayMission}
      />
    </>
  );
};
