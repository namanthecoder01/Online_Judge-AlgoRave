// Centralized theme and color mappings for badges and difficulties
import CodeNovice from './Components/Assets/badges/CodeNovice.svg';
import AlgorithmAce from './Components/Assets/badges/AlgorithmAce.svg';
import ProblemSlayer from './Components/Assets/badges/ProblemSlayer.svg';
import ContestConqueror from './Components/Assets/badges/ContestConqueror.svg';
import GrandmasterCoder from './Components/Assets/badges/GrandmasterCoder.svg';

export const badgeLogos = {
  'Code Novice': CodeNovice,
  'Algorithm Ace': AlgorithmAce,
  'Problem Slayer': ProblemSlayer,
  'Contest Conqueror': ContestConqueror,
  'Grandmaster Coder': GrandmasterCoder,
};

export const badgeColors = {
  'Code Novice': '#00FF00',
  'Algorithm Ace': '#00B7EB',
  'Problem Slayer': '#FF0000',
  'Contest Conqueror': '#FFD700',
  'Grandmaster Coder': '#800080',
};

export const difficultyColors = {
  easy: '#00FF00',
  medium: '#f9a825',
  hard: '#d93025',
};

export const backgroundColors = {
  easy: 'rgba(0, 255, 0, 0.1)',
  medium: 'rgba(249, 168, 37, 0.1)',
  hard: 'rgba(217, 48, 37, 0.1)',
  accepted: 'rgba(0, 255, 0, 0.1)',
  wrong_answer: 'rgba(255, 68, 68, 0.1)',
  pending: 'rgba(255, 165, 0, 0.1)',
  compilation_error: 'rgba(128, 0, 128, 0.1)',
  runtime_error: 'rgba(220, 20, 60, 0.1)',
};

export const textColors = {
  easy: '#00FF00',
  medium: '#f9a825',
  hard: '#d93025',
  accepted: '#00FF00',
  wrong_answer: '#ff4444',
  pending: '#ffa500',
  compilation_error: '#800080',
  runtime_error: '#dc143c',
  default: '#ffffff',
};

export const statusColors = {
  accepted: '#00FF00',
  wrong_answer: '#ff4444',
  pending: '#ffa500',
  compilation_error: '#800080',
  runtime_error: '#dc143c',
  default: '#666666',
};

export const applyThemeVars = (theme) => {
  return {
    '--glow-color': theme === 'dark' ? '#00FF00' : '#00B7EB',
    '--bg-color': theme === 'dark' ? '#0a0a0a' : '#ffffff',
    '--text-color': theme === 'dark' ? '#ffffff' : '#000000',
  };
}; 