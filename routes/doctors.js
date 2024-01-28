const express = require("express");
const router = express.Router();
const multer = require("multer");
const { storage } = require("../Cloudinary");
const upload = multer({ storage });
const Patient = require("../module/Patients");
const PrivetPatient = require("../module/PrivetPatient");
const Doctor = require("../module/Doctors");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");
const Joi = require("joi");
const { PatientSchema } = require("../schemas");
const User = require("../module/users");
const passport = require("passport");
const { isLoggedIn, storeReturnTo } = require("../utils/isLoggedIn");
// const { storeReturnTo } = require("../middleware");
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const mapBoxtoken = process.env.MAPBOX_TOKEN;
const geocoder = mbxGeocoding({ accessToken: mapBoxtoken });
const { cloudinary } = require("../Cloudinary");

router.get("/doctorTest", (req, res) => {
  res.send("Doctor route test");
});

router.get("/register", (req, res) => {
  res.render("tamples/register");
});

router.post(
  "/register",
  catchAsync(async (req, res) => {
    try {
      const geoData = await geocoder
        .forwardGeocode({
          query: req.body.address,
          limit: 1,
        })
        .send();
      const {
        username,
        email,
        name,
        specialize,
        phoneNumber,
        // phoneNumber2,
        address,
        password,
      } = req.body;
      // res.send(geoData.body.features[0].geometry.coordinates);
      // console.log("req.body", req.body);
      const newDoctor = new Doctor({
        username,
        email,
        geometry: geoData.body.features[0].geometry,
        name,
        specialize,
        phoneNumber,
        // phoneNumber2,
        address,
      });
      const registerD = await User.register(newDoctor, password);
      await newDoctor.save();
      await registerD.save();
      req.login(registerD, (err) => {
        if (err) return next(err);
        else {
          req.flash("success", "Welcome!");
          // console.log(registerD);
          // console.log(newDoctor);
          console.log("Geometry: ", newDoctor.geometry);
          res.redirect(`/doctors/${newDoctor._id}/show`);
        }
      });
    } catch (e) {
      req.flash("error", e.message);
      res.redirect("register");
    }
  })
);

router.get("/login", (req, res) => {
  res.render("tamples/login");
});

router.post(
  "/login",
  // use the storeReturnTo middleware to save the returnTo value from session to res.locals:
  storeReturnTo,
  // passport.authenticate logs the user in and clears req.session
  passport.authenticate("local", {
    failureFlash: true,
    failureRedirect: "/login",
  }),
  // Now we can use res.locals.returnTo to redirect the user after login
  catchAsync(async (req, res) => {
    const { username } = req.body;
    const foundDoctor = await Doctor.findOne({ username });
    const redirectUrl =
      res.locals.returnTo || `/doctors/${foundDoctor._id}/show`; // update this line to use res.locals.returnTo now
    req.flash("success", "Welcome back!");
    res.redirect(redirectUrl);
  })
);

router.get("/logout", (req, res, next) => {
  req.logout(function (err) {
    if (err) {
      return next();
    }
    req.flash("success", "Goodbye");
    res.redirect("/login");
  });
});

const validatePatient = (req, res, next) => {
  const result = PatientSchema.validate(req.body);
  console.log("result from validatePatient from (joi): ", result);
  if (result.error) {
    const msg = result.error.details.map((el) => el.message).join(",");
    throw new AppError(msg, 400);
  } else {
    next();
  }
};

const isAuther = async (req, res, next) => {
  const { id } = req.params;
  const foundDoc = await Doctor.findById(id);
  if (!foundDoc._id.equals(req.user._id)) {
    req.flash("error", "You do not have the permission, please login first!");
    return res.redirect("/login");
  }
  next();
};

router.get(
  "/doctors/:id/view",
  catchAsync(async (req, res) => {
    const { id } = req.params;
    const foundDoctor = await Doctor.findById(id);
    res.render("tamples/view", { foundDoctor });
  })
);
router.get(
  "/doctors/:id/map",
  isLoggedIn,
  isAuther,
  catchAsync(async (req, res) => {
    const { id } = req.params;
    const foundDoctor = await Doctor.findById(id);
    res.render("tamples/map", { foundDoctor });
  })
);
router.get(
  "/doctors/:id/clinicPage",
  isLoggedIn,
  isAuther,
  catchAsync(async (req, res) => {
    const { id } = req.params;
    const foundDoctor = await Doctor.findById(id);
    res.render("tamples/clinicPage", { foundDoctor });
  })
);

