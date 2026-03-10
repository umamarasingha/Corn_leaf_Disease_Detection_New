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
    // Alias used by the 4-class model output
    'Blight': {
      description: 'A fungal disease (Northern Leaf Blight) that causes long, elliptical lesions on corn leaves, leading to significant yield loss.',
      treatment: 'Apply fungicides containing strobilurin or triazole active ingredients. Remove infected plant debris promptly.',
      prevention: 'Use resistant corn varieties, practice crop rotation, ensure proper plant spacing for air circulation.',
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

export function getPestInfo(pestName: string) {
  const pests: Record<string, any> = {
    'Fall Armyworm': {
      description: 'Fall Armyworm (Spodoptera frugiperda) is a destructive pest that feeds voraciously on corn leaves, causing windowpane damage and ragged holes.',
      treatment: 'Apply insecticides containing chlorantraniliprole, emamectin benzoate, or spinosad. Use pheromone traps for early detection and mass trapping.',
      prevention: 'Scout fields regularly, plant early-maturing varieties, use biological control agents (Trichogramma spp.), practice crop rotation.',
      severity: 'high',
    },
    'Corn Borer': {
      description: 'Corn Borer (Ostrinia furnacalis) larvae bore into stalks and ears, causing stem breakage and significant yield loss.',
      treatment: 'Apply Bacillus thuringiensis (Bt) sprays or chemical insecticides (lambda-cyhalothrin, cypermethrin) at early instar stages.',
      prevention: 'Use Bt corn varieties, destroy crop residues after harvest, release Trichogramma egg parasitoids, practice crop rotation.',
      severity: 'high',
    },
    'Aphid': {
      description: 'Corn Aphids (Rhopalosiphum maidis) colonize leaves and tassels, sucking sap and transmitting plant viruses, leading to stunted growth.',
      treatment: 'Apply insecticidal soap, neem oil, or systemic insecticides (imidacloprid, thiamethoxam) when colonies are detected.',
      prevention: 'Encourage natural predators (ladybugs, lacewings), avoid excessive nitrogen fertilization, monitor regularly during hot dry periods.',
      severity: 'medium',
    },
    'Healthy': {
      description: 'No pest infestation detected. The corn plant appears free from visible pest damage.',
      treatment: 'Continue regular monitoring and maintain good agricultural practices.',
      prevention: 'Maintain field sanitation, practice crop rotation, use resistant varieties, monitor regularly.',
      severity: 'low',
    },
    // Alias
    'maize fall armyworm': {
      description: 'A destructive pest that feeds on maize leaves, causing extensive damage to crops.',
      treatment: 'Apply insecticides containing chlorantraniliprole or emamectin benzoate. Use pheromone traps for monitoring.',
      prevention: 'Plant early-maturing varieties, use biological control agents, practice crop rotation, maintain field sanitation.',
      severity: 'high',
    },
  };

  return pests[pestName] || pests['Healthy'];
}
