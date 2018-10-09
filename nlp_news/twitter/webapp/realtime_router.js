let router = require("express").Router();

router.get('/', function (req, res) {
	return res.render("realtime2");
});

module.exports = router;