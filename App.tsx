
import React, { useState, useEffect, useCallback } from 'react';
import { Collection, ToastState } from './types';
import { User } from 'firebase/auth';
import Header from './components/Header';
import CollectionForm from './components/CollectionForm';
import Gallery from './components/Gallery';
import DetailModal from './components/DetailModal';
import LoadingOverlay from './components/LoadingOverlay';
import Toast from './components/Toast';
import Login from './components/Login';
import {
    auth, onAuthStateChanged, signInWithGoogle, signOutUser,
    loadCollections as fetchCollections,
    addCollection as saveCollection,
    deleteCollection as removeCollection,
    clearAllCollections as removeAllCollections
} from './services/firebaseService';
import { uploadImage } from './services/cloudinaryService';
import { generatePromptIdea } from './services/geminiService';
import { getCollections as getLocalCollections, saveCollections as saveLocalCollections } from './services/localStoreService';

const App: React.FC = () => {
    const [collections, setCollections] = useState<Collection[]>([]);
    const [filteredCollections, setFilteredCollections] = useState<Collection[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isAuthLoading, setIsAuthLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState<Collection | null>(null);
    const [toast, setToast] = useState<ToastState>({ show: false, message: '' });
    const [user, setUser] = useState<User | null>(null);

    const showToast = useCallback((message: string) => {
        setToast({ show: true, message });
        setTimeout(() => {
            setToast({ show: false, message: '' });
        }, 4000);
    }, []);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setIsAuthLoading(false);
            if (!currentUser) {
                // Clear data on logout
                setCollections([]);
                setFilteredCollections([]);
            }
        });
        return () => unsubscribe();
    }, []);

    const loadCollections = useCallback(async (userId: string) => {
        setIsLoading(true);
        try {
            const fetchedCollections = await fetchCollections(userId);
            setCollections(fetchedCollections);
            setFilteredCollections(fetchedCollections);
            saveLocalCollections(fetchedCollections);
            showToast('Collections loaded successfully.');
        } catch (error) {
            console.error("Firebase connection failed, loading from local cache:", error);
            showToast('Connection failed. Displaying locally cached data.');
            const cachedCollections = getLocalCollections();
            setCollections(cachedCollections);
            setFilteredCollections(cachedCollections);
        } finally {
            setIsLoading(false);
        }
    }, [showToast]);
    
    useEffect(() => {
        if (user) {
            loadCollections(user.uid);
        }
    }, [user, loadCollections]);

    const handleAddCollection = async (newCollectionData: Omit<Collection, 'id' | 'timestamp' | 'imageUrl' | 'userId'>, imageFile: File) => {
        if (!user) {
            showToast("You must be logged in to save a collection.");
            return false;
        }
        setIsLoading(true);
        let imageUrl: string;

        try {
            imageUrl = await uploadImage(imageFile);
        } catch (error) {
            const errorMessage = error instanceof Error && error.message.includes('Invalid extension')
                ? "Image upload failed. Check 'simpan_lokal' preset in Cloudinary for transformation errors."
                : `Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`;
            showToast(errorMessage);
            setIsLoading(false);
            return false;
        }

        try {
            const collectionWithUser = { ...newCollectionData, imageUrl, userId: user.uid };
            const addedCollection = await saveCollection(collectionWithUser);
            const newCollections = [addedCollection, ...collections];
            setCollections(newCollections);
            setFilteredCollections(newCollections);
            saveLocalCollections(newCollections);
            showToast('Collection saved successfully!');
            setIsLoading(false);
            return true;
        } catch (error) {
            console.error("Error saving collection to Firestore:", error);
            showToast('Failed to save collection data.');
            setIsLoading(false);
            return false;
        }
    };

    const handleDeleteCollection = async (id: string) => {
        if (!confirm('Are you sure you want to delete this item?')) return;
        setIsLoading(true);
        try {
            await removeCollection(id);
            const newCollections = collections.filter(item => item.id !== id);
            setCollections(newCollections);
            setFilteredCollections(newCollections);
            saveLocalCollections(newCollections);
            setSelectedItem(null);
            showToast('Item deleted successfully.');
        } catch (error) {
            console.error("Error deleting collection:", error);
            showToast('Failed to delete item.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleClearAll = async () => {
        if (!user) {
            showToast("You must be logged in to clear collections.");
            return;
        }
        if (!confirm('Are you sure you want to delete ALL your collections? This action cannot be undone.')) return;
        setIsLoading(true);
        try {
            await removeAllCollections(user.uid);
            const newCollections: Collection[] = [];
            setCollections(newCollections);
            setFilteredCollections(newCollections);
            saveLocalCollections(newCollections);
            setSelectedItem(null);
            showToast('All your collections have been deleted.');
        } catch (error) {
            console.error("Error clearing collections:", error);
            showToast('Failed to clear all collections.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGeneratePrompt = async (): Promise<string> => {
        setIsLoading(true);
        try {
            const prompt = await generatePromptIdea();
            showToast('Prompt idea generated!');
            return prompt;
        } catch (error) {
            console.error("Error generating prompt:", error);
            showToast(`Error: ${error instanceof Error ? error.message : 'Failed to generate prompt.'}`);
            return '';
        } finally {
            setIsLoading(false);
        }
    };

    const handleFilterChange = (searchTerm: string, platform: string) => {
        const filtered = collections.filter(item => {
            const lowerSearchTerm = searchTerm.toLowerCase();
            const matchesSearch = searchTerm === '' ||
                item.prompt.toLowerCase().includes(lowerSearchTerm) ||
                item.tags.toLowerCase().includes(lowerSearchTerm) ||
                item.model.toLowerCase().includes(lowerSearchTerm);

            const matchesPlatform = platform === '' || item.platform === platform;

            return matchesSearch && matchesPlatform;
        });
        setFilteredCollections(filtered);
    };

    if (isAuthLoading) {
        return <LoadingOverlay />;
    }

    if (!user) {
        return <Login onLogin={signInWithGoogle} showToast={showToast} />;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-100">
            {isLoading && <LoadingOverlay />}
            <Toast message={toast.message} show={toast.show} />
            <div className="max-w-6xl mx-auto px-4 py-6">
                <Header user={user} onSignOut={signOutUser} />
                {/* ConnectionStatus is less relevant now as data loads only if online, but can be kept for UI feedback */}
                <CollectionForm
                    onAddCollection={handleAddCollection}
                    onClearAll={handleClearAll}
                    onGeneratePrompt={handleGeneratePrompt}
                    showToast={showToast}
                    isOnline={true} // Assume online if logged in
                />
                <Gallery
                    collections={filteredCollections}
                    onSelectItem={setSelectedItem}
                    onFilterChange={handleFilterChange}
                />
            </div>
            {selectedItem && (
                <DetailModal
                    item={selectedItem}
                    onClose={() => setSelectedItem(null)}
                    onDelete={handleDeleteCollection}
                />
            )}
        </div>
    );
};

export default App;