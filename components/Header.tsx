
import React from 'react';
import { User } from 'firebase/auth';

interface HeaderProps {
    user: User | null;
    onSignOut: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onSignOut }) => {
    return (
        <header className="mb-8">
            <div className="header-gradient text-white py-4 px-6 rounded-2xl shadow-lg mb-4 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                        <i className="fa-solid fa-cloud-arrow-up"></i>
                        AI Image Collection Manager
                    </h1>
                    <p className="text-indigo-100 text-base">by IMAJINASILOKAL</p>
                </div>
                {user && (
                    <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                            <span className="font-medium">{user.displayName}</span>
                            <p className="text-xs text-indigo-200">{user.email}</p>
                        </div>
                        <img src={user.photoURL || undefined} alt="User" className="w-12 h-12 rounded-full border-2 border-white" />
                        <button 
                            onClick={onSignOut}
                            className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2"
                            title="Sign Out"
                        >
                            <i className="fa-solid fa-right-from-bracket"></i>
                            <span className="hidden md:inline">Sign Out</span>
                        </button>
                    </div>
                )}
            </div>
             <p className="text-gray-600 max-w-2xl mx-auto text-center">
                Save and manage your collection of AI-generated images with their prompts and parameters easily.
                Data is secured in Firestore and images on Cloudinary.
            </p>
        </header>
    );
};

export default Header;
