//import all the modules
const express = require("express");
const path = require("path");
const fileUpload = require("express-fileupload");
const session = require("express-session");

//setup mongodb
const mongoose = require("mongoose");
mongoose.connect('mongodb://localhost:27017/SyedGiftShop', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});
// object reqeipt model for the DB
const Receipt = mongoose.model("Receipt", {
    sName            : String,
    sPhone           : String,
    sEmail           : String,
    sAddress         : String,
    sCity            : String,
    sProvince        : String,
    taxRates         : Number, 
    donutPrice       : Number,
    cakePrice        : Number,
    cookiePrice      : Number,
    sDonut           : Number,
    sCookie          : Number,
    sCake            : Number,
    costForDonut     : Number,
    costForCake      : Number,
    costForCookie    : Number,   
    subtotal         : Number,
    totalTax         : Number,
    totalPrice       : Number
});

// define model for admin user for DB
const Admin = mongoose.model("Admin", {
    aName : String,
    aPass : String 
});

//define Request model for DB
const Request = mongoose.model("Request",{
    rName : String,
    rEmail : String,
    rDescription : String,
    rSubject : String,
    rPhotoName : String
});

//set up express validator
const{check, validationResult} = require("express-validator");
const { exec } = require('child_process');
const { StringDecoder } = require("string_decoder");
const { request } = require("http");

//set up the app
var myApp = express();

//set up variable to use package express-session
myApp.use(session({
    secret: "8p0r2o0gs2y0e2d2",
    resave: false,
    saveUninitialized: true
}));

//set up body parser
myApp.use(express.urlencoded({extended:false}));
myApp.use(fileUpload());

//define/set the path to public and views folder
myApp.set("view engine", "ejs");
myApp.set("views", path.join(__dirname, "views"));  // set a value for express
myApp.use(express.static(__dirname+ "/public")); // set up a middleware to server static file

// define the route for index page "/"
myApp.get('/', function(req, res){
    global.adminLog = req.session.loggedIn;
    res.render("checkout");
})

// define the route for login page
myApp.get('/login', function(req, res){
    global.adminLog = req.session.loggedIn;
    res.render("login");
})

//handle post for the login form
myApp.post("/login", function(req,res){
    //fetch sname and spass
    var aName = req.body.aName;
    var aPass = req.body.aPass;
    //find it in the database
    Admin.findOne({aName: aName, aPass: aPass}).exec(function(err, admin){
        //set up the session variables for logged in user
        if(admin){
            req.session.aName = admin.aName;
            req.session.loggedIn =  true;
            //redirect to dashboard
            res.redirect("dashboard");
        }else{
            res.render("login", {errors: "errors"});
        }
        global.adminLog = req.session.loggedIn;
    })
});
// clear session for log out
myApp.get("/logout", function(req,res){
    //reset the variables for login
    req.session.aName = "";
    req.session.loggedIn = false;
    global.adminLog = req.session.loggedIn;
    res.redirect("/login");
})

// dashboard
myApp.get("/dashboard" , async function(req, res){
    if (req.session.loggedIn){
        Receipt.find({}).exec(function(err, receipts){
            Request.find({}).exec(function(err, requests){
                res.render('dashboard', {requests : requests, receipts : receipts});
            });
        });
    }else{
        res.redirect("/login");
    }
});

// define the route for the request page
myApp.get("/request", function(err, res){
    res.render("request");
});

// //define route for show request page
myApp.get("/show-request", function(req, res){
    if(req.session.loggedIn){
        res.render("show-request");
    } else{
        res.redirect("/login");
    }
    
});

//show only one request or receipt
myApp.get("/print/:checkid", function(req,res){
    
    if (req.session.loggedIn){
        var checkID = req.params.checkid;
        //check with the id if it exists in the collection Receipt 
        Receipt.countDocuments({_id: checkID}, function (err, count){
            if (count > 0){
                // fetch data for request id
                Receipt.findOne({_id: checkID}).exec(function(err, receipt){
                    res.render("receipt", receipt);
                });
            }
            else {
                //fetch data using request id from Request Collection
                Request.findOne({_id: checkID}).exec(function(err, request){
                    res.render("show-request", request);
                });
            }
        });
    }
    else{
         res.redirect("/login");
    }
});

