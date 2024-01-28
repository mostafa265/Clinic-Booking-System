const mongoose = require("mongoose");

const patientSchema2 = new mongoose.Schema({
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
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor" },
  visties: [
    {
      date: String,
      medicine: [{ medicineName: String, function: String, useTimes: Number }],
    },
  ],
});

module.exports = mongoose.model("PrivetPatient", patientSchema2);