router.get(
  "/doctors/search",
  catchAsync(async (req, res) => {
    const doctors = await Doctor.find();
    res.render("tamples/clusterMap", { doctors });
  })
);

router.post(
  "/doctors/:id/clinicPage",
  isLoggedIn,
  isAuther,
  // upload.single("image"), //to upload a single file
  upload.array("Image"),
  catchAsync(async (req, res) => {
    const { id } = req.params;
    const foundDoctor = await Doctor.findById(id);
    const imgs = req.files.map((f) => ({
      url: f.path,
      filename: f.filename,
    }));
    foundDoctor.images.push(...imgs);
    const FD = await foundDoctor.save();
    console.log("FD is ////////", FD);
    // console.log(req.body, "req.files is:", req.files);
    res.redirect(`/doctors/${foundDoctor._id}/show`);
  })
);
// router.post(
//   "/doctors/:id/location",
//   isLoggedIn,
//   isAuther,
//   catchAsync(async (req, res) => {
//     const { id } = req.params;

//   })
// );
router.get("/doctors/:id/show", isLoggedIn, isAuther, async (req, res) => {
  const { id } = req.params;
  // console.log("foundDoctor: ", foundDoctor);
  const foundDoctor = await Doctor.findById(id).populate("patients");
  const patients = foundDoctor.patients;
  // console.log("patients: ", patients);
  const today = new Date().toISOString().substr(0, 10);
  res.render("tamples/show_doctor", {
    foundDoctor,
    patients,
    today,
    foundPatient: "",
    success: req.flash("success"),
  });
  // res.send(`Patient: ${id}`);
});

router.get(
  "/doctors/:id/comments",
  isLoggedIn,
  isAuther,
  catchAsync(async (req, res) => {
    const { id } = req.params;
    const foundDoctor = await Doctor.findById(id);
    res.render("tamples/doctorComments", { foundDoctor });
  })
);

router.get(
  "/doctors/:id/comments/delete",
  isLoggedIn,
  isAuther,
  catchAsync(async (req, res) => {
    const { id } = req.params;
    const foundDoctor = await Doctor.findById(id);
    res.render("tamples/deleteComments", { foundDoctor });
  })
);

router.post(
  "/doctors/:id/comments/delete",
  isLoggedIn,
  isAuther,
  catchAsync(async (req, res) => {
    const { id } = req.params;
    const foundDoctor = await Doctor.findById(id);
    console.log("req.body is delete route for comments: ", req.body);
    // let { deleteImages } = req.body;
    let deleteImages = req.body.deleteImage;

    if (Array.isArray(req.body.deleteImage)) {
      console.log("This is an array");
      // deleteImages = req.body.deleteImage;
    } else if (typeof req.body.deleteImage === "string") {
      console.log("This is a string");
      deleteImages = [req.body.deleteImage];
    } else {
      console.log("This is neither a string nor an array");
    }
    console.log("Delete Images is: ", deleteImages);

    if (deleteImages) {
      for (let filename of deleteImages) {
        // console.log("filename is : ", filename);
        await cloudinary.uploader.destroy(filename);
      }
      await foundDoctor.updateOne({
        $pull: { images: { filename: { $in: deleteImages } } },
      });
      // console.log("foundDoctor to delete image: ", foundDoctor);
    }
    res.redirect(`/doctors/${foundDoctor._id}/comments`);
  })
);

// app.get("/doctors/:id/edit", async (req, res) => {
//   const { id } = req.params;
//   const foundDoctor = await Doctor.findById(id);
//   res.render("tamples/edit", { foundDoctor });
// });

router.post(
  "/doctors/:id/edit",
  isLoggedIn,
  isAuther,
  catchAsync(async (req, res) => {
    const { id } = req.params;
    const foundDoctor = await Doctor.findById(id);
    const doctors = await Doctor.find({});
    res.render("tamples/doctors", { foundDoctor, doctors });
  })
);

