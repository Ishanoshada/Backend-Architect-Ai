
import React, { useState, useEffect } from 'react';

const messages = [
  'AI is architecting your backend...',
  'Considering scalability factors...',
  'Designing database schemas...',
  'Generating UML diagram...',
  'Defining RESTful API routes...',
  'Adding security recommendations...',
  'Finalizing the plan...',
];

const Loader: React.FC = () => {
  const [message, setMessage] = useState(messages[0]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setMessage(prevMessage => {
        const currentIndex = messages.indexOf(prevMessage);
        const nextIndex = (currentIndex + 1) % messages.length;
        return messages[nextIndex];
      });
    }, 2000); // Change message every 2 seconds

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-10">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary"></div>
      <p className="mt-4 text-lg text-gray-400">{message}</p>
    </div>
  );
};

export default Loader;