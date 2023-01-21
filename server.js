const express = require("express");
const app = express();
const bodyParser = require("body-parser");
app.use(bodyParser.json());

const { Pool } = require('pg');

const pool = new Pool({
    user: 'amanda',
    host: 'localhost',
    database: 'cyf_hotels',
    password: '',
    port: 5432
});

app.listen(3000, function() {
    console.log("Server is listening on port 3000. Ready to accept requests!");
});

// app.get("/hotels", function(req, res) {
//     pool.query('SELECT * FROM hotels', (error, result) => {
//         res.json(result.rows);
//     });
// });

// app.get("/hotels", function (req, res) {
//     pool
//       .query('SELECT id, name, rooms, postcode FROM hotels ORDER BY ASC')
//       .then((result) => res.json(result.rows))
//       .catch((e) => console.error(e));
//   });

app.get("/hotels", function (req, res) {
    const hotelNameQuery = req.query.name;
    let query = `SELECT * FROM hotels ORDER BY name`;
  
    if (hotelNameQuery) {
      query = `SELECT * FROM hotels 
      WHERE LOWER(name) LIKE LOWER('%${hotelNameQuery}%') ORDER BY name`;
    }
  
    pool
      .query(query)
      .then((result) => res.json(result.rows))
      .catch((e) => console.error(e));
  });

app.get("/hotels/:hotelId", function (req, res) {
    const hotelId = req.params.hotelId;

    pool
        .query("SELECT * FROM hotels WHERE id=$1", [hotelId])
        .then((result) => res.json(result.rows))
        .catch((e) => console.error(e));
});



app.post("/hotels", function (req, res) {
    const newHotelName = req.body.name;
    const newHotelRooms = req.body.rooms;
    const newHotelPostcode = req.body.postcode;

    if (!Number.isInteger(newHotelRooms) || newHotelRooms <= 0) {
        return res
        .status(400)
        .send("The number of rooms should be a positive integer.");
    }

    pool
        .query("SELECT * FROM hotels WHERE name=$1", [newHotelName])
        .then((result) => {
        if (result.rows.length > 0) {
            return res
            .status(400)
            .send("An hotel with the same name already exists!");
        } else {
            const query =
            "INSERT INTO hotels (name, rooms, postcode) VALUES ($1, $2, $3)";
            pool
            .query(query, [newHotelName, newHotelRooms, newHotelPostcode])
            .then(() => res.send("Hotel created!"))
            .catch((e) => console.error(e));
        }
        });
});

app.get("/customers", function (req, res) {
    const customersNameQuery = req.query.name;
    let query = `SELECT * FROM hotels ORDER BY name`;
  
    if (customersNameQuery) {
      query = `SELECT * FROM customers 
      WHERE LOWER(name) LIKE LOWER('%${customersNameQuery}%') ORDER BY name`;
    }
  
    pool
      .query(query)
      .then((result) => res.json(result.rows))
      .catch((e) => console.error(e));
  });

  //falta uma sobre customersID copy paste update

app.get("/customers/:customerId/bookings", function(req, res){
  const customerId = req.params.customerId;

  let query = `
    Select 
    c.name customer_name,
    b.checkin_date, b.nights, 
    h.name hotel_name, 
    h.postcode hotel_postcode
    from bookings b
    join customers c
    on c.id = b.customer_id
    join hotels h
    on h.id = b.hotel_id
    where customer_id = $1
  `

  pool
    .query(query, [customerId])
    .then((result) => res.json(result.rows))
    .catch((e) => console.error(e));
})

  app.patch("/customers/:customerId", function (req, res) {
    const customerId = req.params.customerId;
    const newEmail = req.body.email;
  
    pool
      .query("UPDATE customers SET email=$1 WHERE id=$2", [newEmail, customerId])
      .then(() => res.send(`Customer ${customerId} updated!`))
      .catch((e) => console.error(e));
  });


// PATCH customers/:customerId
//
// To test:
// $ curl -X PATCH -H "Content-Type: application/json" -d '{"email":"john.smith@johnsmith.org"}' http://127.0.0.1:3000/customers/999
app.patch("/customers/:customerId", function (req, res) {
  const customerId = req.params.customerId;
  const newEmail = req.body.email;

  pool
    .query("UPDATE customers SET email=$1 WHERE id=$2", [newEmail, customerId])
    .then((result) => {
      if (result.rowCount > 0) {
          return res.send(`Customer ${customerId} updated!`)
      } else {
          return res.send(`Customer ${customerId} not found!`)
      }
  })
    .catch((e) => console.error(e));
});

app.delete("/customers/:customerId", function (req, res) {
  const customerId = req.params.customerId;

  pool
    .query("DELETE FROM bookings WHERE customer_id=$1", [customerId])
    .then(() => {
      pool
        .query("DELETE FROM customers WHERE id=$1", [customerId])
        .then(() => res.send(`Customer ${customerId} deleted!`))
        .catch((e) => console.error(e));
    })
    .catch((e) => console.error(e));
});

app.delete("/hotels/:hotelId", function (req, res) {
  const hotelId = req.params.hotelId;

  pool
    .query("SELECT FROM bookings WHERE hotel_id=$1", [hotelId])
    .then ((result)=> {
      if(result.rowCount == 0) {
       pool
        .query("DELETE FROM hotels WHERE id=$1", [hotelId])
        .then(() => res.send(`Hotel ${hotelId} deleted!`))
        .catch((e) => console.error(e));
      } else {
        res.send(`Can't delete hotel ${hotelId}`)
      }
    })
    .catch((e) => console.error(e));
});