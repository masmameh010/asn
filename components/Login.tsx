
import React, { useState } from 'react';
import { User } from 'firebase/auth';

interface LoginProps {
    onLogin: () => Promise<User | void>;
    showToast: (message: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, showToast }) => {
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    const handleLogin = async () => {
        setIsLoggingIn(true);
        try {
            await onLogin();
            // On success, onAuthStateChanged in App.tsx will handle the UI update.
        } catch (error: any) {
            if (error?.code === 'auth/unauthorized-domain') {
                showToast('Login failed: This website\'s domain is not authorized. Please add it to the Firebase console > Authentication > Settings > Authorized domains.');
            } else {
                showToast(`An unexpected error occurred: ${error?.message || 'Please try again.'}`);
            }
            setIsLoggingIn(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-100 p-4">
            <div className="max-w-md w-full text-center bg-white p-8 rounded-2xl shadow-xl">
                <div className="header-gradient text-white py-6 px-4 rounded-xl shadow-lg mb-6 -mt-16">
                    <h1 className="text-3xl font-bold mb-1">
                        <i className="fa-solid fa-cloud-arrow-up mr-2"></i>
                        AI Image Collection Manager
                    </h1>
                     <p className="text-indigo-100">by IMAJINASILOKAL</p>
                </div>
                <h2 className="text-2xl font-semibold text-gray-800 mb-2">Welcome!</h2>
                <p className="text-gray-600 mb-8">Please sign in with your Google account to continue.</p>
                <button
                    onClick={handleLogin}
                    disabled={isLoggingIn}
                    className="w-full inline-flex justify-center items-center gap-3 py-3 px-4 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all text-lg disabled:bg-indigo-400 disabled:cursor-wait"
                >
                    {isLoggingIn ? (
                        <>
                            <div className="spinner !w-5 !h-5 !border-white/50 !border-t-white"></div>
                            <span>Signing in...</span>
                        </>
                    ) : (
                        <>
                            <i className="fa-brands fa-google"></i>
                            <span>Sign in with Google</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default Login;