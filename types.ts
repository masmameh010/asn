
export enum Platform {
    Tensor = 'tensor',
    Midjourney = 'midjourney',
    Gemini = 'gemini',
    Piclumen = 'piclumen',
    Leonardo = 'leonardo',
}

export interface Lora {
    name: string;
    strength: number;
}

export interface TensorData {
    vae: string;
    sampler: string;
    scheduler: string;
    cfg: number;
    steps: number;
    seed: string;
    upscaler: boolean;
    adetailer: boolean;
    lora: Lora[];
}

export interface Collection {
    id: string;
    userId: string;
    imageUrl: string;
    platform: Platform;
    model: string;
    prompt: string;
    negativePrompt: string;
    tags: string;
    notes: string;
    tensorData?: TensorData;
    timestamp: {
        seconds: number;
        nanoseconds: number;
    } | Date;
}

export interface ToastState {
  show: boolean;
  message: string;
}
