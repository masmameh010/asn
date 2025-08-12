
import React, { useRef } from 'react';

interface ActionButtonsProps {
    onExport: () => void;
    onImport: (file: File) => void;
    onClearAll: () => void;
    isCollectionEmpty: boolean;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({ onExport, onImport, onClearAll, isCollectionEmpty }) => {
    const importInputRef = useRef<HTMLInputElement>(null);

    const handleImportClick = () => {
        importInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onImport(file);
            // Reset input so the same file can be selected again
            if (importInputRef.current) {
                importInputRef.current.value = '';
            }
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-lg p-4 mb-8">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                <button
                    onClick={onExport}
                    disabled={isCollectionEmpty}
                    className="flex-grow sm:flex-grow-0 px-5 py-2.5 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
                >
                    <i className="fa-solid fa-file-export"></i>
                    <span>Export JSON</span>
                </button>
                <button
                    onClick={handleImportClick}
                    className="flex-grow sm:flex-grow-0 px-5 py-2.5 bg-yellow-500 text-white font-bold rounded-lg hover:bg-yellow-600 flex items-center justify-center gap-2 transition-colors"
                >
                    <i className="fa-solid fa-file-import"></i>
                    <span>Import JSON</span>
                </button>
                <input
                    type="file"
                    ref={importInputRef}
                    onChange={handleFileChange}
                    accept="application/json,.json"
                    className="hidden"
                />
                <div className="flex-grow hidden sm:block"></div> {/* Spacer */}
                <button
                    onClick={onClearAll}
                    disabled={isCollectionEmpty}
                    className="flex-grow sm:flex-grow-0 px-5 py-2.5 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
                >
                    <i className="fa-solid fa-trash-can"></i>
                    <span>Clear All</span>
                </button>
            </div>
        </div>
    );
};

export default ActionButtons;
