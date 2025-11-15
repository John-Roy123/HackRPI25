import * as express from "express"
import cors from "cors"
import process from "process";

import { GoogleGenerativeAI } from "@google/generative-ai";
const app = express();

app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({model: "gemini-1.5-flash"});

interface ChatRequest {
    prompt: string;
    system?: string;
    temperature?: number;
}

interface ChatResponse {
    text: string;
}

interface ChatError {
    error: string;
}

app.post("/api/chat", async (req: express.Request, res: express.Response): Promise<void> => {
        try{
                const { prompt, system, temperature = 0.9 }: ChatRequest = req.body ?? {};
                if(!prompt || typeof prompt !=="string"){
                        res.status(400).json({ error: "Missing Prompt" } as ChatError);
                        return;
                }

                const parts = system
                ? [{ role: "user", parts: [{text: system}] }, {role: "user", parts: [{text: prompt}] }]
                : [{role: "user", parts: [{text: prompt}] }];

                const result = await model.generateContent({
                        contents: parts,
                        generationConfig: {
                                maxOutputTokens: 512,
                        },
                });

                const text: string = result.response.text();
                res.json({ text } as ChatResponse);
        } catch (err: unknown){
                console.error(err);
                res.status(500).json({ error: "Chat generation failure"} as ChatError);
        }
});


const port = Number(process.env.PORT) || 3001;
app.listen(port, () => {
    console.log(`Chat server running on http://localhost:${port}`);
});