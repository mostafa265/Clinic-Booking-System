const mongoose = require("mongoose");

const patientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
  },
  age: {
    type: Number,
    required: [true, "Age is required"],
  },
  gender: String,
  phoneNumber: Number,
  address: String,
  doctors: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PrivetPatient",
    },
  ],
});

module.exports = mongoose.model("Patient", patientSchema);

// visties: [
//         {
//           date: String,
//           medicine: [{ name: String, function: String, useTimes: Number }],
//         },
//       ],
