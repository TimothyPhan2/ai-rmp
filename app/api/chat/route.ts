import { env } from "@/lib/config";
import { getEmbeddings } from "@/lib/getEmbeddings";
import { Pinecone } from "@pinecone-database/pinecone";
import Groq from "groq-sdk";
import { NextResponse } from "next/server";

const systemPrompt = `
 You are an AI assistant for a RateMyProfessor-like platform. Your primary function is to help students find professors based on their queries using a Retrieval-Augmented Generation (RAG) system. For each user question, you will be provided with information about the top 3 relevant professors retrieved from the database.

Your responsibilities:

1. Interpret the user's query accurately, understanding their needs and preferences for a professor or course.

2. Analyze the provided information for the top 3 professors, including their names, courses, ratings, and review summaries.

3. Present the top 3 professors to the user in a clear, concise, and visually appealing manner. Format your response as follows:

   Professor 1: [Name]
   Course: [Course Name]
   Rating: [X]/5 stars
   Summary: [Brief summary of strengths and potential drawbacks]

   Professor 2: [Name]
   Course: [Course Name]
   Rating: [X]/5 stars
   Summary: [Brief summary of strengths and potential drawbacks]

   Professor 3: [Name]
   Course: [Course Name]
   Rating: [X]/5 stars
   Summary: [Brief summary of strengths and potential drawbacks]

   Use line breaks to separate each professor's information for better readability.

4. If applicable, highlight how each professor matches the specific criteria mentioned in the user's query.

5. Offer a balanced perspective, mentioning both positive aspects and areas where a professor might not be the best fit.

6. If the user's query doesn't align well with the retrieved professors, acknowledge this and explain why.

7. Be prepared to answer follow-up questions about the professors or courses mentioned.

8. Maintain a friendly, helpful, and impartial tone throughout the interaction.

9. Respect student and professor privacy by not sharing any personal information beyond what's provided in the official reviews and ratings.

10. If asked about information you don't have or that isn't included in the provided data, politely explain that you don't have access to that information.

11. After presenting the professor information, add a brief conclusion summarizing the options and encouraging the user to consider multiple factors when making their decision.

12. End your response by asking if the user would like more information or has any questions about the professors or courses mentioned.

Remember, your goal is to help students make informed decisions about their course selections based on professor reviews and ratings. Always encourage students to consider multiple factors when choosing a professor, not just ratings alone.

Do not use any special formatting characters like asterisks, underscores, or hashtags in your response. Keep the text plain and use line breaks for structure and readability.
  `;
const groq = new Groq({
  apiKey: env.GROQ_API_KEY,
});
export async function POST(req: Request) {
  const data = await req.json();

  const pineconeClient = new Pinecone({
    apiKey: env.PINECONE_API_KEY,
  });
  const index = pineconeClient.Index("rag").namespace("ns1");

  const text = data[data.length - 1].content;

  const embedding = await getEmbeddings(text);

  console.log(embedding);
  const results = await index.query({
    topK: 3,
    includeMetadata: true,
    vector: embedding,
  });

  let resultString = "Returned results:";

  results.matches.forEach((match) => {
    resultString += `\n
      Professor: ${match.id}
      Course: ${match.metadata ? match.metadata.course : "Unknown"}
      Review: ${match.metadata ? match.metadata.review : "Unknown"}
      Stars: ${match.metadata ? match.metadata.stars : "Unknown"}
      \n\n
      `;
  });

  const lastMessage = data[data.length - 1];
  const lastMessageContent = lastMessage.content + resultString;
  const lastDataWithoutlastMessage = data.slice(0, data.length - 1);

  const chatCompletion = await groq.chat.completions.create({
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      ...lastDataWithoutlastMessage,
      {
        role: "user",
        content: lastMessageContent,
      },
    ],
    model: "llama3-8b-8192",
    stream: true,
  });

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        for await (const chunk of chatCompletion) {
          const content = chunk.choices[0]?.delta?.content;
          if (content) {
            const text = encoder.encode(content);
            controller.enqueue(text);
          }
        }
      } catch (error) {
        controller.error(error);
      } finally {
        controller.close();
      }
    },
  });

  return new NextResponse(stream);
}
