export type ChatOptions = {
    system?: string;
    temperature?: number;
    signal?: AbortSignal;


};

export class ChatService{
    constructor(private baseUrl = "http://localhost:3001") {}

    async ask(prompt: string, opts: ChatOptions = {}): Promise<string>{
        const resp = await fetch(`${this.baseUrl}/api/chat`,{

            method: "POST",
            headers:{
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                prompt,
                system: opts.system,
                temperature: opts.temperature ?? 0.9,
            }),
            signal: opts.signal,
        });

        if(!resp.ok){
            const err = await safeJson(resp);
            throw new Error(err?.error ?? `HTTP ${resp.status}`);
        }

        const data = (await resp.json()) as {text: string};
        return data.text?.trim() ?? "";
    }
}

async function safeJson(r: Response){
    try{ return await r.json(); } catch { return null;}
}