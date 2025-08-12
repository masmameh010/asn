
import { Collection } from '../types';

const LOCAL_STORAGE_KEY = 'ai_image_collection';

/**
 * Retrieves collections from local storage.
 * Returns an empty array if no data is found or if data is malformed.
 */
export const getCollections = (): Collection[] => {
    try {
        const storedData = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (storedData) {
            return JSON.parse(storedData) as Collection[];
        }
    } catch (error) {
        console.error("Failed to parse collections from local storage:", error);
        // Clear corrupted data
        localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
    return [];
};

/**
 * Saves the entire collection array to local storage.
 */
export const saveCollections = (collections: Collection[]): void => {
    try {
        const dataToStore = JSON.stringify(collections);
        localStorage.setItem(LOCAL_STORAGE_KEY, dataToStore);
    } catch (error) {
        console.error("Failed to save collections to local storage:", error);
    }
};
