// Import dependencies
if (process.env.Node_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const Patient = require("./module/Patients");
const PrivetPatient = require("./module/PrivetPatient");
const Doctor = require("./module/Doctors");
const ejsMate = require("ejs-mate");
const { privateDecrypt } = require("crypto");
const flash = require("connect-flash");
const session = require("express-session");
const AppError = require("./utils/AppError");
const catchAsync = require("./utils/catchAsync");
const Joi = require("joi");
const passport = require("passport");
const passportLocal = require("passport-local");
const LocalStrategy = require("passport-local").Strategy;
const User = require("./module/users");
const multer = require("multer");
const upload = multer({ dest: "upload/" });
const mongoSanitize = require("express-mongo-sanitize"); // to prevent mongo injection
const helmet = require("helmet");

// Create a new Express app
const app = express();

app.use(
  session({
    name: "unknown", // To change the name of session from session.sid to a name you what
    secret: "thisisnotagoodsecret!",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: true,
      // secute: true, // Use it if are using a domain name (not local-host)
      expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  })
);
app.use(flash());

// Passport Middleware //
app.use(passport.initialize());
app.use(passport.session());
app.use(mongoSanitize()); // prevent mongo injection
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
// app.use(express.urlencoded({ extended: false })); // you don't have to use bodyParser
app.use(express.static("public"));
app.set("view engine", "ejs");
app.engine("ejs", ejsMate);
app.set("views", path.join(__dirname, "/views"));
app.use(methodOverride("_method")); //to use put and patch to update
//app.use(bodyParser.json());

// Use Helmet!
app.use(helmet({ contentSecurityPolicy: false }));
// app.use(helmet()); // this will cause some issue with loading images and maps, but we will solve it below

app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  console.log("current user:", req.user);
  console.log("req.query:", req.query);
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  // console.log("flasssshhhh");
  next();
});

app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  // console.log("flasssshhhh");
  next();
});

// const dbUrl =
//   process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/secritePage";
const dbUrl = process.env.MONGODB_URI;

// Mongoose
mongoose
  .connect(dbUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("CONNECTION OPEN!!");
  })
  .catch((err) => {
    console.log("OH NO ERROR!!!!");
    console.log(err);
  });

// // Solving issues with { contentSecurityPolicy: false } :
// const scriptSrcUrls = [
//   "https://stackpath.bootstrapcdn.com/",
//   "https://api.tiles.mapbox.com/",
//   "https://api.mapbox.com/",
//   "https://kit.fontawesome.com/",
//   "https://cdnjs.cloudflare.com/",
//   "https://cdn.jsdelivr.net",
// ];
// const styleSrcUrls = [
//   "https://kit-free.fontawesome.com/",
//   "https://stackpath.bootstrapcdn.com/",
//   "https://api.mapbox.com/",
//   "https://api.tiles.mapbox.com/",
//   "https://fonts.googleapis.com/",
//   "https://use.fontawesome.com/",
// ];
// const connectSrcUrls = [
//   "https://api.mapbox.com/",
//   "https://a.tiles.mapbox.com/",
//   "https://b.tiles.mapbox.com/",
//   "https://events.mapbox.com/",
// ];
// const fontSrcUrls = [];
// app.use(
//   helmet.contentSecurityPolicy({
//     directives: {
//       defaultSrc: [],
//       connectSrc: ["'self'", ...connectSrcUrls],
//       scriptSrc: ["'unsafe-inline'", "'self'", ...scriptSrcUrls],
//       styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
//       workerSrc: ["'self'", "blob:"],
//       objectSrc: [],
//       imgSrc: [
//         "'self'",
//         "blob:",
//         "data:",
//         "https://res.cloudinary.com/djrqpsknp/", //SHOULD MATCH YOUR CLOUDINARY ACCOUNT!
//         "https://images.unsplash.com/",
//       ],
//       fontSrc: ["'self'", ...fontSrcUrls],
//     },
//   })
// );

// Defining an async utility //

// Admin routes //
const adminRoutes = require("./routes/admin");
app.use("/", adminRoutes);

// user authentication routes //
app.get("/fakeUser", async (req, res) => {
  const user = new User({
    email: "husseinfarqad@gmail.com",
    username: "husseinfarqed",
  });
  const newUser = await User.register(user, "thisisnotagoodpass!");
  res.send(newUser);
});

// Doctors routes //
const doctorRoutes = require("./routes/doctors");
app.use("/", doctorRoutes);

// Patients routes //
const patientRoutes = require("./routes/patients");
app.use("/", patientRoutes);

// Home route //
let hello = "Hello World";
app.get("/", (req, res) => {
  hello = "Hello insid get";
  res.send("Hello World!");
});

// Not Found Route Middleware //
app.use((req, res) => {
  // res.status(404).send("NOT FOUND!");
  throw new AppError("Page Not Found", 404);
});

app.use((err, req, res, next) => {
  console.log(err.name);
  return next(err);
});

app.use((err, req, res, next) => {
  if (!err.message) err.message = "Oh No, Something Went Wrong!";
  const { status = 500 } = err;
  res.status(status).render("tamples/error", { err });
});

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
