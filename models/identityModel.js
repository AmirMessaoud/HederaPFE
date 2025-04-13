const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const identitySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    last_name: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Identity', identitySchema);
