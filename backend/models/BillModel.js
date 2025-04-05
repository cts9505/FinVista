import mongoose from 'mongoose';

const BillSchema = new mongoose.Schema({
    userId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        },
    name: {
      type: String,
      required: true,
    },
    type: {
      type: String,
    //   enum: ['electricity', 'water', 'telephone', 'internet', 'phone_recharge', 'rent', 'subscription', 'other'],
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    dueDate: {
      type: Date,
      required: true
    },
    recurrence: {
      type: String,
      enum: ['monthly', 'quarterly', 'biannual', 'annual', 'once'],
      required: true
    },
    reminderDays: {
      type: Number,
      default: 3,
      min: 0,
      max: 30
    },
    description: {
      type: String,
      trim: true
    },
    isPaid: {
      type: Boolean,
      default: false
    }
  }, { timestamps: true });
  
const BillModel = mongoose.model('Bills', BillSchema);
  
export default BillModel;