import { aiTrainingRepository } from '../../repositories/ai-training.repository';
import { type TrainingStats } from '@shared/schema';

interface TrainingExampleData {
  userId: number;
  transactionDescription: string;
  transactionAmount?: number;
  merchantName?: string;

  aiSuggestedCategoryId?: number;
  aiSuggestedTagId?: number;
  aiConfidence?: number;

  userChosenCategoryId?: number;
  userChosenTagId?: number;
  userChosenType: string;
}

export async function saveTrainingExample(data: TrainingExampleData) {
  const aiWasCorrect =
    data.aiSuggestedCategoryId === data.userChosenCategoryId &&
    data.aiSuggestedTagId === data.userChosenTagId;

  await aiTrainingRepository.createTrainingExample({
    userId: data.userId,
    transactionDescription: data.transactionDescription,
    transactionAmount: data.transactionAmount?.toString(),
    merchantName: data.merchantName,

    aiSuggestedCategoryId: data.aiSuggestedCategoryId,
    aiSuggestedTagId: data.aiSuggestedTagId,
    aiConfidence: data.aiConfidence,

    userChosenCategoryId: data.userChosenCategoryId,
    userChosenTagId: data.userChosenTagId,
    userChosenType: data.userChosenType,

    aiWasCorrect,
  });
}

export async function getTrainingStats(userId: number): Promise<TrainingStats> {
  const examples = await aiTrainingRepository.getTrainingExamplesByUserId(userId);

  const totalExamples = examples.length;
  const correctPredictions = examples.filter((e) => e.aiWasCorrect).length;
  const accuracy =
    totalExamples > 0 ? Math.round((correctPredictions / totalExamples) * 100) : 0;

  let level: string;
  let levelIcon: string;
  if (totalExamples < 10) {
    level = 'Beginner';
    levelIcon = 'GraduationCap';
  } else if (totalExamples < 50) {
    level = 'Intermediate';
    levelIcon = 'Brain';
  } else if (totalExamples < 100) {
    level = 'Advanced';
    levelIcon = 'Sparkles';
  } else {
    level = 'Master';
    levelIcon = 'Trophy';
  }

  const nextMilestone = totalExamples < 10 ? 10 : totalExamples < 50 ? 50 : totalExamples < 100 ? 100 : null;

  return {
    totalExamples,
    correctPredictions,
    accuracy,
    level,
    levelIcon,
    nextMilestone,
    canEnableAutoMode: accuracy >= 80 && totalExamples >= 50,
  };
}
