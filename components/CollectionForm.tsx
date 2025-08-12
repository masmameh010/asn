
import React, { useState, useRef } from 'react';
import { Collection, Lora, Platform, TensorData, ImageAnalysisResult } from '../types';
import { PLATFORM_OPTIONS, MODELS, TENSOR_SAMPLERS, TENSOR_SCHEDULERS, TENSOR_VAES } from '../constants';

interface CollectionFormProps {
    onAddCollection: (newCollectionData: Omit<Collection, 'id' | 'timestamp' | 'imageUrl' | 'userId'>, imageFile: File) => Promise<boolean>;
    onGeneratePrompt: () => Promise<string>;
    onAnalyzeImage: (imageFile: File) => Promise<ImageAnalysisResult | null>;
    showToast: (message: string) => void;
    isOnline: boolean;
}

const initialLoras: Partial<Lora>[] = Array(6).fill({ name: '', strength: 0.8 });

const CollectionForm: React.FC<CollectionFormProps> = ({ onAddCollection, onGeneratePrompt, onAnalyzeImage, showToast, isOnline }) => {
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
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

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

    const handleAnalyzeClick = async () => {
        if (!imageFile) {
            showToast("Please select an image to analyze.");
            return;
        }
        setIsAnalyzing(true);
        const result = await onAnalyzeImage(imageFile);
        if (result) {
            setPrompt(result.suggestedPrompt);
            setTags(result.suggestedTags.join(', '));
            const suggestedPlatform = result.suggestedPlatform.toLowerCase();
            if (Object.values(Platform).includes(suggestedPlatform as Platform)) {
                setPlatform(suggestedPlatform as Platform);
            } else {
                showToast(`Could not set platform to "${result.suggestedPlatform}", please select manually.`);
            }
        }
        setIsAnalyzing(false);
    };
    
    const handlePlatformChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newPlatform = e.target.value as Platform;
        setPlatform(newPlatform);
        const modelGroups = MODELS[newPlatform];
        if (modelGroups && modelGroups.length > 0 && modelGroups[0].options.length > 0) {
            setModel(modelGroups[0].options[0]);
        } else {
            setModel('');
        }
    };
    
    const renderTensorFields = () => (
        <div className="bg-indigo-50 border-l-4 border-indigo-500 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold mb-4 text-indigo-700 flex items-center gap-2"><i className="fa-solid fa-sliders"></i>Tensor Settings</h3>
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
                    {imageFile && (
                         <button 
                            type="button" 
                            onClick={handleAnalyzeClick} 
                            disabled={isAnalyzing}
                            className="mt-3 w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium flex items-center justify-center gap-2 disabled:bg-purple-400"
                         >
                            {isAnalyzing ? <><div className="spinner !w-5 !h-5 !border-white/50 !border-t-white"></div><span>Analyzing...</span></> : <><i className="fa-solid fa-wand-magic-sparkles"></i><span>Analyze with Gemini</span></>}
                         </button>
                    )}
                </div>

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

                <div className="mb-6">
                    <label className="block mb-3 font-medium text-gray-700 text-lg"><i className="fa-solid fa-cube mr-2"></i>Select Platform</label>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {PLATFORM_OPTIONS.map(opt => (
                            <div key={opt.id}>
                                <input type="radio" name="platform" id={opt.id} value={opt.value} checked={platform === opt.value} onChange={handlePlatformChange} className="hidden peer" />
                                <label htmlFor={opt.id} className={`flex flex-col items-center justify-center p-4 bg-white border-2 border-gray-300 rounded-xl cursor-pointer peer-checked:border-indigo-500 peer-checked:ring-2 peer-checked:ring-indigo-200 hover:bg-gray-50 transition-all duration-300`}>
                                    <i className={`${opt.icon} ${opt.color} text-3xl mb-2`}></i>
                                    <span className="font-semibold text-gray-700">{opt.label}</span>
                                </label>
                            </div>
                        ))}
                    </div>
                </div>

                {platform === Platform.Tensor ? renderTensorFields() : renderAltModelFields()}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                        <label htmlFor="tags" className="block mb-2 font-medium text-gray-700"><i className="fa-solid fa-tags mr-2"></i>Tags</label>
                        <input id="tags" type="text" value={tags} onChange={e => setTags(e.target.value)} className="block w-full p-4 border rounded-xl focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500" placeholder="e.g. fantasy, portrait, 4k" />
                    </div>
                     <div>
                        <label htmlFor="notes" className="block mb-2 font-medium text-gray-700"><i className="fa-solid fa-sticky-note mr-2"></i>Notes</label>
                        <textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} rows={1} className="block w-full p-4 border rounded-xl focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500" placeholder="Any additional notes..."></textarea>
                    </div>
                </div>

                <div className="pt-6 border-t mt-4 flex flex-col sm:flex-row gap-3">
                    <button type="submit" disabled={isSubmitting} className="flex-1 w-full px-6 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 flex items-center justify-center gap-2">
                         {isSubmitting ? <><div className="spinner !w-5 !h-5 !border-white/50 !border-t-white"></div><span>Saving...</span></> : <><i className="fa-solid fa-save"></i><span>Save Collection</span></>}
                    </button>
                    <button type="button" onClick={resetForm} className="w-full sm:w-auto px-6 py-3 bg-gray-500 text-white font-bold rounded-lg hover:bg-gray-600 flex items-center justify-center gap-2">
                        <i className="fa-solid fa-arrows-rotate"></i><span>Reset Form</span>
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CollectionForm;
