"use strict";

// Set up shared layout
renderSharedLayout("applications");

const tableBody =
  document.querySelector("#applications-table-body");

const message =
  document.querySelector("#applications-message");

const detailsSection =
  document.querySelector("#application-details");

let selectedApplicationId = null;

// Application statuses
const statuses =
[
  "Unprocessed",
  "Pending",
  "Rejected",
  "Approved"
];

// Convert status into a CSS class
function getStatusClass(status)
{
  return `status-${status.toLowerCase()}`;
}

// Load application information from server
function loadApplications()
{
  fetch("/applications-data")
    .then(response =>
    {
      if (!response.ok)
      {
        throw new Error("Could not retrieve applications.");
      }

      return response.json();
    })
    .then(applications =>
    {
      tableBody.replaceChildren();

      if (applications.length === 0)
      {
        message.textContent =
          "No adoption applications have been submitted yet.";

        return;
      }

      message.textContent = "";

      applications.forEach(application =>
      {
        const row = document.createElement("tr");

        const dateCell = document.createElement("td");

        dateCell.textContent =
          new Date(application.dateSubmitted).toLocaleString();

        // Application ID and view button
        const idCell = document.createElement("td");

        const idText = document.createElement("span");
        idText.textContent = application.applicationId;

        const viewButton = document.createElement("button");

        viewButton.type = "button";
        viewButton.className = "view-button";
        viewButton.textContent = "View";

        viewButton.addEventListener("click", () =>
        {
          toggleApplicationDetails(
            application.applicationId,
            viewButton
          );
        });

        idCell.append(idText, viewButton);

        // Shelter ID
        const shelterCell = document.createElement("td");
        shelterCell.textContent = application.shelterId;

        // Pet ID
        const petCell = document.createElement("td");
        petCell.textContent = application.petId;

        // Pet type
        const typeCell = document.createElement("td");
        typeCell.textContent = application.petType;

        // Status dropdown
        const statusCell = document.createElement("td");

        const statusSelect = document.createElement("select");

        statusSelect.className =
          `status-select ${getStatusClass(application.status)}`;

        statuses.forEach(status =>
        {
          const option = document.createElement("option");

          option.value = status;
          option.textContent = status;

          statusSelect.appendChild(option);
        });

        statusSelect.value = application.status;

        statusSelect.addEventListener("change", () =>
        {
          updateApplicationStatus(
            application.applicationId,
            statusSelect
          );
        });

        statusCell.appendChild(statusSelect);

        row.append(
          dateCell,
          idCell,
          shelterCell,
          petCell,
          typeCell,
          statusCell
        );

        tableBody.appendChild(row);
      });
    })
    .catch(error =>
    {
      console.error(error);

      message.textContent =
        "There was an error loading applications. Please try again.";
    });
}

// Update an application's status using PUT
function updateApplicationStatus(applicationId, select)
{
  const newStatus = select.value;

  fetch("/applications-update",
  {
    method: "PUT",

    headers:
    {
      "Content-Type": "application/json"
    },

    body: JSON.stringify(
    {
      applicationId: applicationId,
      status: newStatus
    })
  })
    .then(response =>
    {
      if (!response.ok)
      {
        throw new Error("Could not update application status.");
      }

      return response.json();
    })
    .then(data =>
    {
      message.textContent = data.message;

      select.className =
        `status-select ${getStatusClass(newStatus)}`;
    })
    .catch(error =>
    {
      console.error(error);

      message.textContent =
        "Unable to update application status.";

      // Reload the original status from server
      loadApplications();
    });
}

// Toggle application details on or off
function toggleApplicationDetails(applicationId, button)
{
  // If the same view button is pressed again, close details
  if (selectedApplicationId === applicationId)
  {
    selectedApplicationId = null;

    detailsSection.hidden = true;
    detailsSection.replaceChildren();

    button.classList.remove("selected");

    return;
  }

  // Remove the previous selection
  document.querySelectorAll(".view-button").forEach(item =>
  {
    item.classList.remove("selected");
  });

  selectedApplicationId = applicationId;

  button.classList.add("selected");

  loadApplicationDetails(applicationId);
}

// Retrieve application details
async function loadApplicationDetails(applicationId)
{
  detailsSection.hidden = false;

  detailsSection.innerHTML =
    "<p>Loading application details...</p>";

  try
  {
    const response = await fetch(
      `/applications-details?id=${encodeURIComponent(applicationId)}`
    );

    if (!response.ok)
    {
      throw new Error("Could not retrieve application details.");
    }

    const data = await response.json();

    // Check whether the user selected another application
    if (selectedApplicationId !== applicationId)
    {
      return;
    }

    const application = data.application;
    const pet = data.pet;

    // Display all application information
    detailsSection.innerHTML = `
      <p class="eyebrow">Application details</p>

      <h2>Application Information</h2>

      <div class="application-detail-grid">

        <p>
          <strong>Application ID:</strong>
          ${escapeHTML(application.applicationId)}
        </p>

        <p>
          <strong>Date Submitted:</strong>
          ${new Date(application.dateSubmitted).toLocaleString()}
        </p>

        <p>
          <strong>Status:</strong>
          ${escapeHTML(application.status)}
        </p>

        <p>
          <strong>Pet ID:</strong>
          ${escapeHTML(application.petId)}
        </p>

        <p>
          <strong>Shelter ID:</strong>
          ${escapeHTML(application.shelterId)}
        </p>

      </div>

      <h3>Pet Requested</h3>

      <img
        class="application-pet-image"
        src="/${escapeHTML(pet.image)}"
        alt="Photo of ${escapeHTML(pet.name)}">

      <div class="application-detail-grid">

        <p>
          <strong>Name:</strong>
          ${escapeHTML(pet.name)}
        </p>

        <p>
          <strong>Type:</strong>
          ${escapeHTML(pet.type)}
        </p>

        <p>
          <strong>Breed:</strong>
          ${escapeHTML(pet.breed)}
        </p>

        <p>
          <strong>Age:</strong>
          ${pet.age} years
        </p>

        <p>
          <strong>Days at Shelter:</strong>
          ${pet.daysAtShelter}
        </p>

      </div>

      <h3>Applicant Information</h3>

      <div class="application-detail-grid">

        <p>
          <strong>Name:</strong>
          ${escapeHTML(application.name)}
        </p>

        <p>
          <strong>Email:</strong>
          ${escapeHTML(application.email)}
        </p>

        <p>
          <strong>Phone:</strong>
          ${escapeHTML(application.phone)}
        </p>

        <p>
          <strong>Address:</strong>
          ${escapeHTML(application.address)}
        </p>

      </div>

      <h3>Household Details</h3>

      <div class="application-detail-grid">

        <p>
          <strong>Number of Residents:</strong>
          ${escapeHTML(application.residents)}
        </p>

        <p>
          <strong>Current Pets:</strong>
          ${escapeHTML(application.currentPets || "None specified")}
        </p>

        <p>
          <strong>Experience Level:</strong>
          ${escapeHTML(application.experience)}
        </p>

        <p>
          <strong>Pet Location:</strong>
          ${escapeHTML(application.location)}
        </p>

      </div>
    `;

  }
  catch (error)
  {
    console.error(error);

    if (selectedApplicationId === applicationId)
    {
      detailsSection.textContent =
        "Unable to load the application details.";
    }
  }
}

// Load applications when page opens
loadApplications();