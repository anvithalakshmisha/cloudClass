function authUser(req, res, next) {
  if (req.authorization == false) {
    return res.status(401).send("Wrong login credentials");
  } else if (req.authorization == undefined) {
    return res.status(403).send("You need to login with right info to perform operations");
  } else{
      next();
  }
}

module.exports = authUser;
