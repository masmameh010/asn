
import React, { useState } from 'react';
import { Collection } from '../types';

interface DetailModalProps {
    item: Collection;
    onClose: () => void;
    onDelete: (id: string) => void;
    showToast: (message: string) => void;
}

const DetailModal: React.FC<DetailModalProps> = ({ item, onClose, onDelete, showToast }) => {
    const [feedback, setFeedback] = useState<Record<string, boolean>>({});
    const [isCopying, setIsCopying] = useState(false);
    const [isCopied, setIsCopied] = useState(false);

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text).then(() => {
            setFeedback(prev => ({...prev, [id]: true}));
            setTimeout(() => setFeedback(prev => ({...prev, [id]: false})), 2000);
        }).catch(err => {
            console.error('Failed to copy: ', err);
            showToast('Failed to copy text.');
        });
    };
    
    const handleCopyImage = async () => {
        if (!navigator.clipboard?.write || !window.ClipboardItem) {
            showToast("Your browser does not support copying images.");
            return;
        }
        if (isCopying || isCopied) return;

        setIsCopying(true);
        setIsCopied(false);
    
        try {
            // Fetch the image and convert it to a blob
            const response = await fetch(item.imageUrl);
            const blob = await response.blob();
            
            // Create a ClipboardItem and write it to the clipboard
            await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
            
            showToast("Image copied to clipboard!");
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2500); // Keep "Copied!" message for 2.5s
    
        } catch (error) {
            console.error('Failed to copy image:', error);
            showToast("Failed to copy image. Check browser permissions or CORS policy.");
        } finally {
            setIsCopying(false);
        }
    };


    const copyAllParameters = () => {
        let text = `Prompt: ${item.prompt}\n\n`;
        text += `Negative Prompt: ${item.negativePrompt || 'N/A'}\n\n---\n`;
        text += `Platform: ${item.platform}\nModel: ${item.model}\n`;

        if (item.platform === 'tensor' && item.tensorData) {
            const { tensorData } = item;
            text += `VAE: ${tensorData.vae || 'Default'}\nSampler: ${tensorData.sampler}\n`;
            text += `Scheduler: ${tensorData.scheduler}\nSteps: ${tensorData.steps}\n`;
            text += `CFG Scale: ${tensorData.cfg}\nSeed: ${tensorData.seed}\n`;
            if (tensorData.lora?.length) {
                text += `LoRA: ${tensorData.lora.map(l => `${l.name}: ${l.strength}`).join(', ')}\n`;
            }
            if(tensorData.upscaler) text += `Upscaler: Yes\n`;
            if(tensorData.adetailer) text += `ADetailer: Yes\n`;
        }

        text += `---\nTags: ${item.tags || 'N/A'}\nNotes: ${item.notes || 'N/A'}\nImage URL: ${item.imageUrl}`;
        copyToClipboard(text, 'allParams');
    };

    const tags = item.tags ? item.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [];

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-lg max-w-4xl w-full max-h-[90vh] overflow-auto detail-modal" onClick={e => e.stopPropagation()}>
                <div className="header-gradient text-white p-5 flex justify-between items-center sticky top-0 z-10">
                    <h3 className="text-xl font-bold">Collection Details</h3>
                    <button onClick={onClose} className="text-white hover:text-gray-200"><i className="fa-solid fa-xmark text-2xl"></i></button>
                </div>
                <div className="p-6">
                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Image Column */}
                        <div className="lg:w-2/5">
                            <img src={item.imageUrl} alt="Collection item" className="rounded-xl shadow-lg border w-full" />
                            <div className="mt-4 flex flex-wrap gap-2">
                                <button
                                    onClick={handleCopyImage}
                                    disabled={isCopying || isCopied}
                                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium flex items-center justify-center gap-2 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-all duration-200"
                                >
                                    {isCopying ? (
                                        <><div className="spinner !w-5 !h-5 !border-t-white !border-white/40"></div><span>Copying...</span></>
                                    ) : isCopied ? (
                                        <><i className="fa-solid fa-check"></i><span>Copied!</span></>
                                    ) : (
                                        <><i className="fa-solid fa-copy"></i><span>Copy Image</span></>
                                    )}
                                </button>
                                <button onClick={() => onDelete(item.id)} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium flex items-center justify-center gap-2">
                                    <i className="fa-solid fa-trash"></i> Delete
                                </button>
                            </div>
                        </div>
                        {/* Info Column */}
                        <div className="lg:w-3/5 space-y-4">
                            {/* Copy Section */}
                            <div className="bg-gray-50 rounded-xl p-4">
                                <h4 className="font-semibold text-lg mb-3 flex items-center gap-2"><i className="fa-solid fa-copy"></i>Copy Data</h4>
                                <div className="space-y-2">
                                    <button onClick={() => copyToClipboard(item.prompt, 'prompt')} className="copy-btn w-full text-left px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg flex items-center justify-between text-sm"><span>Copy Prompt</span><span className={`text-indigo-600 transition-opacity duration-300 ${feedback['prompt'] ? 'opacity-100' : 'opacity-0'}`}>Copied!</span></button>
                                    <button onClick={() => copyToClipboard(item.negativePrompt, 'neg-prompt')} className="copy-btn w-full text-left px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg flex items-center justify-between text-sm"><span>Copy Negative Prompt</span><span className={`text-indigo-600 transition-opacity duration-300 ${feedback['neg-prompt'] ? 'opacity-100' : 'opacity-0'}`}>Copied!</span></button>
                                    <button onClick={copyAllParameters} className="copy-btn w-full text-left px-3 py-2 bg-indigo-200 hover:bg-indigo-300 rounded-lg flex items-center justify-between font-semibold text-indigo-800"><span>Copy All Parameters</span><span className={`text-indigo-600 transition-opacity duration-300 ${feedback['allParams'] ? 'opacity-100' : 'opacity-0'}`}>Copied!</span></button>
                                </div>
                            </div>

                            {/* Details */}
                            <div>
                                <h4 className="font-semibold text-lg mb-2 flex items-center gap-2"><i className="fa-solid fa-comment"></i>Prompt</h4>
                                <p className="text-gray-700 leading-relaxed bg-gray-50 p-3 rounded-lg break-words text-sm">{item.prompt}</p>
                            </div>
                            <div>
                                <h4 className="font-semibold text-lg mb-2 flex items-center gap-2"><i className="fa-solid fa-ban"></i>Negative Prompt</h4>
                                <p className="text-gray-700 leading-relaxed bg-gray-50 p-3 rounded-lg break-words text-sm">{item.negativePrompt || 'N/A'}</p>
                            </div>

                            {/* Parameters */}
                            <div className="bg-gray-50 rounded-lg p-4">
                                <h4 className="font-semibold text-lg flex items-center gap-2"><i className="fa-solid fa-info-circle"></i>Parameters</h4>
                                <div className="mt-3 space-y-2 text-sm">
                                    <p><strong>Platform:</strong> <span className="font-normal capitalize">{item.platform}</span></p>
                                    <p><strong>Model:</strong> <span className="font-normal">{item.model}</span></p>
                                    {item.platform === 'tensor' && item.tensorData &&
                                        <div className="space-y-2 mt-2 pt-2 border-t">
                                            <p><strong>VAE:</strong> <span className="font-normal">{item.tensorData.vae || 'Default'}</span></p>
                                            <p><strong>Sampler:</strong> <span className="font-normal">{item.tensorData.sampler}</span></p>
                                            <p><strong>Scheduler:</strong> <span className="font-normal">{item.tensorData.scheduler}</span></p>
                                            <p><strong>Steps:</strong> <span className="font-normal">{item.tensorData.steps}</span></p>
                                            <p><strong>CFG Scale:</strong> <span className="font-normal">{item.tensorData.cfg}</span></p>
                                            <p><strong>Seed:</strong> <span className="font-normal">{item.tensorData.seed}</span></p>
                                            {item.tensorData.lora && item.tensorData.lora.length > 0 && <div><strong>LoRA:</strong> {item.tensorData.lora.map(l => `${l.name} (${l.strength})`).join(', ')}</div>}
                                            <div className="flex gap-2 mt-1">
                                                {item.tensorData.upscaler && <span className="inline-block py-1 px-2 text-xs font-medium text-yellow-800 bg-yellow-100 rounded-full">Upscaler</span>}
                                                {item.tensorData.adetailer && <span className="inline-block py-1 px-2 text-xs font-medium text-yellow-800 bg-yellow-100 rounded-full">ADetailer</span>}
                                            </div>
                                        </div>
                                    }
                                </div>
                            </div>
                            
                            {/* Tags and Notes */}
                            <div>
                                <h4 className="font-semibold text-lg mb-2 flex items-center gap-2"><i className="fa-solid fa-tags"></i>Tags</h4>
                                <div className="flex flex-wrap gap-2">
                                    {tags.length > 0 ? tags.map(tag => <span key={tag} className="inline-block py-1 px-3 text-sm font-medium text-indigo-800 bg-indigo-100 rounded-full">{tag}</span>) : <p className='text-sm text-gray-500'>No tags</p>}
                                </div>
                            </div>
                             <div>
                                <h4 className="font-semibold text-lg mb-2 flex items-center gap-2"><i className="fa-solid fa-sticky-note"></i>Notes</h4>
                                <p className="text-gray-700 bg-gray-50 p-3 rounded-lg min-h-[4rem] break-words text-sm">{item.notes || 'No notes.'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DetailModal;
