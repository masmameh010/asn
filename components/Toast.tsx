
import React from 'react';

interface ToastProps {
    message: string;
    show: boolean;
}

const Toast: React.FC<ToastProps> = ({ message, show }) => {
    return (
        <div
            className={`fixed bottom-5 left-1/2 -translate-x-1/2 px-6 py-3 bg-gray-800 text-white rounded-lg shadow-lg transition-all duration-300 z-[10000] ${
                show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
            }`}
        >
            {message}
        </div>
    );
};

export default Toast;
