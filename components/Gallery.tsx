
import React, { useState } from 'react';
import { Collection, Platform } from '../types';
import GalleryItem from './GalleryItem';

interface GalleryProps {
    collections: Collection[];
    onSelectItem: (item: Collection) => void;
    onFilterChange: (searchTerm: string, platform: string) => void;
}

const Gallery: React.FC<GalleryProps> = ({ collections, onSelectItem, onFilterChange }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [platformFilter, setPlatformFilter] = useState('');

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        onFilterChange(e.target.value, platformFilter);
    };

    const handlePlatformChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setPlatformFilter(e.target.value);
        onFilterChange(searchTerm, e.target.value);
    };

    return (
        <section>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
                <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-800">
                    <i className="fa-solid fa-images text-indigo-600"></i>
                    Collection Gallery
                </h2>
                <div className="flex gap-3 w-full md:w-auto">
                    <div className="relative flex-grow">
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={handleSearchChange}
                            placeholder="Search prompt or tags..."
                            className="pl-10 pr-4 py-2 border rounded-lg w-full"
                        />
                        <i className="fa-solid fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                    </div>
                    <select value={platformFilter} onChange={handlePlatformChange} className="border rounded-lg px-3 py-2 bg-white">
                        <option value="">All Platforms</option>
                        {Object.values(Platform).map(p => (
                            <option key={p} value={p} className="capitalize">{p}</option>
                        ))}
                    </select>
                </div>
            </div>

            {collections.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                    {collections.map(item => (
                        <GalleryItem key={item.id} item={item} onSelectItem={onSelectItem} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 text-gray-500">
                    <i className="fa-solid fa-ghost text-5xl mb-4"></i>
                    <p className="text-xl">The gallery is empty.</p>
                    <p>Add a new collection to get started.</p>
                </div>
            )}
        </section>
    );
};

export default Gallery;
