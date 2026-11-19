
"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");
const url = require("url");

// Server settings
const PORT = 3000;
const DATA_DIRECTORY = path.join(__dirname, "data", "shelters");

// Store all shelters and applications in memory
let shelters = [];
let applications = [];
let nextApplicationId = 1;

// Load every JSON file
function loadShelters()
{
  const files = fs.readdirSync(DATA_DIRECTORY);

  shelters = files.map(file =>
  {
    const filePath = path.join(DATA_DIRECTORY, file);
    const contents = fs.readFileSync(filePath, "utf8");

    return JSON.parse(contents);
  });

  console.log(`Loaded ${shelters.length} shelters.`);
}

// Send a response to client
function sendResponse(res, statusCode, data, contentType)
{
  res.writeHead(statusCode,
  {
    "Content-Type": contentType || "application/json",
    "Access-Control-Allow-Origin": "*"
  });

  if (typeof data === "string" || Buffer.isBuffer(data))
  {
    res.end(data);
  }
  else
  {
    res.end(JSON.stringify(data));
  }
}

// Send a standard 404 response
function notFound(res)
{
  sendResponse(res, 404,
    { error: "Resource not found" });
}

// Read JSON data from a POST or PUT request
function readRequestBody(req)
{
  return new Promise((resolve, reject) =>
  {
    let body = "";

    req.on("data", chunk =>
    {
      body += chunk;

      if (body.length > 1000000)
      {
        reject(new Error("Request body too large"));
        req.destroy();
      }
    });

    req.on("end", () =>
    {
      try
      {
        resolve(JSON.parse(body));
      }
      catch (error)
      {
        reject(error);
      }
    });

    req.on("error", reject);
  });
}

// Find shelter using its ID
function findShelter(shelterId)
{
  return shelters.find(shelter =>
    shelter.id === shelterId);
}

// Find a pet inside a particular shelter
function findPet(shelter, petId)
{
  return shelter.pets.find(pet =>
    pet.id === petId);
}

// Handle incoming HTTP requests
const server = http.createServer(async (req, res) =>
{
  const parsedURL = url.parse(req.url, true);
  const pathname = parsedURL.pathname;
  const query = parsedURL.query;

  // Get shelter info
  if (req.method === "GET" && pathname === "/shelters")
  {
    // Return one complete shelter if an ID was supplied
    if (query.id)
    {
      const shelter = findShelter(query.id);

      if (!shelter)
      {
        return notFound(res);
      }

      return sendResponse(res, 200, shelter);
    }

    // Otherwise return basic shelter info only
    const basicShelters = shelters.map(shelter =>
    ({
      id: shelter.id,
      name: shelter.name,
      city: shelter.city,
      processingFee: shelter.processingFee
    }));

    return sendResponse(res, 200, basicShelters);
  }

  // Get individual pet information
  if (req.method === "GET" && pathname === "/shelters/pets")
  {
    const shelter = findShelter(query.shelterId);

    if (!shelter)
    {
      return notFound(res);
    }

    const pet = findPet(shelter, query.petId);

    if (!pet)
    {
      return notFound(res);
    }

    return sendResponse(res, 200, pet);
  }

  // POST: Submit adoption application
  if (req.method === "POST" &&
      pathname === "/submitapplication")
  {
    try
    {
      const application = await readRequestBody(req);

      const shelter = findShelter(application.shelterId);

      if (!shelter ||
          !shelter.pets.some(pet => pet.id === application.petId))
      {
        return notFound(res);
      }

      // Add server-generated application info
      application.applicationId = `a${nextApplicationId++}`;
      application.dateSubmitted = new Date().toISOString();
      application.status = "Unprocessed";

      applications.push(application);

      return sendResponse(res, 201,
      {
        message: "Application submitted successfully",
        applicationId: application.applicationId
      });
    }
    catch (error)
    {
      return sendResponse(res, 400,
      {
        error: "Invalid application data"
      });
    }
  }

  // GET: Application summary info
  if (req.method === "GET" &&
      pathname === "/applications-data")
  {
    const summary = applications.map(application =>
    ({
      dateSubmitted: application.dateSubmitted,
      applicationId: application.applicationId,
      shelterId: application.shelterId,
      petId: application.petId,
      petType: application.petType,
      status: application.status
    }));

    return sendResponse(res, 200, summary);
  }

  // PUT: Update application status
  if (req.method === "PUT" &&
      pathname === "/applications-update")
  {
    try
    {
      const data = await readRequestBody(req);

      const application = applications.find(item =>
        item.applicationId === data.applicationId);

      const validStatuses =
      [
        "Unprocessed",
        "Pending",
        "Rejected",
        "Approved"
      ];

      if (!application || !validStatuses.includes(data.status))
      {
        return notFound(res);
      }

      application.status = data.status;

      return sendResponse(res, 200,
      {
        message: "Application status updated successfully"
      });
    }
    catch (error)
    {
      return sendResponse(res, 400,
      {
        error: "Invalid update request"
      });
    }
  }

  // GET: Full application details
  if (req.method === "GET" &&
      pathname === "/applications-details")
  {
    const application = applications.find(item =>
      item.applicationId === query.id);

    if (!application)
    {
      return notFound(res);
    }

    const shelter = findShelter(application.shelterId);
    const pet = shelter
      ? findPet(shelter, application.petId)
      : undefined;

    if (!shelter || !pet)
    {
      return notFound(res);
    }

    return sendResponse(res, 200,
    {
      application: application,
      pet: pet,
      shelter:
      {
        id: shelter.id,
        name: shelter.name,
        city: shelter.city,
        processingFee: shelter.processingFee
      }
    });
  }

  // GET: Website pages
  const pageRoutes =
  {
    "/": "index.html",
    "/browse": "browse.html",
    "/about": "about.html",
    "/details": "pet.html",
    "/apply": "apply.html",
    "/applications": "applications.html"
  };

  if (req.method === "GET" && pageRoutes[pathname])
  {
    const filePath = path.join(__dirname, pageRoutes[pathname]);

    return sendFile(res, filePath);
  }

  // GET: Static files
  if (req.method === "GET")
  {
    const requestedPath = decodeURIComponent(pathname);

    const filePath = path.resolve(
      __dirname,
      "." + requestedPath
    );

    // Prevent access outside the project folder
    if (!filePath.startsWith(__dirname + path.sep))
    {
      return notFound(res);
    }

    return sendFile(res, filePath);
  }

  notFound(res);
});

// Send static files with the correct content type
function sendFile(res, filePath)
{
  const extensions =
  {
    ".html": "text/html",
    ".css": "text/css",
    ".js": "text/javascript",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".json": "application/json"
  };

  fs.readFile(filePath, (error, contents) =>
  {
    if (error)
    {
      return notFound(res);
    }

    const extension = path.extname(filePath);

    sendResponse(
      res,
      200,
      contents,
      extensions[extension] || "application/octet-stream"
    );
  });
}

// Load shelters before starting the server
try
{
  loadShelters();

  server.listen(PORT, () =>
  {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}
catch (error)
{
  console.error("Could not initialize shelter data:", error);
  process.exit(1);
}