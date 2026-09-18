import { Router, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { KitModel } from '../models';
import { authenticate, AuthRequest } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import { runGenerationPipeline } from '../services/generator/pipeline';
import { regenerateCategoryQuestions, regenerateSchedule } from '../services/kit/stateManager';
import { buildSchedule } from '../services/scheduler/allocator';
import { checkCoverage } from '../services/coverage/checker';

const router = Router();

// Validation schema for kit creation
const createKitSchema = z.object({
  jdText: z.string().min(20, 'Job description must be at least 20 characters'),
  companyUrl: z.string().min(4, 'Company website URL is required'),
  daysAvailable: z.number().int().min(1, 'Days available must be at least 1').max(60, 'Days available max 60'),
});

// SSE event emitter subscribers map per kit ID
const progressSubscribers = new Map<string, Array<(event: string, data: any) => void>>();

function notifyProgress(kitId: string, step: string, completedSteps: string[], totalSteps: number, error?: string) {
  const subs = progressSubscribers.get(kitId);
  if (subs) {
    for (const sub of subs) {
      sub('progress', { step, completedSteps, totalSteps, error });
    }
  }
}

// POST /api/kits — Create & trigger kit generation
router.post('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { jdText, companyUrl, daysAvailable } = createKitSchema.parse(req.body);

    // Hash JD + URL for duplicate detection
    const jdHash = crypto.createHash('md5').update(`${jdText}_${companyUrl}`).digest('hex');

    // Create pending Kit document in DB
    const kitDoc = new KitModel({
      userId: req.userId,
      status: 'pending',
      jdText,
      companyUrl,
      daysAvailable,
      jdHash,
      generationProgress: {
        currentStep: 'Initializing...',
        completedSteps: [],
        totalSteps: 15,
      },
    });

    await kitDoc.save();

    // Start generation pipeline asynchronously in background
    runGenerationAsync(kitDoc._id.toString(), req.userId!, jdText, companyUrl, daysAvailable);

    res.status(202).json({
      id: kitDoc._id,
      status: 'pending',
      message: 'Kit generation started',
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: err.errors[0].message } });
      return;
    }
    next(err);
  }
});

/**
 * Background worker to run generation pipeline and emit progress
 */
async function runGenerationAsync(
  kitId: string,
  userId: string,
  jdText: string,
  companyUrl: string,
  daysAvailable: number
) {
  const completedSteps: string[] = [];
  const totalSteps = 15;

  const onProgress = async (stepMsg: string) => {
    completedSteps.push(stepMsg);
    notifyProgress(kitId, stepMsg, completedSteps, totalSteps);

    // Update DB status
    await KitModel.findByIdAndUpdate(kitId, {
      status: 'generating',
      'generationProgress.currentStep': stepMsg,
      'generationProgress.completedSteps': completedSteps,
    });
  };

  try {
    const result = await runGenerationPipeline({
      jdText,
      companyUrl,
      daysAvailable,
      onProgress,
    });

    // Save final kit
    await KitModel.findByIdAndUpdate(kitId, {
      status: 'ready',
      source: result.kit.source,
      company_brief: result.kit.company_brief,
      role: result.kit.role,
      questions: result.kit.questions,
      flashcards: result.kit.flashcards,
      schedule: result.kit.schedule,
      coverage: result.kit.coverage,
      'generationProgress.currentStep': 'Complete',
    });

    notifyProgress(kitId, 'Complete', completedSteps, totalSteps);
  } catch (err) {
    const errorMsg = (err as Error).message || 'Generation failed';
    console.error(`[GenerationWorker] Kit ${kitId} failed:`, err);

    await KitModel.findByIdAndUpdate(kitId, {
      status: 'failed',
      'generationProgress.error': errorMsg,
    });

    notifyProgress(kitId, 'Failed', completedSteps, totalSteps, errorMsg);
  }
}

