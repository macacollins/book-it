'use strict';

const { DatabaseSync } = require('node:sqlite');
const database = new DatabaseSync('./notes.sqlite');
const zlib = require('node:zlib');
const http = require('http');
const { pipeline } = require('node:stream');

// database.exec('DROP TABLE IF EXISTS notes');

// Execute SQL statements from strings.
database.exec(`
  CREATE TABLE IF NOT EXISTS notes(
    key INTEGER PRIMARY KEY,
    fen TEXT,
    notes TEXT,
    move TEXT,
    repertoire TEXT,
    original_location TEXT
  ) STRICT
`);


/*
// Create a prepared statement to insert data into the database.
const insert = database.prepare('INSERT INTO data (key, fen, notes, original_location) VALUES (?, ?, ?, ?)');
// Execute the prepared statement with bound values.
insert.run(1, 'hello');
insert.run(2, 'world');
// Create a prepared statement to read data from the database.
const query = database.prepare('SELECT * FROM data ORDER BY key');
// Execute the prepared statement and log the result set.
console.log(query.all());
// Prints: [ { key: 1, value: 'hello' }, { key: 2, value: 'world' } ]
*/

var params=function(req){
    let q = decodeURI(req.url).split('?'),result={};
    if(q.length >= 2){
        q[1].split('&').forEach((item)=>{
             try {
               result[item.split('=')[0]]=item.split('=')[1];
             } catch (e) {
               result[item.split('=')[0]]='';
             }
        })
    }
    return result;
  }

