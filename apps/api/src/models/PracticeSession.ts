import mongoose, { Schema, Document } from 'mongoose';

export interface IPracticeSession extends Document {
  userId: mongoose.Types.ObjectId;
  kitId: mongoose.Types.ObjectId;
  cards: Array<{
    flashcard_id: string;
    confidence: number;
    practiced_at: Date;
  }>;
  startedAt: Date;
  completedAt?: Date;
}

const PracticeSessionSchema = new Schema<IPracticeSession>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  kitId: { type: Schema.Types.ObjectId, ref: 'Kit', required: true, index: true },
  cards: [{
    flashcard_id: { type: String, required: true },
    confidence: { type: Number, min: 1, max: 5, required: true },
    practiced_at: { type: Date, default: Date.now },
  }],
  startedAt: { type: Date, default: Date.now },
  completedAt: { type: Date },
}, {
  timestamps: true,
});

PracticeSessionSchema.index({ userId: 1, kitId: 1 });

export const PracticeSession = mongoose.model<IPracticeSession>('PracticeSession', PracticeSessionSchema);
