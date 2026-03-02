import bcrypt from 'bcryptjs';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function getDiseaseInfo(diseaseName: string) {
  const diseases: Record<string, any> = {
    'maize fall armyworm': {
      description: 'A destructive pest that feeds on maize leaves, causing extensive damage to crops.',
      treatment: 'Apply insecticides containing chlorantraniliprole or emamectin benzoate. Use pheromone traps for monitoring.',
      prevention: 'Plant early-maturing varieties, use biological control agents, practice crop rotation, maintain field sanitation.',
      severity: 'high',
    },
    'Northern Leaf Blight': {
      description: 'A fungal disease that causes long, elliptical lesions on corn leaves.',
      treatment: 'Apply fungicides containing strobilurin or triazole active ingredients. Remove infected plant debris.',
      prevention: 'Use resistant corn varieties, practice crop rotation, ensure proper spacing for air circulation.',
      severity: 'high',
    },
    'Gray Leaf Spot': {
      description: 'A fungal disease characterized by rectangular, grayish-brown lesions on leaves.',
      treatment: 'Apply fungicides at the first sign of disease. Use resistant hybrids when available.',
      prevention: 'Avoid excessive nitrogen fertilization, practice crop rotation, use resistant varieties.',
      severity: 'medium',
    },
    'Common Rust': {
      description: 'A fungal disease that causes small, reddish-brown pustules on leaves.',
      treatment: 'Apply fungicides with active ingredients like propiconazole or azoxystrobin.',
      prevention: 'Plant resistant hybrids, avoid late planting, monitor weather conditions.',
      severity: 'low',
    },
    'Healthy': {
      description: 'The corn leaf appears healthy with no signs of disease.',
      treatment: 'Continue regular monitoring and maintain good agricultural practices.',
      prevention: 'Maintain proper irrigation, fertilization, and pest management practices.',
      severity: 'low',
    },
  };

  return diseases[diseaseName] || diseases['Healthy'];
}