// to delete a card from database
myApp.get("/delete-request/:requestid", function(req,res){
    if (req.session.loggedIn){
        var requestID = req.params.requestid;
        Request.findByIdAndDelete({_id: requestID}).exec(function(err, request){
            res.render("delete-request", request);
        });
    }
    else{
        res.redirect("/login");
    }
});

//edit an request
myApp.get("/edit-request/:requestid", function(req,res){
    if (req.session.loggedIn){
        var requestID = req.params.requestid;
        Request.findByIdAndUpdate({_id: requestID}).exec(function(err, request){
            res.render("edit-request", request);
        });
    }
    else{
        res.redirect("/login");
    }
});
// handle post from edit-request
myApp.post("/process-edit/:requestid", function(req,res){
    if(!req.session.loggedIn){
        res.redirect("/login");
    } else{
        var requestID = req.params.requestid;
        var rName = req.body.rName;
        var rEmail = req.body.rEmail;
        var rSubject = req.body.rSubject;
        var rDescription = req.body.rDescription;
        var rPhotoName = "";
        if (req.files != null){
            rPhotoName = req.files.rPhoto.name;
            var rPhotoFile = req.files.rPhoto;
            var rPhotoPath = "public/uploads/"+rPhotoName;
            rPhotoFile.mv(rPhotoPath, function(err){
                console.log(err);
            });
        }else if (req.body.rOldPhotoName != null) {
            rPhotoName = req.body.rOldPhotoName;
        }

        Request.findOne({_id: requestID}).exec(function(err,request){
            request.rName = rName;
            request.rEmail = rEmail;
            request.rDescription = rDescription;
            request.rSubject = rSubject;
            request.rPhotoName = rPhotoName;
            request.save();
            res.render("edit-request", {request});
        });
    }
});

//handle post from request form
myApp.post("/request",[
    check("rName").notEmpty().withMessage("Name is required")
    .matches(/^$|([a-zA-Z0-9]\s*)+$/).withMessage("Invalid name charecter"),
    check("rEmail", "Email is required").isEmail(),
    check("rSubject", "Please write a subject for your request").notEmpty(),
    check("rDescription", "Please describe your request").notEmpty()
], function(req,res){
    const rErrors = validationResult(req);
    const rErrorsMap = validationResult(req).mapped();
    if(!rErrors.isEmpty()){
        res.render("request", {
            rErrors: rErrors.array(),
            rErrorsMap: rErrorsMap,
            keepReqFormData: req.body
        });
    } else{
        var rName = req.body.rName;
        var rEmail = req.body.rEmail;
        var rSubject = req.body.rSubject;
        var rDescription = req.body.rDescription;

        var rPhotoName = "";
        
        if (req.files != null){
            rPhotoName = req.files.rPhoto.name;
            var rPhotoFile = req.files.rPhoto;
            var rPhotoPath = "public/uploads/"+rPhotoName;
            
            rPhotoFile.mv(rPhotoPath, function(err){
                console.log(err);
            });
        }

        var reqFormData = {
            rName           : rName,
            rEmail          : rEmail,
            rDescription    : rDescription,
            rSubject        : rSubject,
            rPhotoName      : rPhotoName
        };
        //create an object from the DB model to save to DB
        var userRequest = new Request(reqFormData);
        userRequest.save();
        //send the data to the view and render it 
        res.render("request", reqFormData);
    }
});

// custom function for minimum item required validation
function customItemChecker(value,{req}){
    if(req.body.sDonut > 0 || req.body.sCookie > 0 || req.body.sCake > 0){
        return true; 
    } 
    else{
        throw new Error ("*Please add atleast one product to print a reciept");
    }
}

