import { env } from "./config";

export async function getEmbeddings(text: string) {
  const model_id = "sentence-transformers/all-MiniLM-L6-v2";
  const hf_token = env.HF_TOKEN;

  try {
    const response = await fetch(
      `https://api-inference.huggingface.co/pipeline/feature-extraction/${model_id}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${hf_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: text,
          options: { wait_for_model: true },
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch embeddings");
    }

    return response.json();
  } catch (error) {
    console.error(error);
  }
}
