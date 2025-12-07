import { DrillCompletionData, DrillProgressHistory } from '../types/DrillProgress';

const COMPLETION_KEY_PREFIX = 'REPERTOIRE_COMPLETION_';
const COMPLETION_HISTORY_KEY_PREFIX = 'REPERTOIRE_HISTORY_';

/**
 * Saves a drill completion record to localStorage
 * @param completionData The completion data to save
 */
export const saveDrillCompletion = (completionData: DrillCompletionData): void => {
  if (!completionData.filename) {
    console.warn('Cannot save drill completion without filename');
    return;
  }

  // Save the most recent completion
  const completionKey = `${COMPLETION_KEY_PREFIX}${completionData.filename}`;
  localStorage.setItem(completionKey, JSON.stringify(completionData));

  // Update the completion history
  const history = getDrillHistory(completionData.filename);
  history.completions.push(completionData);
  history.lastCompletedAt = completionData.completedAt;
  history.totalCompletions = history.completions.length;

  const historyKey = `${COMPLETION_HISTORY_KEY_PREFIX}${completionData.filename}`;
  localStorage.setItem(historyKey, JSON.stringify(history));
};

/**
 * Retrieves the most recent drill completion for a repertoire
 * @param filename The repertoire filename
 * @returns The most recent completion data, or null if none exists
 */
export const getLastDrillCompletion = (filename: string): DrillCompletionData | null => {
  const completionKey = `${COMPLETION_KEY_PREFIX}${filename}`;
  const stored = localStorage.getItem(completionKey);
  
  if (!stored) {
    return null;
  }

  try {
    return JSON.parse(stored) as DrillCompletionData;
  } catch (error) {
    console.error('Error parsing drill completion data:', error);
    return null;
  }
};

/**
 * Retrieves the complete drill history for a repertoire
 * @param filename The repertoire filename
 * @returns The drill history, or an empty history if none exists
 */
export const getDrillHistory = (filename: string): DrillProgressHistory => {
  const historyKey = `${COMPLETION_HISTORY_KEY_PREFIX}${filename}`;
  const stored = localStorage.getItem(historyKey);

  if (!stored) {
    return {
      filename,
      completions: [],
      totalCompletions: 0
    };
  }

  try {
    return JSON.parse(stored) as DrillProgressHistory;
  } catch (error) {
    console.error('Error parsing drill history:', error);
    return {
      filename,
      completions: [],
      totalCompletions: 0
    };
  }
};

/**
 * Retrieves all drill completions across all repertoires
 * @returns Array of all completion histories
 */
export const getAllDrillHistories = (): DrillProgressHistory[] => {
  const histories: DrillProgressHistory[] = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(COMPLETION_HISTORY_KEY_PREFIX)) {
      const filename = key.replace(COMPLETION_HISTORY_KEY_PREFIX, '');
      const history = getDrillHistory(filename);
      histories.push(history);
    }
  }

  return histories;
};

/**
 * Clears all drill completion data for a specific repertoire
 * @param filename The repertoire filename
 */
export const clearDrillProgress = (filename: string): void => {
  const completionKey = `${COMPLETION_KEY_PREFIX}${filename}`;
  const historyKey = `${COMPLETION_HISTORY_KEY_PREFIX}${filename}`;
  
  localStorage.removeItem(completionKey);
  localStorage.removeItem(historyKey);
};

/**
 * Clears all drill completion data for all repertoires
 */
export const clearAllDrillProgress = (): void => {
  const keysToRemove: string[] = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.startsWith(COMPLETION_KEY_PREFIX) || key.startsWith(COMPLETION_HISTORY_KEY_PREFIX))) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach(key => localStorage.removeItem(key));
};

/**
 * Gets drill statistics for a repertoire
 * @param filename The repertoire filename
 * @returns Statistics about the drill progress
 */
export const getDrillStats = (filename: string) => {
  const history = getDrillHistory(filename);
  
  if (history.completions.length === 0) {
    return null;
  }

  const colorCounts = history.completions.reduce(
    (acc, completion) => {
      acc[completion.drillColor]++;
      return acc;
    },
    { white: 0, black: 0 }
  );

  const totalExercises = history.completions.reduce(
    (sum, completion) => sum + completion.exerciseCount,
    0
  );

  return {
    totalCompletions: history.totalCompletions,
    totalExercises,
    colorCounts,
    lastCompletedAt: history.lastCompletedAt,
    firstCompletedAt: history.completions[0]?.completedAt
  };
};
