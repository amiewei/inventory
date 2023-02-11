const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const BootsSchema = new Schema({
  name: { type: String, required: true },
  terrain: { 
    type: String, 
    enum: ["All Mountain", "Park", "Powder", "Backcountry"],
    default: "All Mountain",
    required: true },
  stock: { type: Number, required: true },
  price: { type: Number, required: true },
  collections: [{ type: Schema.Types.ObjectId, ref: "Collection" }],
  // pattern: [{ type: Schema.Types.ObjectId, ref: "Pattern" }],
});


// Virtual for book's URL
BootsSchema.virtual("url").get(function () {
  console.log('boots virtual url' + this)
  // We don't use an arrow function as we'll need the this object
  return `/boots/${this._id}`;
});

// compile model from schema and Export model
module.exports = mongoose.model("Boots", BootsSchema);
