const mongoose = require("mongoose");

const memorySchema = new mongoose.Schema({
  conversationHistory: [String],
  detectedExcuses: [String],
  excuseCounts: {
    tired: Number,
    busy: Number,
    later: Number,
  },
});

module.exports = mongoose.model("Memory", memorySchema);