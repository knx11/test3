import { useState } from 'react';

type FeedbackType = 'success' | 'error' | 'info';

export default function useFeedback() {
  const [feedback, setFeedback] = useState<{
    message: string;
    visible: boolean;
    type: FeedbackType;
  }>({
    message: '',
    visible: false,
    type: 'info',
  });

  const showFeedback = (message: string, type: FeedbackType = 'info') => {
    setFeedback({ message, visible: true, type });
  };

  const hideFeedback = () => {
    setFeedback((prev) => ({ ...prev, visible: false }));
  };

  return {
    feedback,
    showFeedback,
    hideFeedback,
  };
}