
import React from 'react';
import { Collection } from '../types';

interface GalleryItemProps {
    item: Collection;
    onSelectItem: (item: Collection) => void;
}

const GalleryItem: React.FC<GalleryItemProps> = ({ item, onSelectItem }) => {
    const tags = item.tags ? item.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [];

    return (
        <div className="bg-white rounded-xl overflow-hidden border border-gray-200 flex flex-col shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="relative">
                <img
                    src={item.imageUrl}
                    alt={item.prompt.substring(0, 50)}
                    className="w-full h-48 object-cover"
                    onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.onerror = null;
                        target.src = 'https://placehold.co/500x500/e2e8f0/e2e8f0?text=Error';
                    }}
                />
                <div className="absolute top-2 right-2">
                    <span className="inline-block py-1 px-3 text-xs font-semibold text-indigo-800 bg-indigo-100 rounded-full capitalize">{item.platform}</span>
                </div>
            </div>
            <div className="p-4 flex flex-col flex-grow">
                <h3 className="font-semibold mb-1 truncate" title={item.model}>{item.model || 'N/A'}</h3>
                <p className="text-sm text-gray-600 mb-3 flex-grow" title={item.prompt}>
                    {item.prompt.substring(0, 50)}{item.prompt.length > 50 ? '...' : ''}
                </p>
                <div className="flex flex-wrap gap-1 mb-3 h-6 overflow-hidden">
                    {tags.slice(0, 3).map(tag => (
                        <span key={tag} className="inline-block py-1 px-2 text-xs font-medium text-gray-700 bg-gray-200 rounded-full">{tag}</span>
                    ))}
                </div>
                <button
                    onClick={() => onSelectItem(item)}
                    className="w-full mt-auto py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors"
                >
                    View Details
                </button>
            </div>
        </div>
    );
};

export default GalleryItem;
