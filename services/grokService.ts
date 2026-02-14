
import Groq from "groq-sdk";

const groq = new Groq({
    apiKey: process.env.GROK_API_KEY,
    dangerouslyAllowBrowser: true
});

const VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";
const TEXT_MODEL = process.env.GROK_MODEL || "llama-3.1-8b-instant";

export async function analyzeEcg(base64Image: string) {
    if (!process.env.GROK_API_KEY) {
        throw new Error("GROK_API_KEY is missing from environment variables.");
    }

    const response = await groq.chat.completions.create({
        model: VISION_MODEL,
        messages: [
            {
                role: "user",
                content: [
                    {
                        type: "text",
                        text: `You are an expert board-certified cardiologist. Analyze this ECG image and return a JSON object containing:
            1. detectedConditions: string[] (use codes like AMI, IMI, AFIB, STACH, LVH, SBRAD, LVOLT, SR, NORM, VTAC, SVT)
            2. primaryFinding: string (extremely detailed clinical description of the morphology, axis, and specific lead findings)
            3. confidence: number (0.0 to 1.0)
            4. heartRate: number
            5. recommendations: string[] (Physician-level clinical steps, e.g., 'Immediate 12-lead acquisition', 'Troponin-I protocol', 'Beta-blocker contraindication assessment', 'Preparations for PCI')
            
            Be extremely conservative. If you see ANY signs of Acute Myocardial Infarction (AMI), ischemia, or life-threatening arrhythmias, prioritize them with maximum urgency.
            Return ONLY the raw JSON object.`
                    },
                    {
                        type: "image_url",
                        image_url: {
                            url: base64Image
                        }
                    }
                ]
            }
        ],
        response_format: { type: "json_object" }
    });

    try {
        let content = response.choices[0]?.message?.content;
        if (!content) throw new Error("Empty response from AI");

        // Robust JSON extraction in case the model returns markdown
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        const jsonString = jsonMatch ? jsonMatch[0] : content;

        return JSON.parse(jsonString.trim());
    } catch (e: any) {
        console.error("Failed to parse Grok response", e);
        throw new Error(`Grok Analysis Error: ${e.message || e}`);
    }
}

export async function generateClinicalInsight(conditions: string[]) {
    const response = await groq.chat.completions.create({
        model: TEXT_MODEL,
        messages: [
            {
                role: "system",
                content: "You are a professional cardiology triage AI. Provide a concise clinical validation note based on the detected conditions."
            },
            {
                role: "user",
                content: `Detected conditions: ${conditions.join(", ")}. Write a 1-2 sentence professional clinical insight for a triage dashboard.`
            }
        ],
        max_tokens: 100
    });

    return response.choices[0]?.message?.content || "No insight available.";
}

export async function generateSimulatedPatient() {
    const response = await groq.chat.completions.create({
        model: TEXT_MODEL,
        messages: [
            {
                role: "system",
                content: "Generate a realistic cardiologist patient for a triage system. Return JSON."
            },
            {
                role: "user",
                content: "Return a JSON object: { name: string, age: number, gender: 'M'|'F', device: string, detectedConditions: string[] (codes: AMI, IMI, AFIB, STACH, LVH, SBRAD, LVOLT, SR, NORM), urgencyScore: number (1-10), heartRate: number, confidence: number (0.0-1.0) }"
            }
        ],
        response_format: { type: "json_object" }
    });

    try {
        const content = response.choices[0]?.message?.content;
        if (!content) throw new Error("Empty");
        return JSON.parse(content);
    } catch (e) {
        return null;
    }
}
