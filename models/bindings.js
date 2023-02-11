const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const BindingsSchema = new Schema({
  name: { type: String, required: true },
  size: { 
    type: String, 
    enum: ["S", "M", "L", "XL"],
    default: "M",
    required: true },
  stock: { type: Number, required: true },
  price: { type: Number, required: true },
  collections: [{ type: Schema.Types.ObjectId, ref: "Collection" }],
});


// Virtual for book's URL
BindingsSchema.virtual("url").get(function () {
  console.log('Bindings virtual url' + this)
  // We don't use an arrow function as we'll need the this object
  return `/Bindings/${this._id}`;
});

// compile model from schema and Export model
module.exports = mongoose.model("Bindings", BindingsSchema);
