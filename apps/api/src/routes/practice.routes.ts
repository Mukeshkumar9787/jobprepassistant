import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { PracticeSession, KitModel } from '../models';
import { authenticate, AuthRequest } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';

const router = Router();

const recordCardSchema = z.object({
  flashcard_id: z.string(),
  confidence: z.number().int().min(1).max(5),
});

// POST /api/practice/session — Start a new practice session
router.post('/session', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { kitId } = req.body;
    if (!kitId) throw createError('kitId is required', 400, 'MISSING_KIT_ID');

    const kit = await KitModel.findOne({ _id: kitId, userId: req.userId });
    if (!kit) throw createError('Kit not found', 404, 'KIT_NOT_FOUND');

    const session = new PracticeSession({
      userId: req.userId,
      kitId: kit._id,
      cards: [],
      startedAt: new Date(),
    });

    await session.save();
    res.status(201).json({ session });
  } catch (err) {
    next(err);
  }
});

// PUT /api/practice/session/:id/card — Record confidence for a card in an active session
router.put('/session/:id/card', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { flashcard_id, confidence } = recordCardSchema.parse(req.body);

    const session = await PracticeSession.findOne({ _id: req.params.id, userId: req.userId });
    if (!session) throw createError('Practice session not found', 404, 'SESSION_NOT_FOUND');

    // Remove existing score for this flashcard if present, then add new score
    session.cards = session.cards.filter((c) => c.flashcard_id !== flashcard_id);
    session.cards.push({
      flashcard_id,
      confidence,
      practiced_at: new Date(),
    });

    await session.save();
    res.json({ session });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: err.errors[0].message } });
      return;
    }
    next(err);
  }
});

// GET /api/practice/kit/:kitId/progress — Get practice statistics & Weak Spots Report (Creative Feature)
router.get('/kit/:kitId/progress', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const kit = await KitModel.findOne({ _id: req.params.kitId, userId: req.userId });
    if (!kit) throw createError('Kit not found', 404, 'KIT_NOT_FOUND');

    const sessions = await PracticeSession.find({ kitId: kit._id, userId: req.userId });

    // Aggregate flashcard ratings
    const cardConfidenceMap = new Map<string, number[]>();
    for (const session of sessions) {
      for (const card of session.cards) {
        if (!cardConfidenceMap.has(card.flashcard_id)) {
          cardConfidenceMap.set(card.flashcard_id, []);
        }
        cardConfidenceMap.get(card.flashcard_id)!.push(card.confidence);
      }
    }

    const flashcards = kit.flashcards || [];
    const totalCards = flashcards.length;
    const coveredCardsCount = cardConfidenceMap.size;

    let totalConfidenceSum = 0;
    let confidenceCount = 0;

    const cardScores: Array<{ flashcardId: string; avgConfidence: number; requirementIds: string[] }> = [];

    for (const fc of flashcards) {
      const scores = cardConfidenceMap.get(fc.id);
      if (scores && scores.length > 0) {
        const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
        totalConfidenceSum += avg;
        confidenceCount++;
        cardScores.push({ flashcardId: fc.id, avgConfidence: avg, requirementIds: fc.requirement_ids || [] });
      } else {
        // Unseen card
        cardScores.push({ flashcardId: fc.id, avgConfidence: 0, requirementIds: fc.requirement_ids || [] });
      }
    }

    const overallAverageConfidence = confidenceCount > 0 ? Number((totalConfidenceSum / confidenceCount).toFixed(2)) : 0;

    // Aggregate weak spots by requirement (Creative Feature)
    const reqConfidenceMap = new Map<string, number[]>();
    for (const cs of cardScores) {
      for (const rId of cs.requirementIds) {
        if (!reqConfidenceMap.has(rId)) {
          reqConfidenceMap.set(rId, []);
        }
        reqConfidenceMap.get(rId)!.push(cs.avgConfidence);
      }
    }

    const requirements = kit.role?.requirements || [];
    const weakestAreas: Array<{
      requirement_id: string;
      requirement_text: string;
      average_confidence: number;
    }> = [];

    for (const req of requirements) {
      const scores = reqConfidenceMap.get(req.id);
      const avgConf = scores && scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
      weakestAreas.push({
        requirement_id: req.id,
        requirement_text: req.text,
        average_confidence: Number(avgConf.toFixed(2)),
      });
    }

    // Sort weakest areas ascending by average confidence
    weakestAreas.sort((a, b) => a.average_confidence - b.average_confidence);

    res.json({
      progress: {
        total_cards: totalCards,
        covered_cards: coveredCardsCount,
        average_confidence: overallAverageConfidence,
        weakest_areas: weakestAreas.slice(0, 5), // Top 5 weakest areas
        sessions_completed: sessions.length,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
