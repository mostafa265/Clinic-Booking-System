const express = require("express");
const router = express.Router();
const Patient = require("../module/Patients");
const PrivetPatient = require("../module/PrivetPatient");
const Doctor = require("../module/Doctors");
// const AppError = require("../AppError");
const catchAsync = require("../utils/catchAsync");
const Joi = require("joi");
const AppError = require("../utils/AppError");

// Middleware Admin Authintication (demo) //
// router.use((req, res, next) => {
//   if (req.path.includes("admin")) {
//     const { password } = req.query;
//     if (password === "kali") {
//       console.log("Welcome sir");
//       next();
//     } else {
//       res.send("YOU ARE NOT ALLOWED!");
//     }
//   } else {
//     next();
//   }
// });

const verifyAdmin = (req, res, next) => {
  const { password } = req.query;
  if (password === "kali") {
    next();
  } else {
    throw new AppError("YOU ARE NOT ALLOWED!", 403);
    // res.send("YOU ARE NOT ALLOWED!");
  }
};

router.post("/Digispark/test", (req, res) => {
  console.log(req.body);
  res.send(req.body);
});

router.get("/printer", (req, res) => {
  res.render("tamples/printer");
});

router.post("/printer", (req, res) => {
  const { pages, sheetNumber } = req.body;
  console.log("Pages:", pages);
  console.log("sheetNumber:", sheetNumber);
  let result = [];
  let result_2 = [];

  // x
  let x = 1;
  result.push(x);
  x = x + 1;
  result.push(x);

  // y
  let y = 3;
  result_2.push(y);
  y = y + 1;
  result_2.push(y);

  while (x <= pages) {
    x = x + 3;
    result.push(x);
    x = x + 1;
    result.push(x);

    y = y + 3;
    result_2.push(y);
    y = y + 1;
    result_2.push(y);
  }
  while (result[result.length - 1] > pages) {
    result.pop();
  }
  while (result_2[result_2.length - 1] > pages) {
    result_2.pop();
  }
  res.send(`First: [${result}] ------------ Second: [${result_2}]`);
});

router.get("/admin", (req, res) => {
  res.send("Welcome sir");
});

// patients
router.get(
  "/admin/patients",
  catchAsync(async (req, res) => {
    const patients = await Patient.find({});
    res.render("admin/patients", { patients, foundPatient: "" });
  })
);

router.post(
  "/admin/patients/:id",
  catchAsync(async (req, res) => {
    // for edit button
    const { id } = req.params;
    const foundPatient = await Patient.findById(id);
    const patients = await Patient.find({});
    res.render("admin/patients", { foundPatient, patients });
  })
);

router.put(
  "/admin/patients/:id/edit",
  catchAsync(async (req, res) => {
    const { id } = req.params;
    // console.log(req.body);
    const updatedP = await Patient.findByIdAndUpdate(id, req.body, {
      runValidators: true,
      new: true,
    });
    req.flash("success", "Saved success");
    res.redirect(`/admin/patients`);
  })
);

router.patch(
  "/admin/patients/:id/edit",
  catchAsync(async (req, res) => {
    const { id } = req.params;
    // console.log(req.body);
    const updatedP = await Patient.findByIdAndUpdate(id, req.body, {
      runValidators: true,
      new: true,
    });
    //   console.log(updatedP);
    req.flash("success", "Saved success");
    res.redirect(`/admin/patients/${id}/show`);
  })
);

router.get(
  "/admin/patients/:id/show",
  catchAsync(async (req, res) => {
    const { id } = req.params;
    // console.log("in show route");
    const foundPatient = await Patient.findById(id).populate({
      path: "doctors",
      populate: { path: "doctor", model: "Doctor" },
    });
    if (!foundPatient) {
      req.flash("error", "Cannot find that patient");
      return res.redirect("/admin/patients");
    }
    // console.log("found patient: ", foundPatient);
    const doctors = foundPatient.doctors;
    // console.log("First doctors.visties", doctors[0].visties);
    // console.log("First doctors.visties", doctors[0].doctor);
    res.render("admin/show", { foundPatient, doctors });
  })
);

/// doctors ///
router.get(
  "/doctors",
  catchAsync(async (req, res) => {
    const doctors = await Doctor.find({});
    res.render("tamples/doctors", { doctors, foundDoctor: "" });
  })
);

router.get(
  "/admin/doctors",
  catchAsync(async (req, res) => {
    const doctors = await Doctor.find({});
    res.render("tamples/doctors", {
      doctors,
      foundDoctor: "",
      message: req.flash("success"),
    });
  })
);

router.post(
  "/admin/doctors/new",
  catchAsync(async (req, res) => {
    const newDoctor = new Doctor({
      name: req.body.name,
      specialize: req.body.specialize,
      phoneNumber: [req.body.phoneNumber, req.body.phoneNumber2],
      address: req.body.address,
    });
    // newDoctor.phoneNumber.push(req.body.phoneNumber2);
    await newDoctor.save();
    req.flash("success", "Saved successfully");
    res.redirect("/admin/doctors");
  })
);

router.delete(
  "/patients/:id/delete",
  catchAsync(async (req, res) => {
    //   console.log(req.params);
    const { id } = req.params;
    await Patient.findByIdAndDelete(id);
    req.flash("success", "Deleted success");
    res.redirect("/admin/patients");
  })
);

router.put(
  "/patients/:id/edit",
  catchAsync(async (req, res) => {
    const { id } = req.params;
    // console.log(req.body);
    const updatedP = await PrivetPatient.findByIdAndUpdate(id, req.body, {
      runValidators: true,
      new: true,
    });
    //   console.log(updatedP);
    req.flash("success", "Saved success");

    res.redirect(`/patients/${id}/show`);
  })
);

router.delete(
  "/doctors/:id/delete",
  catchAsync(async (req, res) => {
    // app.js;
    //   console.log(req.params);
    const { id } = req.params;
    await Doctor.findByIdAndDelete(id);
    req.flash("success", "Deleted success");
    res.redirect("/admin/doctors");
  })
);

router.get(
  "/admin/patients/:id/edit",
  catchAsync(async (req, res) => {
    const { id } = req.params;
    const foundPatient = await Patient.findById(id);
    res.render("admin/edit", { foundPatient });
  })
);

module.exports = router;
