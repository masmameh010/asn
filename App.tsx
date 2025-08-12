
import React, { useState, useEffect, useCallback } from 'react';
import { Collection, ToastState, ImageAnalysisResult } from './types';
import { User } from 'firebase/auth';
import Header from './components/Header';
import ActionButtons from './components/ActionButtons';
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
    clearAllCollections as removeAllCollections,
    batchAddCollections
} from './services/firebaseService';
import { uploadImage } from './services/cloudinaryService';
import { generatePromptIdea, analyzeImage } from './services/geminiService';
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
            // Don't show toast on initial load for cleaner UX
            // showToast('Collections loaded successfully.');
        } catch (error: any) {
            let message = 'Connection failed. Displaying locally cached data.';
            if (error?.code === 'failed-precondition') {
                message = 'Database requires an index. See browser console for the creation link.';
                console.error("Firestore index required. Please create it using the link in the error details below:", error);
            } else {
                console.error("Firebase connection failed, loading from local cache:", error);
            }
    
            showToast(message);
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
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during image upload.';
            showToast(`Image Upload Failed: ${errorMessage}`);
            console.error("Cloudinary upload failed:", error);
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
    
    const handleExportCollections = () => {
        if (collections.length === 0) {
            showToast("There is nothing to export.");
            return;
        }
        try {
            const jsonString = JSON.stringify(collections, null, 2);
            const blob = new Blob([jsonString], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            const timestamp = new Date().toISOString().slice(0, 10);
            link.download = `ai-collection-export-${timestamp}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            showToast("Collection exported successfully!");
        } catch (error) {
            console.error("Failed to export collections:", error);
            showToast("An error occurred during export.");
        }
    };

    const handleImportCollections = (file: File) => {
        if (!user) {
            showToast("You must be logged in to import collections.");
            return;
        }
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const content = event.target?.result as string;
                const importedData = JSON.parse(content);

                if (!Array.isArray(importedData)) {
                    throw new Error("Invalid format: JSON file must contain an array.");
                }

                if (importedData.length > 0 && (!importedData[0].prompt || !importedData[0].imageUrl)) {
                    throw new Error("Invalid data: Imported objects are missing required fields like 'prompt' or 'imageUrl'.");
                }

                const existingImageUrls = new Set(collections.map(c => c.imageUrl));
                const newCollectionsToAdd = importedData.filter(item => !existingImageUrls.has(item.imageUrl));

                if (newCollectionsToAdd.length === 0) {
                    showToast("Import complete. No new items were found to add.");
                    return;
                }

                if (!confirm(`You are about to import ${newCollectionsToAdd.length} new item(s). This will add them to your collection. Continue?`)) {
                    return;
                }

                setIsLoading(true);
                
                const collectionsToSave = newCollectionsToAdd.map(({ id, timestamp, userId, ...rest }) => rest);

                await batchAddCollections(user.uid, collectionsToSave);
                showToast(`Successfully imported ${newCollectionsToAdd.length} items! Refreshing data...`);
                await loadCollections(user.uid);

            } catch (error) {
                console.error("Failed to import collections:", error);
                showToast(error instanceof Error ? error.message : "Failed to parse or import the file.");
            } finally {
                setIsLoading(false);
            }
        };
        reader.readAsText(file);
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

    const fileToBase64 = (file: File): Promise<{ base64Data: string; mimeType: string }> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                const result = reader.result as string;
                const base64Data = result.split(',')[1];
                resolve({ base64Data, mimeType: file.type });
            };
            reader.onerror = error => reject(error);
        });
    };

    const handleAnalyzeImage = async (imageFile: File): Promise<ImageAnalysisResult | null> => {
        setIsLoading(true);
        try {
            const { base64Data, mimeType } = await fileToBase64(imageFile);
            const analysis = await analyzeImage(base64Data, mimeType);
            showToast('Image analyzed successfully!');
            return analysis;
        } catch (error) {
            console.error("Error analyzing image:", error);
            showToast(`Error: ${error instanceof Error ? error.message : 'Failed to analyze image.'}`);
            return null;
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
                <ActionButtons 
                    onExport={handleExportCollections}
                    onImport={handleImportCollections}
                    onClearAll={handleClearAll}
                    isCollectionEmpty={collections.length === 0}
                />
                <CollectionForm
                    onAddCollection={handleAddCollection}
                    onGeneratePrompt={handleGeneratePrompt}
                    onAnalyzeImage={handleAnalyzeImage}
                    showToast={showToast}
                    isOnline={true}
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
                    showToast={showToast}
                />
            )}
        </div>
    );
};

export default App;
