const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const CollectionSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  gender: { type: String, required: true },
});

// Virtual for book's URL
CollectionSchema.virtual("url").get(function () {
  console.log('collection virtual url' + this)
  // We don't use an arrow function as we'll need the this object
  return `/collection/${this._id}`;
});

// compile model from schema and Export model
module.exports = mongoose.model("Collection", CollectionSchema);
