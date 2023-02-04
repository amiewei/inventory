const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const SnowboardSchema = new Schema({
  name: { type: String, required: true },
  terrain: { 
    type: String, 
    enum: ["All Mountain", "Park", "Powder", "Splitboard"],
    default: "All Mountain",
    required: true },
  riding_level: { 
    type: String, 
    enum: ["Beginner", "Intermediate", "Advanced"],
    default: "Intermediate",
    required: true },
  stock: { type: Number, required: true },
  price: { type: Number, required: true },
  collections: [{ type: Schema.Types.ObjectId, ref: "Collection" }],
  // pattern: [{ type: Schema.Types.ObjectId, ref: "Pattern" }],
});


// Virtual for book's URL
SnowboardSchema.virtual("url").get(function () {
  console.log('snowboard virtual url' + this)
  // We don't use an arrow function as we'll need the this object
  return `/snowboard/${this._id}`;
});

// compile model from schema and Export model
module.exports = mongoose.model("Snowboard", SnowboardSchema);
