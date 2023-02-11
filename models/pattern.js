const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const PatternSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  // snowboards: [{ type: Schema.Types.ObjectId, ref: "Snowboard" }],
});


// Virtual for book's URL
PatternSchema.virtual("url").get(function () {
  console.log('Pattern virtual url' + this)
  // We don't use an arrow function as we'll need the this object
  return `/Pattern/${this._id}`;
});

// compile model from schema and Export model
module.exports = mongoose.model("Pattern", PatternSchema);
