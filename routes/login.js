var express = require('express');
var router = express.Router();

router.route('/')
  .post(function(req, res) {
    
    var token = jwt.sign(req.body, 'secret', {
      expiresIn:60*60*24
    });
    res.json({
      success:true,
      message: 'this is the tokken',
      token:token
    });
  })
  .get(function(req,res){
    res.json({ message: 'lalalalala;'});
    console.log(req);
  });

module.exports = router;