// GET /api/kits — List all kits for authenticated user
router.get('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const kits = await KitModel.find({ userId: req.userId })
      .select('status source role daysAvailable createdAt updatedAt generationProgress')
      .sort({ createdAt: -1 });

    res.json({ kits });
  } catch (err) {
    next(err);
  }
});

// GET /api/kits/:id — Get kit by ID
router.get('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const kit = await KitModel.findOne({ _id: req.params.id, userId: req.userId });
    if (!kit) {
      throw createError('Kit not found', 404, 'KIT_NOT_FOUND');
    }
    res.json({ kit });
  } catch (err) {
    next(err);
  }
});

// GET /api/kits/:id/stream — SSE progress stream for live kit generation
router.get('/:id/stream', authenticate, async (req: AuthRequest, res: Response) => {
  const kitId = req.params.id as string;

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const subscriber = (event: string, data: any) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  if (!progressSubscribers.has(kitId)) {
    progressSubscribers.set(kitId, []);
  }
  progressSubscribers.get(kitId)!.push(subscriber);

  // Send initial ping
  res.write(`event: connected\ndata: ${JSON.stringify({ kitId })}\n\n`);

  req.on('close', () => {
    const subs = progressSubscribers.get(kitId);
    if (subs) {
      progressSubscribers.set(
        kitId,
        subs.filter((s) => s !== subscriber)
      );
    }
  });
});

// PUT /api/kits/:id — Update full kit (save edits/reorders)
router.put('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const kit = await KitModel.findOne({ _id: req.params.id, userId: req.userId });
    if (!kit) {
      throw createError('Kit not found', 404, 'KIT_NOT_FOUND');
    }

    const { company_brief, role, questions, flashcards, schedule } = req.body;

    if (company_brief) kit.company_brief = company_brief;
    if (role) kit.role = role;
    if (questions) kit.questions = questions;
    if (flashcards) kit.flashcards = flashcards;

    // Recalculate schedule and coverage if questions or requirements changed
    if (questions || role) {
      const updatedCoverage = checkCoverage(kit.role.requirements, kit.questions, kit.coverage?.passes || 1);
      const updatedSchedule = buildSchedule(kit.questions, kit.role.requirements, kit.schedule.days_available);
      kit.coverage = updatedCoverage.coverage;
      kit.schedule = updatedSchedule;
    } else if (schedule) {
      kit.schedule = schedule;
    }

    await kit.save();
    res.json({ kit });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/kits/:id — Delete a kit
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await KitModel.deleteOne({ _id: req.params.id, userId: req.userId });
    if (result.deletedCount === 0) {
      throw createError('Kit not found', 404, 'KIT_NOT_FOUND');
    }
    res.json({ message: 'Kit deleted successfully' });
  } catch (err) {
    next(err);
  }
});

// POST /api/kits/:id/regenerate/:section — Regenerate a single section while preserving edits
router.post('/:id/regenerate/:section', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const kitDoc = await KitModel.findOne({ _id: req.params.id, userId: req.userId });
    if (!kitDoc) {
      throw createError('Kit not found', 404, 'KIT_NOT_FOUND');
    }

    const section = req.params.section as string;
    const currentKit: any = kitDoc.toObject();

    let updatedKit: any;

    if (['technical', 'behavioural', 'system-design', 'company-fit'].includes(section)) {
      updatedKit = await regenerateCategoryQuestions(currentKit, section as any);
    } else if (section === 'schedule') {
      updatedKit = regenerateSchedule(currentKit);
    } else {
      throw createError(`Invalid section to regenerate: ${section}`, 400, 'INVALID_SECTION');
    }

    kitDoc.questions = updatedKit.questions;
    kitDoc.schedule = updatedKit.schedule;
    kitDoc.coverage = updatedKit.coverage;
    kitDoc.company_brief = updatedKit.company_brief;

    await kitDoc.save();
    res.json({ kit: kitDoc });
  } catch (err) {
    next(err);
  }
});

export default router;
