// Location: components/feed/FeedItemRenderer.tsx
import React, { memo } from 'react';

// Import your individual card components
import AIConceptMicro from './AIConceptMicro';
import AIFlashcard from './AIFlashcard';
import AIQuizCard from './AIQuizCard';
import AIQuizTF from './AIQuizTF';
import AIMiniGameMatch from './AIMiniGameMatch';

// Strictly define props so TypeScript can optimize
interface FeedItemProps {
  item: any; 
  currentUid: string | undefined;
  onCorrect: () => void;
  onWrong: () => void;
}

const FeedItemRenderer = ({ item, currentUid, onCorrect, onWrong }: FeedItemProps) => {
  // Cleanly route to the correct UI component
  switch (item.type) {
    case "concept_micro": 
      return <AIConceptMicro item={item} currentUid={currentUid} />;
    case "flashcard": 
      return <AIFlashcard item={item} currentUid={currentUid} />;
    case "quiz_mcq": 
      return <AIQuizCard item={item} currentUid={currentUid} onCorrect={onCorrect} onWrong={onWrong} />;
    case "quiz_tf": 
      return <AIQuizTF item={item} currentUid={currentUid} onCorrect={onCorrect} onWrong={onWrong} />;
    case "mini_game_match": 
      return <AIMiniGameMatch item={item} currentUid={currentUid} onCorrect={onCorrect} />;
    default: 
      return null;
  }
};

// 🔥 THE RAM SAVER: React.memo
// Ye line React ko bolti hai: "Jab tak post ka ID same hai, is component ko dobara draw mat karna!"
export default memo(FeedItemRenderer, (prevProps, nextProps) => {
  return prevProps.item.id === nextProps.item.id;
});