//handle post for the checkout form
myApp.post("/",[
    check("sName")
    .notEmpty().withMessage("Name is required")
    .matches(/^$|([a-zA-Z0-9]\s*)+$/).withMessage("Invalid name charecter"),
    check("sPhone")
    .notEmpty().withMessage("Phone number is required")
    .matches(/^$|[1-9]\d{2}\d{3}\d{4}$/).withMessage("Invalid Phone Number"), 
    check("sEmail", "Valid email is required").isEmail(),
    check("sAddress","Address is required").notEmpty(),
    check("sCity","City is required").notEmpty(),
    check("sProvince","Province is required").notEmpty(),
    check("sDonut").matches(/^\d*$/).withMessage("Donut Field: a positive number is required  to add an item"),
    check("sCookie").matches(/^\d*$/).withMessage("Cookie Field: a positive number is required  to add an item"),
    check("sCake").matches(/^\d*$/).withMessage("Cake Field: a positive number is required  to add an item"),
    check("sDonut").custom(customItemChecker)
], function(req,res){
    var errors = validationResult(req);
    // if there is an error, send data to view and render the errors
    // else calculate and render receipt
    if(!errors.isEmpty())
    {
        res.render("checkout", {
            errors :    errors.array(),
            keepData:   req.body
        });
    } 
    else 
    {
        var sName = req.body.sName;
        var sEmail = req.body.sEmail;
        var sPhone = req.body.sPhone;
        var sAddress = req.body.sAddress;
        var sCity = req.body.sCity;
        var sProvince = req.body.sProvince;
        var sDonut = req.body.sDonut;
        var sCookie = req.body.sCookie;
        var sCake = req.body.sCake;

        // predfined values for item prices
        const itemPrices = { "donutPrice": 10.99, "cookiePrice": 7.99, "cakePrice": 15.99 };

        // GST/HST tax rates for different provinces in canada //Retrived on July 16, 2022 
        // from: https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/gst-hst-businesses/charge-collect-which-rate/calculator.html#rt 
        const provinceTax = { "AB":5, "BC":5,"MB":5,"NB":15,"NL":15, "NT":5,"NS":15, "NU":5,"ON":13, "PE":15, "QC":5, "SK":5,"YT":5};
        var taxRates = provinceTax[sProvince]/100;
        // used dictionary to list all the provinces along with their respective the taxes
        // it will be easier to update in the future if any province's tax rate is changed

        //receipt table, item and subtotal calculations
        var subtotal = 0;
        var costForDonut = 0;
        var costForCookie = 0;
        var costForCake = 0;
        if(sDonut>0){
            costForDonut = parseInt(sDonut)*itemPrices["donutPrice"];
            subtotal += costForDonut;
        }
        if(sCookie>0){
            costForCookie = parseInt(sCookie)*itemPrices["cookiePrice"];
            subtotal += costForCookie; 
        }    
        if(sCake>0){
            costForCake = parseInt(sCake)*itemPrices["cakePrice"];
            subtotal += costForCake;
        }
        // total tax and price 
        subtotal = Math.round(subtotal*100)/100;
        var totalTax = Math.round((subtotal*taxRates)*100)/100;
        var totalPrice = Math.round((subtotal + totalTax)*100)/100;
        
        var receiptData = {
            sName           : sName,
            sPhone          : sPhone,
            sEmail          : sEmail,
            sAddress        : sAddress,
            sCity           : sCity,
            sProvince       : sProvince,
            taxRates        : provinceTax[sProvince], 
            sDonut          : sDonut,
            donutPrice      : itemPrices["donutPrice"],
            costForDonut    : costForDonut,
            sCookie         : sCookie,
            cookiePrice     : itemPrices["cookiePrice"],
            costForCookie   : costForCookie,  
            sCake           : sCake,
            cakePrice       : itemPrices["cakePrice"],
            costForCake     : costForCake,
            subtotal        : subtotal,
            totalTax        : totalTax,
            totalPrice      : totalPrice
        }; 
        //create and object from the model and save to DB
        var myReceipt = new Receipt(receiptData) 
        myReceipt.save();
        // send the data to the view and render it
        res.render("receipt", receiptData);
    }
});

// setup username password for first time
myApp.get("/setup", function(req,res){
    let adminData = [
        {
            aName: "admin",
            aPass: "admin" 
        }
    ]
    Admin.collection.insertMany(adminData);
    res.send("Admin login credentials added");
});

//start the server (listen at a port)
myApp.listen(8080);
console.log("Everything executed, open http://localhost:8080/ in the browser.");