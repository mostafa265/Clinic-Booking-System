const Service = require("node-windows").Service;

const svc = new Service({
  name: "Clinic Schedule",
  description: "This is a description",
  script: "D:\\Web development\\Clinic_Schedule\\app.js",
  wait: 10,
});

svc.on("uninstall", function () {
  console.log("uninstalled complete");
});

svc.uninstall();

// var Service = require("node-windows").Service;
// var svc = new Service({
//   name: "Service name",
//   description: "Node.js service description goes here.",
//   script: "D:\\Web development\\Clinic_Schedule\\app.js",
// });

// svc.on("uninstall", function () {
//   console.log("uninstalled complete");
// });

// svc.uninstall();
