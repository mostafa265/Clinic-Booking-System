const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");

const opts = { toJSON: { virtuals: true } };

const doctorSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
    },
    name: String,
    images: [
      {
        url: String,
        filename: String,
      },
    ],
    geometry: {
      type: {
        type: String,
        enum: ["Point"],
        required: true,
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },
    specialize: String,
    phoneNumber: [Number],
    address: String,
    description: String,
    medicine: [String],
    patients: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "PrivetPatient",
      },
    ],
  },
  opts
);

doctorSchema.virtual("properties.popUpMarkup").get(function () {
  return `<strong><a href="/doctors/${this._id}/view">${this.name}</a><strong>`;
  // <p>${this.description.substring(0, 20)}</p> //add this to the string if you want to view the description below the doctor name.
});
doctorSchema.plugin(passportLocalMongoose);

// const Doctor = new mongoose.model("Doctor", doctorSchema);
module.exports = new mongoose.model("Doctor", doctorSchema);

// const addDoctor = async () => {
//   const newDoctor = new Doctor({
//     name: "Sami",
//     specialize: "Nerves",
//     phongNumbers: [888323432],
//     address: "Al_Jumhoria",
//   });
//   const savedDoctor = await newDoctor.save();
//   console.log(savedDoctor);
// };

// const addNumber = async (id, num) => {
//   const foundDoctor = await Doctor.findById(id);
//   foundDoctor.phongNumbers.push(num);
//   const res = await foundDoctor.save();
//   console.log(res);
// };

// module.exports = { addDoctor, addNumber };

// addDoctor();
// addNumber("64bd9516c209445a2ae0b949", 542445423);
