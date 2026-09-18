import mongoose, { Schema, Document } from 'mongoose';

// ============================================================
// Item metadata for tracking generated/edited/pinned state
// ============================================================
const ItemMetaSchema = new Schema({
  origin: { type: String, enum: ['generated', 'user'], default: 'generated' },
  edited: { type: Boolean, default: false },
  pinned: { type: Boolean, default: false },
}, { _id: false });

// ============================================================
// Sub-schemas matching Appendix A structure
// ============================================================

const KitSourceSchema = new Schema({
  company: { type: String, required: true },
  company_url: { type: String, required: true },
  role: { type: String, required: true },
  location: { type: String, default: '' },
  jd_chars: { type: Number, required: true },
  researched_at: { type: String, required: true },
  pages_used: [{ type: String }],
}, { _id: false });

const CompanyBriefSchema = new Schema({
  summary: { type: String, required: true },
  what_they_do: { type: String, required: true },
  culture: { type: String },
  hiring_process: { type: String },
  interview_tips: { type: String },
  sources: [{ type: String }],
  _meta: { type: ItemMetaSchema, default: () => ({ origin: 'generated', edited: false, pinned: false }) },
}, { _id: false });

const RequirementSchema = new Schema({
  id: { type: String, required: true },
  text: { type: String, required: true },
  kind: { type: String, enum: ['technical', 'behavioural', 'domain'], required: true },
  priority: { type: String, enum: ['must', 'nice'], required: true },
}, { _id: false });

const KitRoleSchema = new Schema({
  title: { type: String, required: true },
  seniority: { type: String, required: true },
  responsibilities: [{ type: String }],
  requirements: [RequirementSchema],
}, { _id: false });

const QuestionSchema = new Schema({
  id: { type: String, required: true },
  requirement_ids: [{ type: String }],
  category: { type: String, enum: ['technical', 'behavioural', 'system-design', 'company-fit'], required: true },
  prompt: { type: String, required: true },
  answer_outline: { type: String, required: true },
  difficulty: { type: Number, enum: [1, 2, 3], required: true },
  _meta: { type: ItemMetaSchema, default: () => ({ origin: 'generated', edited: false, pinned: false }) },
}, { _id: false });

const FlashcardSchema = new Schema({
  id: { type: String, required: true },
  requirement_ids: [{ type: String }],
  front: { type: String, required: true },
  back: { type: String, required: true },
  _meta: { type: ItemMetaSchema, default: () => ({ origin: 'generated', edited: false, pinned: false }) },
}, { _id: false });

const ScheduleDaySchema = new Schema({
  day: { type: Number, required: true },
  focus: { type: String, required: true },
  question_ids: [{ type: String }],
  minutes: { type: Number, required: true },
}, { _id: false });

const KitScheduleSchema = new Schema({
  days_available: { type: Number, required: true },
  days: [ScheduleDaySchema],
}, { _id: false });

const KitCoverageSchema = new Schema({
  uncovered_requirement_ids: [{ type: String }],
  passes: { type: Number, required: true },
}, { _id: false });

// ============================================================
// Main Kit Document
// ============================================================

export interface IKit extends Document {
  userId: mongoose.Types.ObjectId;
  status: 'pending' | 'researching' | 'generating' | 'ready' | 'failed';
  generationProgress: {
    currentStep: string;
    completedSteps: string[];
    totalSteps: number;
    error?: string;
  };
  jdText: string;
  companyUrl: string;
  daysAvailable: number;
  jdHash: string; // For duplicate detection
  source: any;
  company_brief: any;
  role: any;
  questions: any[];
  flashcards: any[];
  schedule: any;
  coverage: any;
  createdAt: Date;
  updatedAt: Date;
}

const KitDocSchema = new Schema<IKit>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  status: {
    type: String,
    enum: ['pending', 'researching', 'generating', 'ready', 'failed'],
    default: 'pending',
  },
  generationProgress: {
    currentStep: { type: String, default: '' },
    completedSteps: [{ type: String }],
    totalSteps: { type: Number, default: 0 },
    error: { type: String },
  },
  jdText: { type: String, required: true },
  companyUrl: { type: String, required: true },
  daysAvailable: { type: Number, required: true },
  jdHash: { type: String, index: true },
  source: { type: KitSourceSchema },
  company_brief: { type: CompanyBriefSchema },
  role: { type: KitRoleSchema },
  questions: [QuestionSchema],
  flashcards: [FlashcardSchema],
  schedule: { type: KitScheduleSchema },
  coverage: { type: KitCoverageSchema },
}, {
  timestamps: true,
});

// Compound index for duplicate detection
KitDocSchema.index({ userId: 1, jdHash: 1, companyUrl: 1 });

export const KitModel = mongoose.model<IKit>('Kit', KitDocSchema);
