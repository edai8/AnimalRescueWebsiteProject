
"use strict";

// Set up shared layout
renderSharedLayout("browse");

// Read IDs from URL
const params = new URLSearchParams(window.location.search);

const petId = params.get("petId");
const shelterId = params.get("shelterId");

const detailsContainer = document.querySelector("#pet-details");
const backLink = document.querySelector("#back-to-browsing");

// Preserve selected shelter
backLink.href =
  `/browse?shelterId=${encodeURIComponent(shelterId || "")}`;

// Display errors
function displayError()
{
  detailsContainer.className = "";
  detailsContainer.innerHTML = `
    <div class="empty-state">
      <h2>Pet Not Found</h2>
      <p>
        We could not find that pet at the selected shelter.
        Please return to browsing.
      </p>
      <a class="button" href="/browse">Browse Pets</a>
    </div>
  `;
}

// Check required URL parameters
if (!petId || !shelterId)
{
  displayError();
}
else
{
  // Request pet information
  const petRequest = fetch(
    `/shelters/pets?petId=${encodeURIComponent(petId)}&shelterId=${encodeURIComponent(shelterId)}`
  )
    .then(response =>
    {
      if (!response.ok)
      {
        throw new Error("Pet not found");
      }

      return response.json();
    });

  // Request basic shelter information
  const shelterRequest = fetch(
    `/shelters?id=${encodeURIComponent(shelterId)}`
  )
    .then(response =>
    {
      if (!response.ok)
      {
        throw new Error("Shelter not found");
      }

      return response.json();
    });

  // Wait until BOTH requests finish
  Promise.all([petRequest, shelterRequest])
    .then(([pet, shelter]) =>
    {
      document.title =
        `New Home Animal Rescue - ${pet.name}`;

      const totalFee =
        pet.adoptionFee + shelter.processingFee;

      detailsContainer.innerHTML = `
        <div>
          <img
            class="pet-detail-image"
            src="/${escapeHTML(pet.image)}"
            alt="Photo of ${escapeHTML(pet.name)}"
          >
        </div>

        <div class="pet-detail-content">
          <p class="eyebrow">
            ${escapeHTML(shelter.name)}
          </p>

          <h2>${escapeHTML(pet.name)}</h2>

          <p class="pet-subtitle">
            ${getPetAge(pet.age)}
            ${escapeHTML(pet.breed)}
            (${escapeHTML(pet.type)})
          </p>

          <h3>Health</h3>
          <p>${escapeHTML(pet.health)}</p>

          <h3>Personality &amp; Traits</h3>
          <ul class="detail-list">
            ${pet.traits.map(trait =>
              `<li>${escapeHTML(trait)}</li>`
            ).join("")}
          </ul>

          <h3>About ${escapeHTML(pet.name)}</h3>
          <p>
            ${escapeHTML(pet.name)} has been waiting at
            ${escapeHTML(shelter.name)} for
            ${pet.daysAtShelter} days.
          </p>

          <h3>Adoption Fees</h3>

          <table class="fee-table">
            <tbody>
              <tr>
                <td>Adoption fee</td>
                <td>${formatMoney(pet.adoptionFee)}</td>
              </tr>

              <tr>
                <td>Shelter processing fee</td>
                <td>${formatMoney(shelter.processingFee)}</td>
              </tr>

              <tr class="fee-total">
                <td>Total before taxes</td>
                <td>${formatMoney(totalFee)}</td>
              </tr>
            </tbody>
          </table>

          <button type="button" class="button" id="apply-button">
            Apply to Adopt this Pet
          </button>
        </div>
      `;

      // Navigate to application form
      document.querySelector("#apply-button")
        .addEventListener("click", () =>
        {
          const query = new URLSearchParams(
          {
            petId: pet.id,
            shelterId: shelter.id,
            petName: pet.name,
            petType: pet.type,
            petBreed: pet.breed,
            adoptionFee: String(pet.adoptionFee),
            processingFee: String(shelter.processingFee)
          });

          window.location.href = `/apply?${query.toString()}`;
        });
    })
    .catch(error =>
    {
      console.error(error);
      displayError();
    });
}