router.post(
  "/doctors/:id/newpatient",
  isLoggedIn,
  isAuther,
  validatePatient,
  catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const foundDoctor = await Doctor.findById(id);
    // console.log("foundDoctor: ", foundDoctor);

    // if (!req.body.name || !req.body.age || !req.body.phoneNumber) {
    //   throw new AppError("Uncomplete Data", 400);
    // }

    // <script>alert("Hahaha!")</script>

    const newPatient = new PrivetPatient({
      name: req.body.name.trim(),
      age: req.body.age,
      gender: req.body.gender,
      phoneNumber: req.body.phoneNumber,
      address: req.body.address,
      date: req.body.date,
      doctor: id,
    });
    // console.log("newPatient Is:", newPatient);

    const newP2 = foundDoctor.patients.push(newPatient);
    // console.log("newP Is:", newP2);
    // newPatient.doctors.push(id);
    // await newP2.save();
    await newPatient.save();
    await foundDoctor.save();

    let fp = null;
    if (req.body.phoneNumber) {
      fp = await Patient.findOne({
        $or: [
          {
            name: req.body.name.trim(),
            age: req.body.age,
          },
          { phoneNumber: req.body.phoneNumber },
        ],
      });
    } else {
      fp = await Patient.findOne({
        name: req.body.name.trim(),
        age: req.body.age,
      });
    }

    // console.log("fp is found", fp);
    if (fp) {
      fp.doctors.push(newPatient);
      await fp.save();
    } else {
      const newP = new Patient({
        name: req.body.name.trim(),
        age: req.body.age,
        gender: req.body.gender,
        phoneNumber: req.body.phoneNumber,
        address: req.body.address,
      });
      newP.doctors.push(newPatient);
      await newP.save();
    }
    req.flash("success", "Saved success");
    res.redirect(`/doctors/${id}/show`);
  })
);

router.post(
  "/doctors/:doctorId/:patientId/treatment",
  isLoggedIn,
  isAuther,
  catchAsync(async (req, res) => {
    const { doctorId, patientId } = req.params;
    const foundDoctor = await Doctor.findById(doctorId);
    const foundPatient = await PrivetPatient.findById(patientId);
    // let today = new Date().toLocaleDateString();
    // console.log("foundpatient in treatment route", foundPatient);
    // console.log("req.body:", req.body);

    let today = new Date().toLocaleDateString();

    foundPatient.visties.push({
      date: today,
      medicine: req.body,
    });
    await foundPatient.save();
    req.flash("success", "Successfully added");
    res.redirect(`/patients/${doctorId}/${patientId}/show`);
  })
);

router.post(
  "/doctors/:id/:patientId/edit",
  isLoggedIn,
  isAuther,
  catchAsync(async (req, res) => {
    const { id, patientId } = req.params;
    const foundDoctor = await Doctor.findById(id).populate("patients");
    const foundPatient = await PrivetPatient.findById(patientId);
    // console.log("foundPatinet: ", foundPatient);
    const patients = foundDoctor.patients;
    res.render("tamples/show_doctor", { foundDoctor, foundPatient, patients });
  })
);

router.patch(
  "/doctors/:id/:patientId/edit",
  isLoggedIn,
  isAuther,
  catchAsync(async (req, res) => {
    const { id, patientId } = req.params;
    const updatedP = await PrivetPatient.findByIdAndUpdate(
      patientId,
      {
        name: req.body.name.trim(),
        age: req.body.age,
        gender: req.body.gender,
        phoneNumber: req.body.phoneNumber,
        address: req.body.address,
        date: req.body.date,
      },
      {
        runValidators: true,
        new: true,
      }
    )
      .then((response) => {
        console.log("updated successfuly:", response);
      })
      .catch((err) => {
        // console.log("Error occurs when updated: ", updatedP, err);
      });
    //   console.log(updatedP);
    req.flash("success", "Saved success");
    res.redirect(`/doctors/${id}/show`);
  })
);

router.put(
  "/doctors/:id/edit",
  isLoggedIn,
  isAuther,
  catchAsync(async (req, res) => {
    const { id } = req.params;
    // console.log(req.body);
    const updatedD = await Doctor.findByIdAndUpdate(id, req.body, {
      runValidators: true,
      new: true,
    });
    //   console.log(updatedP);
    req.flash("success", "Edited success");

    res.redirect("/admin/doctors");
  })
);

router.delete(
  "/doctors/:id/:patientId/delete",
  isLoggedIn,
  isAuther,
  catchAsync(async (req, res) => {
    const { id, patientId } = req.params;
    await PrivetPatient.findByIdAndDelete(patientId);
    const foundDoctor = await Doctor.findById(id).populate("patients");
    // console.log("foundDoctor in delete: ", foundDoctor);
    await foundDoctor.patients.pull(patientId);
    await foundDoctor.save();
    req.flash("success", "Successfully deleted");
    res.redirect(`/doctors/${id}/show`);
  })
);

module.exports = router;
