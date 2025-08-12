
import { Platform } from './types';

export const PLATFORM_OPTIONS = [
    { id: Platform.Gemini, value: Platform.Gemini, label: 'Gemini', icon: 'fa-solid fa-gem', color: 'text-blue-600' },
    { id: Platform.Tensor, value: Platform.Tensor, label: 'Tensor', icon: 'fa-solid fa-robot', color: 'text-indigo-600' },
    { id: Platform.Midjourney, value: Platform.Midjourney, label: 'Midjourney', icon: 'fa-brands fa-artstation', color: 'text-purple-600' },
    { id: Platform.Piclumen, value: Platform.Piclumen, label: 'Piclumen', icon: 'fa-solid fa-palette', color: 'text-green-600' },
    { id: Platform.Leonardo, value: Platform.Leonardo, label: 'Leonardo', icon: 'fa-solid fa-paintbrush', color: 'text-amber-600' },
];

export const TENSOR_SAMPLERS = ['euler', 'euler_ancestral', 'heun', 'heunpp2', 'dpm_2', 'dpm_2_ancestral', 'lms', 'dpm_fast', 'dpm_adaptive', 'dpmpp_2s_ancestral', 'dpmpp_sde_gpu', 'dpmpp_2m', 'dpmpp_2m_sde_gpu', 'dpmpp_3m_sde_gpu', 'ddpm', 'lcm', 'restart', 'euler_dy', 'euler_smea_dy', 'ddim', 'uni_pc', 'uni_pc_bh2', 'sde_multistep'];
export const TENSOR_SCHEDULERS = ['normal', 'karras', 'sgm_uniform', 'exponential', 'simple', 'ddim_uniform', 'beta', 'linear quadratic'];

export const MODELS = {
    [Platform.Tensor]: [
        { label: 'Model Populer', options: ['Flux.1-Dev-FP8', 'HUBG_Realistic', 'SD_2.1', 'SDXL', 'PONY'] },
        { label: 'Model Lainnya', options: ['Illustrious', 'DreamShaper', 'RevAnimated', 'RealisticVision'] },
        { label: '', options: ['custom'] }
    ],
    [Platform.Midjourney]: [
        { label: 'All Models', options: ['V7', 'V6', 'V5.2', 'V5.1', 'V5', 'V4', 'V3', 'V2', 'V1', 'Niji V5', 'Niji V4'] }
    ],
    [Platform.Piclumen]: [
        { label: 'All Models', options: ['PicLumen Art V1', 'PicLumen Realistic V2', 'PicLumen Anime V2', 'PicLumen Lineart V1', 'Namiya', 'FLUX.1 Kontext', 'Primo', 'Pony Diffusion V6', 'FLUX.1-schnell', 'FLUX.1-dev'] }
    ],
    [Platform.Leonardo]: [
        { label: 'Preset Model Styles', options: ['Cinematic Kino', 'Concept Art', 'Graphic Design', 'Illustrative Albedo', 'Leonardo Lightning', 'Lifelike Vision', 'Portrait Perfect', 'Stock Photography'] },
        { label: 'Featured Models', options: ['Lucid Realism', 'GPT-Image-1', 'FLUX.1 Kontext', 'Phoenix 1.0', 'Flux Dev', 'Flux Schnell', 'Phoenix 0.9', 'Anime'] }
    ],
    [Platform.Gemini]: [
        { label: 'All Models', options: ['Gemini 2.5 Flash', 'Gemini 2.5 Pro', 'Custom Gem'] }
    ]
};

export const TENSOR_VAES = {
    'VAE Populer': ['vae-ft-mse-840000-ema-pruned', 'orangemix.vae', 'kl-f8-anime2.vae'],
    'VAE Lainnya': ['anything-v4.0.vae', 'wd-1-5-vae']
};
