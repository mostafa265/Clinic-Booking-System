const Service = require("node-windows").Service;

const svc = new Service({
  name: "Clinic Schedule",
  description: "This is a description",
  script: "D:\\Web development\\Clinic_Schedule\\app.js",
});

svc.on("install", function () {
  svc.start();
});

svc.install();
