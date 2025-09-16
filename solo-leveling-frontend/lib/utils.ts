export const cn = (...classes: string[]) => classes.filter(Boolean).join(' ');

export const getDifficultyColor = (difficulty: string) => {
  switch (difficulty.toLowerCase()) {
    case 'easy': return 'text-green-400 border-green-400';
    case 'medium': return 'text-yellow-400 border-yellow-400';
    case 'hard': return 'text-red-400 border-red-400';
    default: return 'text-gray-400 border-gray-400';
  }
};

export const getRandomQuote = () => {
  const quotes = [
    { text: "I alone shall level up!", author: "Sung Jin-Woo" },
    { text: "The difference between the novice and the master is that the master has failed more times than the novice has tried.", author: "Unknown" },
    { text: "Hesitation is defeat.", author: "Isshin Ashina" },
    { text: "A hunter must hunt.", author: "Bloodborne" },
    { text: "What is a man but the sum of his memories?", author: "Assassin's Creed" },
    { text: "The right man in the wrong place can make all the difference in the world.", author: "G-Man" },
    { text: "Steel your mind. Your soul may belong to the shadows, but your body belongs to me.", author: "Solo Leveling" },
    { text: "I don't die easily.", author: "Sung Jin-Woo" },
    { text: "Getting stronger isn't just about power, it's about the will to keep going.", author: "Solo Leveling" },
    { text: "Every challenge is an opportunity to level up.", author: "Gamer's Wisdom" }
  ];
  
  return quotes[Math.floor(Math.random() * quotes.length)];
};

export const formatTime = (dateString: string) => {
  try {
    if (!dateString) {
      return 'Time not set';
    }
    
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Time not set';
    }
    
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    
    if (diff <= 0) {
      return 'Expired';
    }
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days} day${days > 1 ? 's' : ''} remaining`;
    }
    
    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    }
    
    return `${minutes}m remaining`;
  } catch (error) {
    return 'Time not set';
  }
};