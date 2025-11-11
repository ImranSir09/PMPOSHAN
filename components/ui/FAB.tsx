import React from 'react';

interface FABProps {
  onClick: () => void;
  icon: React.ReactElement;
  ariaLabel: string;
}

const FAB: React.FC<FABProps> = ({ onClick, icon, ariaLabel }) => {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      className="fixed bottom-20 right-4 z-40 h-14 w-14 rounded-full bg-cyan-500 text-white shadow-lg hover:bg-cyan-600 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-900 transition-transform transform active:scale-95 flex items-center justify-center"
    >
      {icon}
    </button>
  );
};

export default FAB;