const actualHandler = async (req, res) => {
    //console.log(req);
    const url = require('url').parse(req.url);
    const parsedParams = params(req);
    if (url.pathname === '/notes') {
        if (req.method === 'DELETE') {
            const requestedKey = parsedParams.key;
            console.log("Deleting note with id", requestedKey);

             // Create a prepared statement to insert data into the database.
             const deleteStatement = database.prepare('DELETE FROM notes WHERE key = ?');
             // Execute the prepared statement and log the result set.
             let results = await deleteStatement.run(requestedKey);

             return deleteStatement;


        } else if (req.method === 'GET') {
            // /notes?fen={fen}
            const requestedFEN = parsedParams.fen;
            console.log("Doing lookup for ", requestedFEN);
            let results;
            if (requestedFEN) {
                // make new
                // Create a prepared statement to insert data into the database.
                const fenQuery = database.prepare('SELECT * from notes where fen = ?');
                // Execute the prepared statement with bound values.
                results = await fenQuery.get(requestedFEN)
                console.log("run results", results);


            } else {
                // make new


                // Create a prepared statement to insert data into the database.
                const insert = database.prepare('SELECT * from notes');
                // Execute the prepared statement and log the result set.
                results = await insert.all();
                // Prints: [ { key: 1, value: 'hello' }, { key: 2, value: 'world' } ]

                console.log("location 2", JSON.stringify(results));

            }
            return results;
        } else {
            // make new
            // Create a prepared statement to insert data into the database.
            const body = await getPostBodyAsync(req);

            const fenQuery = database.prepare('SELECT * from notes where fen = ?');
            // Execute the prepared statement with bound values.
            let results = await fenQuery.get(body.fen)

            if (results) {
                
                const insert = database.prepare('UPDATE notes set notes = ? WHERE fen = ?');
                // Execute the prepared statement with bound values.
    
    
                console.log("Body we are about to insert", body);
                insert.run(body.notes, body.fen);
                // Create a prepared statement to read data from the database.
                const query = database.prepare('SELECT * FROM notes ORDER BY key');
                // Execute the prepared statement and log the result set.
                results = await query.all();
                // Prints: [ { key: 1, value: 'hello' }, { key: 2, value: 'world' } ]

                return results;
            }

            const insert = database.prepare('INSERT INTO notes (fen, notes, move, repertoire, original_location) VALUES (?, ?, ?, ?, ?)');
            // Execute the prepared statement with bound values.

            console.log("Body we are about to insert", body);
            insert.run(body.fen, body.notes, body.move, body.repertoire, body.original_location);
            // Create a prepared statement to read data from the database.
            const query = database.prepare('SELECT * FROM notes ORDER BY key');
            // Execute the prepared statement and log the result set.
            results = await query.all();
            // Prints: [ { key: 1, value: 'hello' }, { key: 2, value: 'world' } ]


            return results;
        }
    } else if (req.url === '/export') {


        // create a file to stream archive data to.
        //var output = fs.createWriteStream('example.zip');
        var archive = archiver('zip', {
            zlib: { level: 9 } // Sets the compression level.
        });

        // listen for all archive data to be written
        // 'close' event is fired only when a file descriptor is involved
        // output.on('close', function() {
        // console.log(archive.pointer() + ' total bytes');
        // console.log('archiver has been finalized and the output file descriptor has closed.');
        // });

        // This event is fired when the data source is drained no matter what was the data source.
        // It is not part of this library but rather from the NodeJS Stream API.
        // @see: https://nodejs.org/api/stream.html#stream_event_end
        // output.on('end', function() {
        // console.log('Data has been drained');
        // });

        // good practice to catch warnings (ie stat failures and other non-blocking errors)
        archive.on('warning', function(err) {
            if (err.code === 'ENOENT') {
                // log warning
            } else {
                // throw error
                throw err;
            }
        });

        // good practice to catch this error explicitly
        archive.on('error', function(err) {
            throw err;
        });

        res.writeHead(200, {
            'Content-Type': 'application/zip',
            'Content-Length': stat.size
        });

        // pipe archive data to the file
        archive.pipe(res);

        // append files from a sub-directory, putting its contents at the root of archive
        archive.directory('./temp', false);

        // finalize the archive (ie we are done appending files but streams have to finish yet)
        // 'close', 'end' or 'finish' may be fired right after calling this method so register to them beforehand
        archive.finalize();

    } else if (
      req.url.match(/\/api\/products\/([0-9]+)/) &&
      req.method === 'GET'
    ) {
      const id = req.url.split('/')[3];
      productController.getOneProduct(req, res, id);
    } else if (req.url === '/api/products' && req.method === 'POST') {
      productController.createProduct(req, res);
    } else if (
      req.url.match(/\/api\/products\/([0-9]+)/) &&
      req.method === 'PUT'
    ) {
      const id = req.url.split('/')[3];
      productController.updateProduct(req, res, id);
    } else if (
      req.url.match(/\/api\/products\/([0-9]+)/) &&
      req.method === 'DELETE'
    ) {
      const id = req.url.split('/')[3];
      productController.deleteProduct(req, res, id);
    } else {
    }
  }

  const httpServer = http.createServer(async (req, res) => {
    console.log("Got a request to ", req.method, req.url)

    if (req.method === 'OPTIONS') {

        console.log("Writing OPTIONS")
        // some defaults
        res.writeHead(200, {
            'Access-Control-Allow-Origin': "*",
            'Access-Control-Request-Method': "*",
            'Access-Control-Allow-Methods': 'OPTIONS, GET, DELETE, POST',
            'Access-Control-Allow-Headers': '*'
        })

        res.end();

        return;
    }

    let results;
    try {
        results = await actualHandler(req, res);

    } catch(e) {
        console.log(e);
    }

    if (results) {
        console.log("Returning", results);

        // some defaults
        res.writeHead(200, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': "*"
          })

        res.end(JSON.stringify(results));
    } else {
        res.writeHead(500, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': "*"
          });

        res.end('"WOW"')
    }
  });

  
  const PORT = process.env.PORT || 3001;
  
  httpServer.listen(PORT, () => {
    console.log(`Server running on PORT ${PORT}`);
  });


  // Returns a promise that resolves with the parsed JSON data of the request body.
function getPostBodyAsync(req) {
    return new Promise((resolve, reject) => {
      let body = "";
  
      req.on("data", (chunk) => {
        body += chunk;
      });
  
      req.on("end", () => {
        try {
          body = body ? JSON.parse(body) : {};
  
          resolve(body);
        } catch (error) {
          reject(error);
        }
      });
    });
  };