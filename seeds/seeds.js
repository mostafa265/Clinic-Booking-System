const mongoose = require("mongoose");
const Patient = require("../module/Patients");

mongoose
  .connect("mongodb://127.0.0.1:27017/schedule-clinic", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("CONNECTION OPEN, (seeds.js)");
  })
  .catch((err) => {
    console.log("OH NO ERROR, (seeds.js)");
    console.log(err);
  });

const patientDB = async () => {
  await Patient.deleteMany({});
  console.log("deleted successfuly (seeds.js)");
  const newPatient = new Patient({
    name: "Hussein",
    age: 21,
    gender: "Male",
    phoneNumber: 7733924184,
    address: "Aljobilah",
  });
  await newPatient.save();
};

patientDB().then(() => {
  mongoose.connection.close();
  console.log("Connection closed (seeds.js)");
});
