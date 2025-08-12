
import React from 'react';

const LoadingOverlay: React.FC = () => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
            <div className="flex flex-col items-center">
                <div className="spinner-large"></div>
                <p className="text-white text-lg mt-4">Loading data...</p>
            </div>
        </div>
    );
};

export default LoadingOverlay;
