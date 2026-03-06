import Groq from 'groq-sdk';

export interface ChatResponse {
  message: string;
  timestamp: string;
  suggestions?: string[];
}

const GROQ_API_KEY = process.env.GROQ_API_KEY || '';

const SYSTEM_PROMPT = `You are an expert agricultural assistant specialized in corn (maize) leaf diseases.
Your role is to help farmers identify, prevent, and treat corn leaf diseases.

You have expertise in:
- Northern Leaf Blight (Exserohilum turcicum)
- Gray Leaf Spot (Cercospora zeae-maydis)
- Common Rust (Puccinia sorghi)
- Southern Corn Leaf Blight
- General corn crop health and management

Guidelines:
- Give concise, practical advice that farmers can act on
- When discussing diseases, mention symptoms, causes, and treatments
- Suggest prevention strategies when relevant
- If asked about something unrelated to corn/agriculture, politely redirect to your area of expertise
- Keep responses under 200 words unless detailed explanation is needed`;

class ChatService {
  private groq: Groq | null = null;

  constructor() {
    if (GROQ_API_KEY) {
      this.groq = new Groq({ apiKey: GROQ_API_KEY });
      console.log('[Chat] Groq AI initialized (llama-3.3-70b-versatile)');
    } else {
      console.warn('[Chat] GROQ_API_KEY not set - chatbot will use fallback responses');
    }
  }

  async processMessage(message: string): Promise<ChatResponse> {
    if (this.groq) {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          return await this.groqResponse(message);
        } catch (error: any) {
          const status = error?.status || error?.statusCode;
          if (status === 429 && attempt === 0) {
            console.warn('[Chat] Rate limited, retrying in 2s...');
            await new Promise(r => setTimeout(r, 2000));
            continue;
          }
          console.error('[Chat] Groq API error:', error?.message || error);
          break;
        }
      }
    }
    return this.fallbackResponse(message);
  }

  private async groqResponse(message: string): Promise<ChatResponse> {
    const completion = await this.groq!.chat.completions.create({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: message },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 500,
    });

    const response = completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.';
    console.log('[Chat] Groq response received');

    return {
      message: response,
      timestamp: new Date().toISOString(),
      suggestions: this.getSuggestions(message.toLowerCase()),
    };
  }

  private fallbackResponse(message: string): ChatResponse {
    const lowerMessage = message.toLowerCase();
    const knowledgeBase: Record<string, string> = {
      'blight': 'Northern Leaf Blight is a fungal disease caused by Exserohilum turcicum. It causes long, elliptical lesions with tan centers and dark borders on corn leaves. Treatment includes fungicides containing strobilurin or triazole.',
      'gray leaf spot': 'Gray Leaf Spot is caused by Cercospora zeae-maydis. It appears as rectangular, grayish-brown lesions on leaves. Use resistant varieties and apply fungicides when conditions favor disease.',
      'common rust': 'Common Rust is caused by Puccinia sorghi. It produces small, reddish-brown pustules on both leaf surfaces. Apply fungicides early and use resistant hybrids.',
      'prevention': 'Prevention strategies: use resistant corn varieties, practice crop rotation, maintain proper plant spacing, avoid excessive nitrogen, and scout fields regularly.',
      'treatment': 'Treatment options: apply fungicides (strobilurin, triazole, or propiconazole). Remove infected debris and practice good field sanitation. Timing is critical - apply at first sign of disease.',
    };

    for (const [keyword, response] of Object.entries(knowledgeBase)) {
      if (lowerMessage.includes(keyword)) {
        return { message: response, timestamp: new Date().toISOString(), suggestions: this.getSuggestions(lowerMessage) };
      }
    }

    return {
      message: "I'm here to help with corn disease identification and management. Ask me about specific diseases like Northern Leaf Blight, Gray Leaf Spot, or Common Rust, or about prevention and treatment options.",
      timestamp: new Date().toISOString(),
      suggestions: [
        'How to identify Northern Leaf Blight?',
        'What are the best prevention methods?',
        'Treatment options for Common Rust',
        'When should I apply fungicide?',
      ],
    };
  }

  private getSuggestions(message: string): string[] {
    if (message.includes('identify') || message.includes('symptoms')) {
      return ['Gray Leaf Spot symptoms', 'Common Rust identification', 'When to worry about blight?'];
    }
    if (message.includes('prevent') || message.includes('protect')) {
      return ['Best resistant varieties', 'Crop rotation benefits', 'Optimal plant spacing'];
    }
    if (message.includes('treat') || message.includes('fungicide')) {
      return ['Best fungicide timing', 'Organic treatment options', 'How often to spray?'];
    }
    return ['How to prevent corn diseases?', 'Best treatment options', 'Identify my crop disease'];
  }
}

export const chatService = new ChatService();
