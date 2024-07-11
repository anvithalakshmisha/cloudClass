const express = require("express");
const routes = require("./api/router");
const unauthenticatedroutes = require("./api/unauthenticatedapi");
const fileupload = require("express-fileupload");
const app = express();

// convert to json
app.use(express.json());
app.use(fileupload())
app.use("/", unauthenticatedroutes);
app.use("/", routes);

app.listen(3000, () => {
  console.log("listening to port 3000");
});


// TODO
// multiple single updates - handle this case