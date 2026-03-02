export interface ChatResponse {
  message: string;
  timestamp: string;
  suggestions?: string[];
}

class ChatService {
  private knowledgeBase: Record<string, string> = {
    'northern leaf blight': 'Northern Leaf Blight is a fungal disease caused by Exserohilum turcicum. It causes long, elliptical lesions with tan centers and dark borders on corn leaves. It thrives in warm, humid conditions.',
    'gray leaf spot': 'Gray Leaf Spot is caused by Cercospora zeae-maydis. It appears as rectangular, grayish-brown lesions on leaves. The disease is favored by high humidity and warm temperatures.',
    'common rust': 'Common Rust is caused by Puccinia sorghi. It produces small, reddish-brown pustules on both leaf surfaces. The disease spreads through wind-borne spores.',
    'prevention': 'Prevention strategies include: using resistant corn varieties, practicing crop rotation, maintaining proper plant spacing for air circulation, avoiding excessive nitrogen fertilization, and monitoring weather conditions.',
    'treatment': 'Treatment options include: applying fungicides containing strobilurin, triazole, or propiconazole active ingredients. Remove infected plant debris and practice good field sanitation.',
    'symptoms': 'Common disease symptoms include: leaf lesions, discoloration, wilting, stunted growth, and reduced yield. Early detection is crucial for effective treatment.',
  };

  async processMessage(message: string): Promise<ChatResponse> {
    const lowerMessage = message.toLowerCase();
    
    for (const [keyword, response] of Object.entries(this.knowledgeBase)) {
      if (lowerMessage.includes(keyword)) {
        return {
          message: response,
          timestamp: new Date().toISOString(),
          suggestions: this.getSuggestions(lowerMessage),
        };
      }
    }

    return {
      message: "I'm here to help with corn disease identification and management. You can ask me about specific diseases like Northern Leaf Blight, Gray Leaf Spot, or Common Rust. I can also provide information on prevention methods and treatment options.",
      timestamp: new Date().toISOString(),
      suggestions: [
        'How to identify Northern Leaf Blight?',
        'What are the best prevention methods?',
        'Treatment options for Common Rust',
        'When is the best time to inspect crops?',
      ],
    };
  }

  private getSuggestions(message: string): string[] {
    if (message.includes('identify') || message.includes('symptoms')) {
      return [
        'How to identify Northern Leaf Blight?',
        'Gray Leaf Spot symptoms',
        'Common Rust identification',
      ];
    }
    if (message.includes('prevent') || message.includes('protect')) {
      return [
        'Prevention strategies',
        'Resistant varieties',
        'Crop rotation benefits',
      ];
    }
    if (message.includes('treat') || message.includes('cure')) {
      return [
        'Fungicide options',
        'Organic treatments',
        'Treatment timing',
      ];
    }
    return [];
  }
}

export const chatService = new ChatService();
