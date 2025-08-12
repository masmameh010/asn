
import React, { useState, useRef } from 'react';
import { Collection, Lora, Platform, TensorData } from '../types';
import { PLATFORM_OPTIONS, MODELS, TENSOR_SAMPLERS, TENSOR_SCHEDULERS, TENSOR_VAES } from '../constants';

interface CollectionFormProps {
    onAddCollection: (newCollectionData: Omit<Collection, 'id' | 'timestamp' | 'imageUrl' | 'userId'>, imageFile: File) => Promise<boolean>;
    onClearAll: () => Promise<void>;
    onGeneratePrompt: () => Promise<string>;
    showToast: (message: string) => void;
    isOnline: boolean;
}

const initialLoras: Partial<Lora>[] = Array(6).fill({ name: '', strength: 0.8 });

const CollectionForm: React.FC<CollectionFormProps> = ({ onAddCollection, onClearAll, onGeneratePrompt, showToast, isOnline }) => {
    const [platform, setPlatform] = useState<Platform>(Platform.Gemini);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [prompt, setPrompt] = useState('');
    const [negativePrompt, setNegativePrompt] = useState('');
    const [tags, setTags] = useState('');
    const [notes, setNotes] = useState('');
    const [model, setModel] = useState('Gemini 2.5 Flash');
    const [customModel, setCustomModel] = useState('');

    // Tensor specific state
    const [vae, setVae] = useState('');
    const [sampler, setSampler] = useState('dpmpp_2m');
    const [scheduler, setScheduler] = useState('normal');
    const [cfg, setCfg] = useState<number>(3.5);
    const [steps, setSteps] = useState<number>(30);
    const [seed, setSeed] = useState('');
    const [upscaler, setUpscaler] = useState(false);
    const [adetailer, setAdetailer] = useState(true);
    const [loras, setLoras] = useState<(Lora | {})[]>(initialLoras);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const importInputRef = useRef<HTMLInputElement>(null);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const resetForm = () => {
        setPlatform(Platform.Gemini);
        setImageFile(null);
        setPreviewUrl(null);
        setPrompt('');
        setNegativePrompt('');
        setTags('');
        setNotes('');
        setModel('Gemini 2.5 Flash');
        setCustomModel('');
        setVae('');
        setSampler('dpmpp_2m');
        setScheduler('normal');
        setCfg(3.5);
        setSteps(30);
        setSeed('');
        setUpscaler(false);
        setAdetailer(true);
        setLoras(initialLoras);
        if(fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isOnline) {
            showToast("Cannot save: Application is offline.");
            return;
        }
        if (!imageFile) {
            showToast('Please select an image first!');
            return;
        }
        setIsSubmitting(true);
        const finalModel = model === 'custom' ? customModel : model;
        const collectionData: Omit<Collection, 'id' | 'timestamp' | 'imageUrl' | 'userId'> = {
            platform,
            model: finalModel,
            prompt,
            negativePrompt,
            tags,
            notes,
        };
        if (platform === Platform.Tensor) {
            collectionData.tensorData = {
                vae,
                sampler,
                scheduler,
                cfg,
                steps,
                seed: seed || 'random',
                upscaler,
                adetailer,
                lora: loras.filter(l => (l as Lora).name) as Lora[],
            };
        }
        const success = await onAddCollection(collectionData, imageFile);
        if (success) {
            resetForm();
        }
        setIsSubmitting(false);
    };
    
    const handleGenerateClick = async () => {
        const generatedPrompt = await onGeneratePrompt();
        if (generatedPrompt) {
            setPrompt(generatedPrompt);
        }
    };
    
    const handlePlatformChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newPlatform = e.target.value as Platform;
        setPlatform(newPlatform);
        // Set default model for the selected platform
        const modelGroups = MODELS[newPlatform];
        if (modelGroups && modelGroups.length > 0 && modelGroups[0].options.length > 0) {
            setModel(modelGroups[0].options[0]);
        } else {
            setModel('');
        }
    };
    
    const handleExport = () => {
        // This is a simplified version. For full functionality, it should get data from App.tsx state.
        showToast("Export functionality is handled at the App level.");
    };

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const importedData = JSON.parse(event.target?.result as string);
                if (Array.isArray(importedData)) {
                    // This logic should ideally be in App.tsx to update the main state
                    showToast(`${importedData.length} items ready for import. (App-level logic needed)`);
                } else {
                    showToast('Invalid JSON file format.');
                }
            } catch (error) {
                showToast('Failed to parse JSON file.');
            }
        };
        reader.readAsText(file);
    };

    const renderTensorFields = () => (
        <div className="bg-indigo-50 border-l-4 border-indigo-500 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold mb-4 text-indigo-700 flex items-center gap-2"><i className="fa-solid fa-sliders"></i>Tensor Settings</h3>
            {/* Models and VAE */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                 <div>
                    <label className="block mb-2 font-medium text-gray-700">Model / Checkpoint</label>
                    <select value={model} onChange={(e) => setModel(e.target.value)} className="block w-full p-3 border rounded-lg bg-white">
                         {MODELS[Platform.Tensor].map(group => (
                            <optgroup label={group.label} key={group.label}>
                                {group.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </optgroup>
                        ))}
                    </select>
                    {model === 'custom' && <input type="text" value={customModel} onChange={e => setCustomModel(e.target.value)} className="block w-full p-3 border rounded-lg mt-2" placeholder="Custom model name"/>}
                </div>
                <div>
                    <label className="block mb-2 font-medium text-gray-700">VAE</label>
                    <select value={vae} onChange={e => setVae(e.target.value)} className="block w-full p-3 border rounded-lg bg-white">
                        <option value="">Default</option>
                        {Object.entries(TENSOR_VAES).map(([group, options]) => (
                            <optgroup label={group} key={group}>
                                {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </optgroup>
                        ))}
                    </select>
                </div>
            </div>
            {/* Sampler, Scheduler, CFG */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div>
                    <label className="block mb-2 font-medium text-gray-700">Sampler</label>
                    <select value={sampler} onChange={e => setSampler(e.target.value)} className="block w-full p-3 border rounded-lg bg-white">
                        {TENSOR_SAMPLERS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block mb-2 font-medium text-gray-700">Scheduler</label>
                    <select value={scheduler} onChange={e => setScheduler(e.target.value)} className="block w-full p-3 border rounded-lg bg-white">
                        {TENSOR_SCHEDULERS.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block mb-2 font-medium text-gray-700">Guidance Scale</label>
                    <input type="number" value={cfg} onChange={e => setCfg(parseFloat(e.target.value))} min="0" max="20" step="0.1" className="block w-full p-3 border rounded-lg" />
                </div>
            </div>
             {/* Steps, Seed, Upscaler, Adetailer */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div>
                    <label className="block mb-2 font-medium text-gray-700">Steps</label>
                    <input type="number" value={steps} onChange={e => setSteps(parseInt(e.target.value, 10))} min="1" max="150" className="block w-full p-3 border rounded-lg" />
                </div>
                <div>
                    <label className="block mb-2 font-medium text-gray-700">Seed</label>
                    <input type="number" value={seed} onChange={e => setSeed(e.target.value)} className="block w-full p-3 border rounded-lg" placeholder="Random if empty"/>
                </div>
                <div className="flex items-center mt-6 gap-4">
                    <div className="flex items-center">
                        <input type="checkbox" id="upscaler" checked={upscaler} onChange={e => setUpscaler(e.target.checked)} className="w-5 h-5 text-indigo-600 rounded" />
                        <label htmlFor="upscaler" className="ml-2 font-medium text-gray-700">Upscaler</label>
                    </div>
                     <div className="flex items-center">
                        <input type="checkbox" id="adetailer" checked={adetailer} onChange={e => setAdetailer(e.target.checked)} className="w-5 h-5 text-indigo-600 rounded" />
                        <label htmlFor="adetailer" className="ml-2 font-medium text-gray-700">ADetailer</label>
                    </div>
                </div>
            </div>
             {/* LoRA */}
            <div className="mb-6">
                <label className="block mb-3 font-medium text-gray-700">LoRA (Max 6)</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {loras.map((lora, index) => (
                        <div key={index} className="space-y-1">
                             <input type="text" value={(lora as Lora).name || ''} onChange={e => {const newLoras = [...loras]; newLoras[index] = {...newLoras[index], name: e.target.value}; setLoras(newLoras);}} placeholder={`LoRA ${index + 1} Name`} className="block w-full p-2 border rounded-lg text-sm" />
                             <input type="number" value={(lora as Lora).strength ?? 0.8} onChange={e => {const newLoras = [...loras]; newLoras[index] = {...newLoras[index], strength: parseFloat(e.target.value)}; setLoras(newLoras);}} min="0" max="2" step="0.1" className="block w-full p-2 border rounded-lg text-sm" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderAltModelFields = () => (
        <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold mb-4 text-blue-700 flex items-center gap-2"><i className="fa-solid fa-gear"></i>Model Settings</h3>
            <div>
                 <label className="block mb-2 font-medium text-gray-700 capitalize">{platform} Model</label>
                 <select value={model} onChange={e => setModel(e.target.value)} className="block w-full p-3 border rounded-lg bg-white">
                      {MODELS[platform] && MODELS[platform].map(group => (
                        <optgroup label={group.label} key={group.label}>
                            {group.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </optgroup>
                    ))}
                </select>
            </div>
        </div>
    );

    return (
        <div className="bg-white rounded-2xl shadow-xl mb-8 overflow-hidden">
            <div className="header-gradient p-5 text-white">
                <h2 className="text-xl font-bold flex items-center gap-2"><i className="fa-solid fa-plus-circle"></i>Add New Collection</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-5">
                {/* Image Upload */}
                <div className="mb-6">
                    <label className="block mb-3 font-medium text-gray-700 text-lg"><i className="fa-solid fa-image mr-2"></i>Upload AI Image</label>
                    <div className="flex items-center justify-center w-full">
                        <label htmlFor="imageInput" className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 border-gray-300 hover:border-indigo-400">
                            {previewUrl ? <img src={previewUrl} alt="Preview" className="max-h-full rounded-lg shadow-md" /> :
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <i className="fa-solid fa-cloud-arrow-up text-4xl text-gray-400 mb-3"></i>
                                    <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click to upload</span> or drag & drop</p>
                                    <p className="text-xs text-gray-500">PNG, JPG (Max. 2MB)</p>
                                </div>
                            }
                        </label>
                        <input id="imageInput" type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageChange} required />
                    </div>
                </div>

                 {/* Prompts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                        <label htmlFor="prompt" className="block mb-2 font-medium text-gray-700"><i className="fa-solid fa-keyboard mr-2"></i>Prompt</label>
                        <textarea id="prompt" value={prompt} onChange={e => setPrompt(e.target.value)} rows={4} className="block w-full p-4 border rounded-xl focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500" placeholder="Enter prompt used to generate this image..." required></textarea>
                         <button type="button" onClick={handleGenerateClick} className="mt-2 px-3 py-1 bg-violet-100 text-violet-700 rounded-lg hover:bg-violet-200 text-sm font-medium flex items-center gap-2"><i className="fa-solid fa-wand-magic-sparkles"></i>Get Idea with Gemini</button>
                    </div>
                    <div>
                        <label htmlFor="negativePrompt" className="block mb-2 font-medium text-gray-700"><i className="fa-solid fa-ban mr-2"></i>Negative Prompt</label>
                        <textarea id="negativePrompt" value={negativePrompt} onChange={e => setNegativePrompt(e.target.value)} rows={3} className="block w-full p-4 border rounded-xl focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500" placeholder="Undesired elements in the image..."></textarea>
                    </div>
                </div>

                {/* Platform Selection */}
                <div className="mb-6">
                    <label className="block mb-3 font-medium text-gray-700 text-lg"><i className="fa-solid fa-cube mr-2"></i>Select Platform</label>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {PLATFORM_OPTIONS.map(opt => (
                            <div key={opt.id}>
                                <input type="radio" name="platform" id={opt.id} value={opt.value} checked={platform === opt.value} onChange={handlePlatformChange} className="hidden peer" />
                                <label htmlFor={opt.id} className={`flex flex-col items-center justify-center p-4 bg-white border-2 border-gray-300 rounded-xl cursor-pointer peer-checked:border-indigo-500 peer-checked:ring-2 peer-checked:ring-indigo-200 hover:bg-gray-50 transition-all duration-300`}>
                                    <i className={`${opt.icon} text-3xl mb-3 ${opt.color}`}></i>
                                    <span className="font-medium">{opt.label}</span>
                                </label>
                            </div>
                        ))}
                    </div>
                </div>
                
                {platform === Platform.Tensor ? renderTensorFields() : renderAltModelFields()}

                {/* Metadata */}
                <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center gap-2"><i className="fa-solid fa-tags text-indigo-500"></i>Metadata</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="tags" className="block mb-2 font-medium text-gray-700">Tags</label>
                            <input type="text" id="tags" value={tags} onChange={e => setTags(e.target.value)} className="block w-full p-3 border rounded-lg" placeholder="Comma separated (e.g., portrait, digital art)" />
                        </div>
                        <div>
                            <label htmlFor="notes" className="block mb-2 font-medium text-gray-700">Notes</label>
                            <textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="block w-full p-3 border rounded-lg" placeholder="Additional notes about the prompt or image..."></textarea>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-8 flex flex-wrap gap-3">
                    <button
                        type="submit"
                        disabled={isSubmitting || !isOnline}
                        className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 flex items-center gap-2 font-medium disabled:bg-indigo-400 disabled:cursor-not-allowed"
                        title={!isOnline ? "Cannot save while offline" : "Save Collection"}
                    >
                        {isSubmitting ? <><div className="spinner !w-5 !h-5 !border-white/50 !border-t-white"></div><span>Saving...</span></> : <><i className="fa-solid fa-save"></i><span>Save Collection</span></>}
                    </button>
                    <button type="button" onClick={handleExport} className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 flex items-center gap-2 font-medium">
                        <i className="fa-solid fa-file-export"></i>Export JSON
                    </button>
                    <button type="button" onClick={() => importInputRef.current?.click()} className="px-6 py-3 bg-yellow-500 text-white rounded-xl hover:bg-yellow-600 flex items-center gap-2 font-medium">
                        <i className="fa-solid fa-file-import"></i>Import JSON
                    </button>
                    <input type="file" ref={importInputRef} onChange={handleImport} accept="application/json" className="hidden" />
                    <button type="button" onClick={() => { resetForm(); showToast('Form has been reset.'); }} className="px-6 py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600 flex items-center gap-2 font-medium">
                        <i className="fa-solid fa-undo"></i>Reset Form
                    </button>
                    <button type="button" onClick={onClearAll} disabled={!isOnline} className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 flex items-center gap-2 font-medium disabled:bg-red-400 disabled:cursor-not-allowed">
                        <i className="fa-solid fa-trash"></i>Clear All
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CollectionForm;
