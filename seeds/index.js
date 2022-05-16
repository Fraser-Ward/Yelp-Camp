const mongoose = require("mongoose");
const Campground = require("../models/campground");
// const cities = require("./cities");
const UKcities = require("./citiesUK");
const { places, descriptors } = require("./seedHelpers");

mongoose.connect("mongodb://localhost:27017/yelp-camp", {
  useNewUrlParser: true,
  // useCreateIndex: true,
  useUnifiedTopology: true
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
  console.log("Database connected")
});

const sample = array => array[Math.floor(Math.random() * array.length)]
// random number from an array

const seedDB = async () => {
  await Campground.deleteMany({});
  for (let i = 0; i < 200; i++) {
    const random100 = Math.floor(Math.random() * 100);
    const price = Math.floor(Math.random() * 20) + 10;
    const camp = new Campground({
      author: "61d6d441fbe65661b0f538ef",
      title: `${sample(descriptors)} ${sample(places)}`,
      location: `${UKcities[random100].city}, ${UKcities[random100].country}`,
      description: "Lorem ipsum, dolor sit amet consectetur adipisicing elit. Amet, dolorum temporibus. Incidunt est, accusamus nulla expedita, dolorum porro laudantium sunt mollitia enim modi distinctio eveniet fugiat consequuntur reiciendis repellat? Quasi?",
      price,
      geometry: {
        type: "Point",
        coordinates: [
          UKcities[random100].longitude,
          UKcities[random100].latitude,
        ]
      },
      images: [
        {
          url: 'https://res.cloudinary.com/dbxitax6n/image/upload/v1641908164/YelpCamp/ruthny3d1nhj2g5g3cfa.jpg',
          filename: 'YelpCamp/ruthny3d1nhj2g5g3cfa',
        },
        {
          url: 'https://res.cloudinary.com/dbxitax6n/image/upload/v1641908166/YelpCamp/snzeafbovtizo6jvobtx.jpg',
          filename: 'YelpCamp/snzeafbovtizo6jvobtx',
        },
        {
          url: 'https://res.cloudinary.com/dbxitax6n/image/upload/v1641908168/YelpCamp/e18atc7kxy6tu86wuybq.jpg',
          filename: 'YelpCamp/e18atc7kxy6tu86wuybq',
        }
      ]
    })
    await camp.save();
  }
}
seedDB().then(() => {
  mongoose.connection.close()
});
// closes database once the random seed data is added