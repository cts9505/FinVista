import mongoose from 'mongoose';
const { Schema } = mongoose;

// Stocks Model Schema
const StocksSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  symbol: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  buyDate: {
    type: Date,
    required: true
  },
  buyPrice: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  sector: {
    type: String
  },
  notes: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Gold Model Schema
const GoldSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['coin', 'bar', 'jewelry', 'other']
  },
  purity: {
    type: String,
    required: true
  },
  buyDate: {
    type: Date,
    required: true
  },
  buyPrice: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  description: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Mutual Fund Model Schema
const MutualFundSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  schemeName: {
    type: String,
    required: true
  },
  schemeCode: {
    type: String,
    required: true
  },
  purchaseDate: {
    type: Date,
    required: true
  },
  investmentAmount: {
    type: Number,
    required: true
  },
  units: {
    type: Number,
    required: true
  },
  notes: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Real Estate Model Schema
const RealEstateSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  propertyName: {
    type: String,
    required: true
  },
  propertyType: {
    type: String,
    required: true,
    enum: ['residential', 'commercial', 'land', 'other']
  },
  location: {
    type: String,
    required: true
  },
  area: {
    type: Number,
    required: true
  },
  purchaseDate: {
    type: Date,
    required: true
  },
  purchasePrice: {
    type: Number,
    required: true
  },
  currentValuation: {
    type: Number
  },
  notes: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});
const FixedDepositSchema = new Schema({
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    bankName: {
      type: String,
      required: true
    },
    depositAmount: {
      type: Number,
      required: true
    },
    interestRate: {
      type: Number,
      required: true
    },
    startDate: {
      type: Date,
      required: true
    },
    maturityDate: {
      type: Date,
      required: true
    },
    interestType: {
      type: String,
      enum: ['simple', 'compound'],
      default: 'compound'
    },
    compoundFrequency: {
      type: String,
      enum: ['quarterly', 'half-yearly', 'yearly'],
      default: 'quarterly'
    },
    notes: {
      type: String
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  });
  
  // PPF (Public Provident Fund) Model Schema
  const PPFSchema = new Schema({
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    accountNumber: {
      type: String,
      required: true
    },
    bankName: {
      type: String,
      required: true
    },
    openDate: {
      type: Date,
      required: true
    },
    maturityDate: {
      type: Date,
      required: true
    },
    currentInterestRate: {
      type: Number,
      required: true
    },
    totalInvestment: {
      type: Number,
      required: true,
      default: 0
    },
    yearlyContributions: [{
      year: Number,
      amount: Number,
      date: Date
    }],
    notes: {
      type: String
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  });
  
  // Cryptocurrency Model Schema
  const CryptoSchema = new Schema({
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    coinId: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    symbol: {
      type: String,
      required: true
    },
    buyDate: {
      type: Date,
      required: true
    },
    buyPrice: {
      type: Number,
      required: true
    },
    quantity: {
      type: Number,
      required: true
    },
    platform: {
      type: String
    },
    walletAddress: {
      type: String
    },
    notes: {
      type: String
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  });
  const TransactionSchema = new mongoose.Schema(
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      assetType: {
        type: String,
        enum: ["stock", "mutualFund", "gold", "crypto", "realEstate"],
        required: true,
      },
      assetId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
      },
      symbol: {
        type: String,
        required: function() {
          return this.assetType === "stock" || this.assetType === "crypto";
        },
      },
      name: {
        type: String,
        required: true,
      },
      transactionType: {
        type: String,
        enum: ["buy", "sell"],
        required: true,
      },
      buyPrice: {
        type: Number,
        required: true,
      },
      sellPrice: {
        type: Number,
        required: function() {
          return this.transactionType === "sell";
        },
      },
      quantity: {
        type: Number,
        required: true,
      },
      buyDate: {
        type: Date,
        required: true,
      },
      sellDate: {
        type: Date,
        required: function() {
          return this.transactionType === "sell";
        },
      },
      profit: {
        type: Number,
        required: function() {
          return this.transactionType === "sell";
        },
      },
      profitPercentage: {
        type: Number,
        required: function() {
          return this.transactionType === "sell";
        },
      },
      notes: {
        type: String,
      },
    },
    { timestamps: true }
  );
  
  const TransactionModel = mongoose.model("Transaction", TransactionSchema);
// Create and export models
const FixedDepositModel = mongoose.model('FixedDeposit',FixedDepositSchema );
const PPFModel = mongoose.model('PPF', PPFSchema);
const CryptoModel = mongoose.model('Crypto', CryptoSchema);
const StocksModel = mongoose.model('Stocks', StocksSchema);
const GoldModel = mongoose.model('Gold', GoldSchema);
const MutualFundModel = mongoose.model('MutualFund', MutualFundSchema);
const RealEstateModel = mongoose.model('RealEstate', RealEstateSchema);

// Export all models
export {
  FixedDepositModel,
  PPFModel,
  CryptoModel,
  StocksModel,
  GoldModel,
  MutualFundModel,
  RealEstateModel,
  TransactionModel
};