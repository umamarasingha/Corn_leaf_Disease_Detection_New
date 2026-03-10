import { Request, Response } from 'express';
import prisma from '../config/database';
import { aiService } from '../services/ai.service';
import { AuthRequest } from '../middleware/auth.middleware';

export async function analyzeImage(req: AuthRequest, res: Response) {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const userId = req.user!.userId;
    const imageUrl = `/uploads/${file.filename}`;

    // Read the uploaded file and convert to base64 for AI processing
    const fs = require('fs');
    const imageBuffer = fs.readFileSync(file.path);
    const imageBase64 = `data:${file.mimetype};base64,${imageBuffer.toString('base64')}`;

    const result = await aiService.predictDisease(imageBase64);

    const detection = await prisma.detection.create({
      data: {
        userId,
        imageUrl,
        disease:     result.disease,
        confidence:  result.confidence,
        severity:    result.severity,
        description: result.description,
        treatment:   result.treatment,
        prevention:  result.prevention,
        pest:            result.pest?.pest            ?? null,
        pestConfidence:  result.pest?.pestConfidence  ?? null,
        pestSeverity:    result.pest?.pestSeverity    ?? null,
        pestDescription: result.pest?.pestDescription ?? null,
        pestTreatment:   result.pest?.pestTreatment   ?? null,
        pestPrevention:  result.pest?.pestPrevention  ?? null,
      },
    });

    res.json({
      disease:     result.disease,
      confidence:  result.confidence,
      severity:    result.severity,
      description: result.description,
      treatment:   result.treatment,
      prevention:  result.prevention,
      pest:        result.pest ?? null,
      detectionId: detection.id,
    });
  } catch (error: any) {
    console.error('=== ANALYSIS ERROR ===');
    console.error('Error type:', error?.name || 'Unknown');
    console.error('Error message:', error?.message || 'No message');
    console.error('Error stack:', error?.stack || 'No stack');
    console.error('=== END ANALYSIS ERROR ===');
    
    // Provide user-friendly error message
    const errorMessage = error?.message || 'Failed to analyze image';
    res.status(500).json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
    });
  }
}

export async function getDetectionHistory(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.userId;
    const detections = await prisma.detection.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    res.json(detections);
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ error: 'Failed to get detection history' });
  }
}

export async function getDetectionDetails(req: AuthRequest, res: Response) {
  try {
    const { detectionId } = req.params;
    const detection = await prisma.detection.findUnique({
      where: { id: detectionId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!detection) {
      return res.status(404).json({ error: 'Detection not found' });
    }

    if (detection.userId !== req.user!.userId && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(detection);
  } catch (error) {
    console.error('Get detection error:', error);
    res.status(500).json({ error: 'Failed to get detection' });
  }
}

export async function deleteDetection(req: AuthRequest, res: Response) {
  try {
    const { detectionId } = req.params;
    const userId = req.user!.userId;

    const detection = await prisma.detection.findUnique({
      where: { id: detectionId },
    });

    if (!detection) {
      return res.status(404).json({ error: 'Detection not found' });
    }

    if (detection.userId !== userId && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied' });
    }

    await prisma.detection.delete({
      where: { id: detectionId },
    });

    res.json({ message: 'Detection deleted successfully' });
  } catch (error) {
    console.error('Delete detection error:', error);
    res.status(500).json({ error: 'Failed to delete detection' });
  }
}
