const Router = require("express").Router;
const router = new Router();

const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config")

const User = require("../models/user");
const ExpressError = require("../expressError");

/** POST /login - login: {username, password} => {token}
 *
 * Make sure to update their last-login!
 *
 **/
router.get('/login', async function(req, res, next){
    console.log("THIS IS THE RIGHT PLACE!!!!!!")
    return res.json({msg: "YOU FOUND THE GET ROUTE FOR LOGGING IN"})
})

router.post("/login", async function (req, res, next) {
  try {
    let { username, password } = req.body;
    if (await User.authenticate(username, password)) {
      let token = jwt.sign({username}, SECRET_KEY);
      User.updateLoginTimestamp(username);
      return res.json({token});
    } else {
      throw new ExpressError("Invalid username/password", 400);
    }
  }

  catch (err) {
    return next(err);
  }
});

/** POST /register - register user: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 *
 *  Make sure to update their last-login!
 */
router.post("/register", async function(req, res, next){
    try {

        const { username } = await User.register(req.body);

        const token = jwt.sign({ username }, SECRET_KEY);
        return res.json({ token })
    } catch(err) {
        return next(err)
    }
})

module.exports = router;