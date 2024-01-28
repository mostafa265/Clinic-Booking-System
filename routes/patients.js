const express = require("express");
const router = express.Router();
const Patient = require("../module/Patients");
const PrivetPatient = require("../module/PrivetPatient");
const Doctor = require("../module/Doctors");
const catchAsync = require("../utils/catchAsync");
const { isLoggedIn } = require("../utils/isLoggedIn");

router.get("/patientsTest", (req, res) => {
  res.send("patient route test");
});

router.get(
  "/patients/:id",
  catchAsync(async (req, res) => {
    //   console.log(req.params);
    const { id } = req.params;
    const foundPatient = await Patient.findById(id);

    res.render("tamples/show", { foundPatient });
  })
);

router.get(
  "/patients/:id/edit",
  catchAsync(async (req, res) => {
    const { id } = req.params;
    const foundPatient = await Patient.findById(id);
    res.render("patient_view/edit", { foundPatient });
  })
);

router.post(
  "/patients/new",
  catchAsync(async (req, res) => {
    const newPatient = new Patient({
      name: req.body.name,
      age: req.body.age,
      gender: req.body.gender,
      phoneNumber: req.body.phoneNumber,
      address: req.body.address,
    });
    await newPatient.save();
    req.flash("success", "Successfully added new patient");

    res.redirect("/admin/patients");
  })
);

router.post(
  "/patients/:id",
  catchAsync(async (req, res) => {
    const { id } = req.params;
    const foundPatient = await Patient.findById(id);
    const patients = await Patient.find({});
    res.render("tamples/patients", { foundPatient, patients });
  })
);

router.get(
  "/patients/:id/show",
  catchAsync(async (req, res) => {
    const { id } = req.params;
    // console.log("in show route");
    const foundPatient = await Patient.findById(id).populate("doctors");
    // console.log("found patient: ", foundPatient);
    const doctors = foundPatient.doctors;
    // console.log("doctors", doctors);
    res.render("patient_view/view", { foundPatient, doctors });
  })
);

router.get(
  "/patients/:patientId/details",
  catchAsync(async (req, res) => {
    const { patientId } = req.params;
    const foundPatient = await PrivetPatient.findById(patientId).populate({
      path: "doctor",
      model: "Doctor",
    });
    console.log("found patient in details route: ", foundPatient);
    res.render("patient_view/details", { foundPatient });
  })
);

router.get(
  "/patients/:doctorId/:patientId/show",
  isLoggedIn,
  catchAsync(async (req, res) => {
    const { doctorId, patientId } = req.params;
    const foundDoctor = await Doctor.findById(doctorId);
    // console.log("in show route");
    const foundPatient = await PrivetPatient.findById(patientId);
    res.render("tamples/show", {
      foundPatient,
      doctorId,
      foundDoctor,
      treatment: "",
    });
    // res.send(`Patient: ${id}`);
  })
);

module.exports = router;
