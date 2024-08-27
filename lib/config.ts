import z from 'zod';

const envSchema = z.object({
    GROQ_API_KEY: z.string().trim().min(1),
    PINECONE_API_KEY: z.string().trim().min(1),
    HF_TOKEN: z.string().trim().min(1),
});

export const env = envSchema.parse(process.env);