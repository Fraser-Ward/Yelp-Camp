if (process.env.NODE_ENV !== "production") {
    require("dotenv").config()
};

const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const ejsMate = require("ejs-mate");
const session = require("express-session");
const flash = require("connect-flash");
const ExpressError = require("./utils/expressError");
const methodOverride = require("method-override");
const passport = require("passport") // multiple strategies for authentication
const LocalStrategy = require("passport-local");
const User = require("./models/user");
const mongoSanitize = require("express-mongo-sanitize"); // security to prevent Mongo injection
const helmet = require("helmet");
const MongoDBStore = require("connect-mongo")(session);

const userRoutes = require("./routes/users");
const campgroundRoutes = require("./routes/campgrounds"); // campgrounds routes
const reviewRoutes = require("./routes/reviews"); // reviews routes

const dbUrl = process.env.DB_URL;
// 'mongodb://localhost:27017/yelp-camp';

mongoose.connect(dbUrl, {
    useNewUrlParser: true,
    // useCreateIndex: true,
    useUnifiedTopology: true
    // useFindAndModify: false
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database connected")
});
// logic to check for errors

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"))

app.engine("ejs", ejsMate)
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method")); // uses method on every http request 
app.use(express.static(path.join(__dirname, "public")));
app.use(mongoSanitize()); // security to prevent db injection

const secret = process.env.SECRET || "thishouldbeasecret";

const store = new MongoDBStore({
    url: dbUrl,
    secret,
    touchAfter: 24 * 60 * 60, // 24 hour update 
});

store.on("error", function (e) {
    console.log("SESSION STORE ERROR!", e)
});

const sessionConfig = {
    store,
    name: "session",
    secret,
    resave: false,
    saveUninitialized: true,
    cookie: {
        // secure: true (runs on https)
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7,
        httpOnly: true
    }
}

app.use(session(sessionConfig)); // new session id cookie
app.use(flash());
app.use(helmet());

const scriptSrcUrls = [
    "https://stackpath.bootstrapcdn.com/",
    "https://api.tiles.mapbox.com/",
    "https://api.mapbox.com/",
    "https://kit.fontawesome.com/",
    "https://cdnjs.cloudflare.com/",
    "https://cdn.jsdelivr.net",
];
const styleSrcUrls = [
    "https://kit-free.fontawesome.com/",
    "https://stackpath.bootstrapcdn.com/",
    "https://api.mapbox.com/",
    "https://api.tiles.mapbox.com/",
    "https://fonts.googleapis.com/",
    "https://use.fontawesome.com/",
];
const connectSrcUrls = [
    "https://api.mapbox.com/",
    "https://a.tiles.mapbox.com/",
    "https://b.tiles.mapbox.com/",
    "https://events.mapbox.com/",

];
const fontSrcUrls = [];
app.use(
    helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: [],
            connectSrc: ["'self'", ...connectSrcUrls],
            scriptSrc: ["'unsafe-inline'", "'self'", ...scriptSrcUrls],
            styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
            workerSrc: ["'self'", "blob:"],
            objectSrc: [],
            imgSrc: [
                "'self'",
                "blob:",
                "data:",
                "https://res.cloudinary.com/dbxitax6n/", //cloud account
                "https://images.unsplash.com/",
            ],
            fontSrc: ["'self'", ...fontSrcUrls],
        },
    })
);

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser()); // stores and unstores user in a session

app.use((req, res, next) => {
    console.log(req.session);
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
});

app.use("/", userRoutes); // using the routes required at the top of the file
app.use("/campgrounds", campgroundRoutes); // prefixes http link
app.use("/campgrounds/:id/reviews", reviewRoutes); // prefixes http link

app.get("/", (req, res) => {
    res.render("home")
});

app.all("*", (req, res, next) => {
    next(new ExpressError("Page Not Found", 404))
})

// Error handler 
app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    if (!err.message) err.message = "Oh no, something went wrong!"
    res.status(statusCode).render("error", { err }); //links to error.ejs page
})



const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Serving on Port: ${port}!`);
});