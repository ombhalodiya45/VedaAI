import { Schema, model, Document } from 'mongoose';

export interface IGroup extends Document {
  name: string;
  subject: string;
  grade: string;
  description: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

const GroupSchema = new Schema<IGroup>(
  {
    name:        { type: String, required: true, trim: true },
    subject:     { type: String, default: '', trim: true },
    grade:       { type: String, default: '' },
    description: { type: String, default: '' },
    userId:      { type: String, required: true, index: true },
  },
  { timestamps: true }
);

export const Group = model<IGroup>('Group', GroupSchema);
